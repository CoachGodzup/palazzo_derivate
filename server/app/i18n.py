import json
from functools import lru_cache
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parents[2] / "content" / "locales"
DEFAULT_LOCALE = "it"


def supported_locales() -> tuple[str, ...]:
    """Le lingue disponibili sono i cataloghi presenti in content/locales."""
    return tuple(sorted(path.stem for path in LOCALES_DIR.glob("*.json")))


def resolve_locale(lang: str | None) -> str:
    if lang and lang in supported_locales():
        return lang
    return DEFAULT_LOCALE


@lru_cache(maxsize=8)
def locale_catalog(lang: str) -> dict:
    """Carica il catalogo di una lingua, con fallback alla lingua predefinita."""
    resolved = resolve_locale(lang)
    path = LOCALES_DIR / f"{resolved}.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Catalogo di lingua non valido: {path}") from error


def message(key: str, lang: str | None = None) -> str:
    """Restituisce un messaggio di gioco dal catalogo, senza testi nel codice."""
    resolved = resolve_locale(lang)
    try:
        return locale_catalog(resolved)["feedback"][key]
    except KeyError as error:
        raise RuntimeError(
            f"Testo mancante nel catalogo '{resolved}': feedback.{key}"
        ) from error
