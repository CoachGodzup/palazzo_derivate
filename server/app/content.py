import json
from functools import lru_cache
from pathlib import Path

from app.schemas import DemoContent
from app.symbolic import expected_derivative, expressions_equivalent, parse_expression

CONTENT_PATH = Path(__file__).resolve().parents[2] / "content" / "demo.json"


def load_content(path: Path = CONTENT_PATH) -> DemoContent:
    """Carica e valida il contenuto senza dipendere dalla directory di lavoro."""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        demo = DemoContent.model_validate(payload)
        for puzzle in demo.puzzles:
            calculated = expected_derivative(puzzle.function_sympy)
            declared = parse_expression(puzzle.derivative_sympy)
            if not expressions_equivalent(declared, calculated):
                raise ValueError(
                    f"La derivata configurata per {puzzle.id!r} non coincide con la funzione."
                )
        return demo
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise RuntimeError(f"Contenuto demo non valido: {path}") from error


@lru_cache(maxsize=1)
def get_content() -> DemoContent:
    return load_content()
