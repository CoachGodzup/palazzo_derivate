class_name MathParser
extends RefCounted

# Small math parser used for the mock symbolic check.
#
# It tokenizes a linearized expression, inserts explicit multiplications for
# implicit products (e.g. "2x", "3(x+1)", "(x+1)(x-1)"), converts to RPN via
# shunting-yard and evaluates on sample points.
#
# Supported: numbers, variable "x", constants "pi"/"e", + - * / ^, parentheses,
# unary minus, and the function sqrt(...). Everything is parsed token by token:
# no eval of user code.
#
# This is a MOCK check (numeric sampling), not a real symbolic engine — see
# docs/DEMO_4_SCOPE.md. The real demo-1 keeps using SymPy server-side.

const ERR_EMPTY := "empty"
const ERR_SYNTAX := "syntax"
const ERR_UNSUPPORTED := "unsupported"
const ERR_DOMAIN := "domain"

enum Tok { NUM, IDENT, OP, LPAREN, RPAREN }

const FUNCTIONS := ["sqrt"]
const VALUE_IDENTS := ["x", "pi", "e"]

const SAMPLE_POINTS := [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0]
const MAX_LENGTH := 200
const REL_TOL := 1e-6
const ABS_TOL := 1e-8


static func verify(answer: String, expected: String) -> Dictionary:
	var ans := answer.strip_edges()
	if ans.is_empty():
		return {"ok": false, "error": ERR_EMPTY}
	if ans.length() > MAX_LENGTH:
		return {"ok": false, "error": ERR_UNSUPPORTED}

	var a_rpn: Variant = _compile(ans)
	if a_rpn is Dictionary:
		return {"ok": false, "error": a_rpn["error"]}

	var e_rpn: Variant = _compile(expected)
	if e_rpn is Dictionary:
		# Expected derivative must always compile; this is a data error.
		return {"ok": false, "error": ERR_SYNTAX}

	var compared := 0
	for p in SAMPLE_POINTS:
		var ev: Variant = _eval_rpn(e_rpn, p)
		var uv: Variant = _eval_rpn(a_rpn, p)
		if ev is Dictionary:
			continue  # data bug in the expected derivative: skip the point
		if uv is Dictionary:
			var ue: String = uv["error"]
			if ue == ERR_DOMAIN:
				continue  # domain error at this point only: skip it
			return {"ok": false, "error": ue}  # syntax / unsupported
		compared += 1
		if not _close(float(uv), float(ev)):
			return {"ok": false, "error": ""}
	if compared < 3:
		return {"ok": false, "error": ERR_DOMAIN}
	return {"ok": true, "error": ""}


static func _compile(src: String) -> Variant:
	var tokens: Variant = _tokenize(src)
	if tokens is Dictionary:
		return tokens
	var arr: Array = tokens
	var with_mul: Array = _insert_implicit_mul(arr)
	return _to_rpn(with_mul)


static func _close(a: float, b: float) -> bool:
	return absf(a - b) <= ABS_TOL + REL_TOL * absf(b)


static func _tokenize(src: String) -> Variant:
	var s := src.replace("\u2212", "-")  # minus sign
	s = s.replace("\u2013", "-")         # en dash
	s = s.replace("\u2014", "-")         # em dash
	s = s.replace("\u00d7", "*")         # multiplication sign
	s = s.replace("\u00b7", "*")         # middle dot
	s = s.replace("\u00f7", "/")         # division sign
	s = s.replace("\u221a", "sqrt ")     # radical sign (space detaches the radicand)
	s = s.replace("\u03c0", "pi")        # pi
	s = s.replace("**", "^")
	s = s.to_lower()

	var tokens := []
	var i := 0
	var n := s.length()
	while i < n:
		var c := s[i]
		if c == " " or c == "\t":
			i += 1
			continue
		if _is_digit(c) or c == ".":
			var j := i
			var seen_dot := false
			while j < n and (_is_digit(s[j]) or s[j] == "."):
				if s[j] == ".":
					if seen_dot:
						return {"error": ERR_SYNTAX}
					seen_dot = true
				j += 1
			tokens.append({"t": Tok.NUM, "v": s.substr(i, j - i)})
			i = j
			continue
		if _is_alpha(c):
			var j := i
			while j < n and (_is_alpha(s[j]) or _is_digit(s[j])):
				j += 1
			tokens.append({"t": Tok.IDENT, "v": s.substr(i, j - i)})
			i = j
			continue
		if c == "+" or c == "-" or c == "*" or c == "/" or c == "^":
			tokens.append({"t": Tok.OP, "v": c})
			i += 1
			continue
		if c == "(":
			tokens.append({"t": Tok.LPAREN, "v": "("})
			i += 1
			continue
		if c == ")":
			tokens.append({"t": Tok.RPAREN, "v": ")"})
			i += 1
			continue
		return {"error": ERR_UNSUPPORTED}
	return tokens


static func _insert_implicit_mul(tokens: Array) -> Array:
	var out := []
	for tok in tokens:
		if not out.is_empty() and _ends_value(out[-1]) and _starts_value(tok):
			out.append({"t": Tok.OP, "v": "*"})
		out.append(tok)
	return out


