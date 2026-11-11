from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.content import get_content
from app.schemas import HealthResponse, PublicDemo, VerifyRequest, VerifyResponse
from app.symbolic import (
    ExpressionError,
    expected_derivative,
    expressions_equivalent,
    is_product_rule_error,
    parse_expression,
)

app = FastAPI(title="Il Palazzo delle Derivate API", version="demo-1")
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
def demo() -> PublicDemo:
    return get_content().to_public()


@app.post("/api/puzzles/{puzzle_id}/verify", response_model=VerifyResponse)
def verify_answer(puzzle_id: str, request: VerifyRequest) -> VerifyResponse:
    puzzle = next((item for item in get_content().puzzles if item.id == puzzle_id), None)
    if puzzle is None:
        raise HTTPException(status_code=404, detail="Puzzle non trovato.")

    try:
        answer = parse_expression(request.answer)
    except ExpressionError as error:
        return VerifyResponse(
            status=error.status,
            message=error.message,
            feedback_category=None,
        )

    expected = expected_derivative(puzzle.function_sympy)
    if expressions_equivalent(answer, expected):
        return VerifyResponse(
            status="correct",
            message="Corretto: il meccanismo si riattiva!",
            feedback_category=None,
        )

    if puzzle.feedback_profile == "product_rule" and is_product_rule_error(
        answer, puzzle.function_sympy
    ):
        return VerifyResponse(
            status="incorrect",
            message=(
                "Hai moltiplicato le derivate dei due fattori. Per un prodotto servono "
                "entrambi i contributi: deriva un fattore mentre lasci invariato l'altro."
            ),
            feedback_category="product_rule",
        )

    return VerifyResponse(
        status="incorrect",
        message="La derivata non è equivalente: rivedi la regola applicata e i calcoli.",
        feedback_category=None,
    )
