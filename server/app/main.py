from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.content import get_content
from app.i18n import DEFAULT_LOCALE, message, resolve_locale
from app.schemas import HealthResponse, PublicDemo, VerifyRequest, VerifyResponse
from app.symbolic import (
    ExpressionError,
    expected_derivative,
    expressions_equivalent,
    is_product_rule_error,
    parse_expression,
)

app = FastAPI(title="Le Mille e Una Derivata API", version="demo-1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/api/demo", response_model=PublicDemo)
def demo(lang: str = DEFAULT_LOCALE) -> PublicDemo:
    return get_content(resolve_locale(lang)).to_public()


@app.post("/api/puzzles/{puzzle_id}/verify", response_model=VerifyResponse)
def verify_answer(puzzle_id: str, request: VerifyRequest) -> VerifyResponse:
    lang = resolve_locale(request.lang)
    puzzle = next((item for item in get_content(lang).puzzles if item.id == puzzle_id), None)
    if puzzle is None:
        raise HTTPException(status_code=404, detail=message("puzzleNotFound", lang))

    try:
        answer = parse_expression(request.answer)
    except ExpressionError as error:
        return VerifyResponse(
            status=error.status,
            message=message(error.key, lang),
            feedback_category=None,
        )

    expected = expected_derivative(puzzle.function_sympy)
    if expressions_equivalent(answer, expected):
        return VerifyResponse(
            status="correct",
            message=message("correct", lang),
            feedback_category=None,
        )

    if puzzle.feedback_profile == "product_rule" and is_product_rule_error(
        answer, puzzle.function_sympy
    ):
        return VerifyResponse(
            status="incorrect",
            message=message("productRule", lang),
            feedback_category="product_rule",
        )

    return VerifyResponse(
        status="incorrect",
        message=message("incorrect", lang),
        feedback_category=None,
    )