static func _is_function_name(v: String) -> bool:
	return v in FUNCTIONS


static func _is_value_ident(v: String) -> bool:
	return v in VALUE_IDENTS


static func _ends_value(tok: Dictionary) -> bool:
	if tok.t == Tok.NUM or tok.t == Tok.RPAREN:
		return true
	if tok.t == Tok.IDENT:
		return _is_value_ident(tok.v)
	return false


static func _starts_value(tok: Dictionary) -> bool:
	if tok.t == Tok.LPAREN:
		return true
	if tok.t == Tok.IDENT:
		return true
	return false


static func _to_rpn(tokens: Array) -> Variant:
	var output := []
	var stack := []
	for i in range(tokens.size()):
		var tok: Dictionary = tokens[i]
		match tok.t:
			Tok.NUM:
				output.append(tok)
			Tok.IDENT:
				if _is_value_ident(tok.v):
					output.append(tok)
				elif _is_function_name(tok.v):
					stack.append({"t": Tok.IDENT, "v": tok.v, "func": true})
				else:
					return {"error": ERR_UNSUPPORTED}
			Tok.LPAREN:
				stack.append(tok)
			Tok.RPAREN:
				var found := false
				while not stack.is_empty():
					var top: Dictionary = stack[-1]
					if top.t == Tok.LPAREN:
						stack.pop_back()
						found = true
						break
					output.append(stack.pop_back())
				if not found:
					return {"error": ERR_SYNTAX}
				if not stack.is_empty() and stack[-1].get("func", false):
					output.append(stack.pop_back())
			Tok.OP:
				if tok.v == "-" or tok.v == "+":
					var prev_unary := true
					if i > 0:
						var p: Dictionary = tokens[i - 1]
						prev_unary = (p.t == Tok.OP) or (p.t == Tok.LPAREN)
					if prev_unary:
						# Unary sign: push without popping (prefix operator).
						stack.append({"t": Tok.OP, "v": "u-", "func": false, "prec": 3, "right": true})
						continue
				var prec: int = _precedence(tok.v)
				var right: bool = tok.v == "^"
				while not stack.is_empty():
					var top: Dictionary = stack[-1]
					if top.t != Tok.OP or top.get("func", false):
						break
					if _should_pop(top, prec, right):
						output.append(stack.pop_back())
					else:
						break
				stack.append({"t": Tok.OP, "v": tok.v, "func": false, "prec": prec, "right": right})

	while not stack.is_empty():
		var top: Dictionary = stack.pop_back()
		if top.t == Tok.LPAREN:
			return {"error": ERR_SYNTAX}
		output.append(top)
	return output


static func _precedence(op: String) -> int:
	match op:
		"+", "-":
			return 1
		"*", "/":
			return 2
		"^":
			return 4
	return 0


static func _should_pop(top: Dictionary, prec: int, right: bool) -> bool:
	var t_prec: int = top.prec
	if right:
		return t_prec > prec
	return t_prec >= prec


static func _eval_rpn(rpn: Array, x: float) -> Variant:
	var stack := []
	for tok in rpn:
		match tok.t:
			Tok.NUM:
				stack.append(float(tok.v))
			Tok.IDENT:
				if _is_value_ident(tok.v):
					match tok.v:
						"x":
							stack.append(x)
						"pi":
							stack.append(PI)
						"e":
							stack.append(2.718281828459045)
				elif tok.get("func", false):
					if stack.size() < 1:
						return {"error": ERR_SYNTAX}
					var a: float = stack.pop_back()
					match tok.v:
						"sqrt":
							if a < 0.0:
								return {"error": ERR_DOMAIN}
							stack.append(sqrt(a))
						_:
							return {"error": ERR_UNSUPPORTED}
				else:
					return {"error": ERR_UNSUPPORTED}
			Tok.OP:
				if tok.v == "u-":
					if stack.size() < 1:
						return {"error": ERR_SYNTAX}
					stack.append(-float(stack.pop_back()))
				else:
					if stack.size() < 2:
						return {"error": ERR_SYNTAX}
					var b: float = stack.pop_back()
					var a: float = stack.pop_back()
					match tok.v:
						"+":
							stack.append(a + b)
						"-":
							stack.append(a - b)
						"*":
							stack.append(a * b)
						"/":
							if absf(b) < 1e-12:
								return {"error": ERR_DOMAIN}
							stack.append(a / b)
						"^":
							var r := pow(a, b)
							if is_nan(r) or is_inf(r):
								return {"error": ERR_DOMAIN}
							stack.append(r)
						_:
							return {"error": ERR_UNSUPPORTED}
	if stack.size() != 1:
		return {"error": ERR_SYNTAX}
	var res: float = stack[0]
	if is_nan(res) or is_inf(res):
		return {"error": ERR_DOMAIN}
	return res


static func _is_digit(c: String) -> bool:
	return c >= "0" and c <= "9"


static func _is_alpha(c: String) -> bool:
	return (c >= "a" and c <= "z") or (c >= "A" and c <= "Z")
