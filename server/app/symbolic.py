import re
import tokenize
from functools import lru_cache
from typing import Literal

import sympy as sp
from sympy.core.sympify import SympifyError
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication,
    parse_expr,
    standard_transformations,
)

MAX_EXPRESSION_LENGTH = 240
MAX_NODES = 100
MAX_PARENTHESES_DEPTH = 20
MAX_LITERAL_DIGITS = 12
MAX_ABS_EXPONENT = 20
MAX_EXPONENT_DENOMINATOR = 20
MAX_ABS_NUMBER = 10**12

_ALLOWED_CHARACTERS = re.compile(r"[A-Za-z0-9+\-*/^(). \t]+\Z")
_ALLOWED_NAMES = {"x", "sqrt", "exp", "ln", "sin", "cos"}
_NAME = re.compile(r"[A-Za-z]+")
_NUMBER = re.compile(r"(?:\d+(?:\.\d*)?|\.\d+)")
_TRANSFORMATIONS = standard_transformations + (convert_xor, implicit_multiplication)
_X = sp.Symbol("x", real=True)

# I costruttori numerici servono al parser; la whitelist lessicale impedisce
# all'utente di invocarli direttamente. Non viene ereditato il namespace di SymPy.
_LOCAL_DICT = {
    "x": _X,
    "sqrt": sp.sqrt,
    "exp": sp.exp,
    "ln": sp.log,
    "sin": sp.sin,
    "cos": sp.cos,
    "Integer": sp.Integer,
    "Float": sp.Float,
    "Rational": sp.Rational,
    "Symbol": sp.Symbol,
}
_ALLOWED_FUNCTIONS = {sp.sin, sp.cos, sp.exp, sp.log}


class ExpressionError(ValueError):
    def __init__(self, status: Literal["syntax_error", "unsupported_expression"], message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _unsupported(message: str) -> ExpressionError:
    return ExpressionError("unsupported_expression", message)


def _check_source(source: str) -> None:
    if not source.strip():
        raise ExpressionError("syntax_error", "Inserisci un'espressione matematica.")
    if len(source) > MAX_EXPRESSION_LENGTH:
        raise _unsupported("L'espressione supera il limite di 240 caratteri.")
    if _ALLOWED_CHARACTERS.fullmatch(source) is None:
        raise _unsupported("L'espressione contiene caratteri o costrutti non supportati.")

    for match in _NAME.finditer(source):
        if match.group() not in _ALLOWED_NAMES:
            raise _unsupported("Sono ammessi solo x e le funzioni sqrt, exp, ln, sin e cos.")

    for match in _NUMBER.finditer(source):
        digits = match.group().replace(".", "")
        if len(digits) > MAX_LITERAL_DIGITS:
            raise _unsupported("Un letterale numerico supera il limite consentito.")

    depth = 0
    for character in source:
        if character == "(":
            depth += 1
            if depth > MAX_PARENTHESES_DEPTH:
                raise _unsupported("L'espressione ha troppi livelli di parentesi.")
        elif character == ")":
            depth -= 1
            if depth < 0:
                break


def _check_expression(expression: object) -> sp.Expr:
    if not isinstance(expression, sp.Expr):
        raise _unsupported("La risposta non è un'espressione matematica supportata.")
    if expression.free_symbols - {_X}:
        raise _unsupported("L'espressione può contenere soltanto la variabile x.")
    if expression.has(sp.nan, sp.oo, -sp.oo, sp.zoo):
        raise _unsupported("NaN e infiniti non sono ammessi.")

    nodes = 0
    for _ in sp.preorder_traversal(expression):
        nodes += 1
        if nodes > MAX_NODES:
            raise _unsupported("L'espressione supera il limite di complessità.")

    for function in expression.atoms(sp.Function):
        if function.func not in _ALLOWED_FUNCTIONS:
            raise _unsupported("La funzione utilizzata non è supportata.")

    for number in expression.atoms(sp.Number):
        if isinstance(number, sp.Float) and not number.is_finite:
            raise _unsupported("I numeri devono essere finiti.")
        try:
            if abs(number) > MAX_ABS_NUMBER:
                raise _unsupported("Un letterale numerico supera il limite consentito.")
        except TypeError as error:
            raise _unsupported("Il numero utilizzato non è supportato.") from error

    for power in expression.atoms(sp.Pow):
        exponent = power.exp
        if exponent.free_symbols or not exponent.is_number:
            raise _unsupported("Sono ammessi soltanto esponenti numerici costanti.")
        if exponent.is_Integer:
            if abs(exponent) > MAX_ABS_EXPONENT:
                raise _unsupported("L'esponente supera il limite consentito.")
        elif exponent.is_Rational:
            if (
                abs(exponent.p) > MAX_ABS_EXPONENT
                or exponent.q > MAX_EXPONENT_DENOMINATOR
            ):
                raise _unsupported("L'esponente frazionario supera il limite consentito.")
        elif exponent.is_Float:
            if not exponent.is_finite or abs(exponent) > MAX_ABS_EXPONENT:
                raise _unsupported("L'esponente decimale supera il limite consentito.")
        else:
            raise _unsupported("Sono ammessi soltanto esponenti interi, frazionari o decimali.")

    return expression


def parse_expression(source: str) -> sp.Expr:
    """Interpreta AsciiMath semplice senza importare un namespace globale."""
    _check_source(source)
    try:
        expression = parse_expr(
            source,
            global_dict={},
            local_dict=_LOCAL_DICT,
            transformations=_TRANSFORMATIONS,
            evaluate=True,
        )
    except (SyntaxError, tokenize.TokenError, IndentationError) as error:
        raise ExpressionError(
            "syntax_error",
            "La sintassi non è completa: controlla parentesi, operatori e frazioni.",
        ) from error
    except (
        SympifyError,
        NameError,
        TypeError,
        ValueError,
        AttributeError,
        ArithmeticError,
        NotImplementedError,
        RecursionError,
    ) as error:
        raise _unsupported("L'espressione utilizza un costrutto non supportato.") from error
    return _check_expression(expression)


@lru_cache(maxsize=32)
def original_expression(source: str) -> sp.Expr:
    return parse_expression(source)


@lru_cache(maxsize=32)
def expected_derivative(source: str) -> sp.Expr:
    """La derivata attesa viene sempre calcolata dalla funzione originale."""
    return sp.diff(original_expression(source), _X)


def _is_zero(expression: sp.Expr) -> bool:
    return expression == sp.S.Zero or expression.is_zero is True


def expressions_equivalent(left: sp.Expr, right: sp.Expr) -> bool:
    """Confronto simbolico, senza campionamento né semplificazioni force."""
    difference = left - right
    simplifiers = [sp.expand, sp.cancel, sp.radsimp]
    if difference.has(sp.sin, sp.cos):
        simplifiers.append(lambda value: sp.trigsimp(sp.expand(value)))
    simplifiers.append(sp.simplify)

    for simplifier in simplifiers:
        try:
            if _is_zero(simplifier(difference)):
                return True
        except (ValueError, TypeError, ArithmeticError, NotImplementedError):
            continue
    return False


def is_product_rule_error(answer: sp.Expr, source: str) -> bool:
    """Riconosce soltanto il caso inequivocabile (fg)' = f'g'."""
    original = original_expression(source)
    if not isinstance(original, sp.Mul) or len(original.args) != 2:
        return False
    first, second = original.args
    if not first.has(_X) or not second.has(_X):
        return False
    product_of_derivatives = sp.diff(first, _X) * sp.diff(second, _X)
    return expressions_equivalent(answer, product_of_derivatives)
