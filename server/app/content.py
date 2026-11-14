import json
from functools import lru_cache
from pathlib import Path

from app.i18n import DEFAULT_LOCALE, locale_catalog, resolve_locale
from app.schemas import ContentTexts, DemoContent, DemoStructure
from app.symbolic import expected_derivative, expressions_equivalent, parse_expression

CONTENT_PATH = Path(__file__).resolve().parents[2] / "content" / "demo.json"


def _merge_text(structure: DemoStructure, lang: str) -> dict:
    catalog = locale_catalog(lang)
    try:
        texts = ContentTexts.model_validate(catalog["content"])
    except KeyError as error:
        raise ValueError(f"Il catalogo '{lang}' non contiene la sezione 'content'.") from error

    puzzle_ids = [puzzle.id for puzzle in structure.puzzles]
    missing = [puzzle_id for puzzle_id in puzzle_ids if puzzle_id not in texts.puzzles]
    unknown = [puzzle_id for puzzle_id in texts.puzzles if puzzle_id not in puzzle_ids]
    if missing or unknown:
        raise ValueError(
            f"I testi dei puzzle non coincidono con demo.json: "
            f"mancanti={missing}, sconosciuti={unknown}."
        )

    return {
        "version": structure.version,
        "chapter": texts.chapter,
        "room": texts.room,
        "intro": texts.intro,
        "outro": texts.outro,
        "puzzles": [
            {
                **puzzle.model_dump(),
                **texts.puzzles[puzzle.id].model_dump(),
            }
            for puzzle in structure.puzzles
        ],
    }


def load_content(path: Path = CONTENT_PATH, lang: str = DEFAULT_LOCALE) -> DemoContent:
    """Carica e valida il contenuto senza dipendere dalla directory di lavoro."""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        structure = DemoStructure.model_validate(payload)
        demo = DemoContent.model_validate(_merge_text(structure, resolve_locale(lang)))
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


@lru_cache(maxsize=8)
def get_content(lang: str = DEFAULT_LOCALE) -> DemoContent:
    return load_content(lang=lang)
