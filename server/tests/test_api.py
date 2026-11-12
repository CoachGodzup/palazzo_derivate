from pathlib import Path

import pytest

from app.content import load_content

PUBLIC_DEMO_KEYS = {"version", "chapter", "room", "intro", "outro", "puzzles"}
PUBLIC_PUZZLE_KEYS = {
    "id",
    "order",
    "title",
    "short_title",
    "mechanism",
    "prompt",
    "function_latex",
    "hints",
    "target_seconds",
    "difficulty",
}


def verify(client, puzzle_id: str, answer: str):
    response = client.post(f"/api/puzzles/{puzzle_id}/verify", json={"answer": answer})
    assert response.status_code == 200
    assert set(response.json()) == {"status", "message", "feedback_category"}
    return response.json()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_public_demo_has_only_public_fields(client):
    response = client.get("/api/demo")
    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == PUBLIC_DEMO_KEYS
    assert payload["version"] == "demo-1"
    assert payload["chapter"] == "Capitolo I · Il cortile delle fontane"
    assert payload["room"] == "La Corte delle Meridiane"
    assert [puzzle["order"] for puzzle in payload["puzzles"]] == [1, 2, 3]

    for puzzle in payload["puzzles"]:
        assert set(puzzle) == PUBLIC_PUZZLE_KEYS
        assert "function_sympy" not in puzzle
        assert "derivative_sympy" not in puzzle
        assert len(puzzle["hints"]) == 3
        assert all(isinstance(hint, str) and hint for hint in puzzle["hints"])


def test_content_loads_independently_from_cwd(monkeypatch):
    monkeypatch.chdir(Path(__file__).parent)
    content = load_content()
    assert content.version == "demo-1"
    assert [puzzle.id for puzzle in content.puzzles] == [
        "c1-sigillo",
        "c1-ingranaggi",
        "c1-fontana",
    ]


@pytest.mark.parametrize("answer", ["6*x-5", "6x - 5", "-5+6*x"])
def test_polynomial_equivalences(client, answer):
    result = verify(client, "c1-sigillo", answer)
    assert result["status"] == "correct"
    assert result["feedback_category"] is None


@pytest.mark.parametrize(
    "answer",
    [
        "9*x^2+6*x-2",
        "6*x*(x+1)+3*x^2-2",
        "3*x^2+6*x*(x+1)-2",
        "(3*x^2-2)+6*x*(x+1)",
    ],
)
def test_product_equivalences(client, answer):
    result = verify(client, "c1-ingranaggi", answer)
    assert result["status"] == "correct"


@pytest.mark.parametrize(
    "answer",
    [
        "3/(2*sqrt(x))+3*sqrt(x)",
        "(3+6*x)/(2*sqrt(x))",
        "3*sqrt(x)+3/(2*x^(1/2))",
    ],
)
def test_radical_equivalences(client, answer):
    result = verify(client, "c1-fontana", answer)
    assert result["status"] == "correct"


@pytest.mark.parametrize(
    "answer",
    ["6*x-5^", "6*x-5^{}", "6*x-5^(())", "6*x-5^  "],
)
def test_empty_exponent_is_ignored(client, answer):
    result = verify(client, "c1-sigillo", answer)
    assert result["status"] == "correct"
    assert result["feedback_category"] is None


def test_incorrect_answer_has_generic_feedback(client):
    result = verify(client, "c1-sigillo", "6*x+5")
    assert result == {
        "status": "incorrect",
        "message": "La derivata non è equivalente: rivedi la regola applicata e i calcoli.",
        "feedback_category": None,
    }


def test_reliable_product_rule_error_has_specific_feedback(client):
    result = verify(client, "c1-ingranaggi", "6*x")
    assert result["status"] == "incorrect"
    assert result["feedback_category"] == "product_rule"


def test_other_product_error_is_not_overdiagnosed(client):
    result = verify(client, "c1-ingranaggi", "6*x+1")
    assert result["status"] == "incorrect"
    assert result["feedback_category"] is None


def test_broken_syntax(client):
    result = verify(client, "c1-sigillo", "6*x+")
    assert result["status"] == "syntax_error"
    assert result["feedback_category"] is None


@pytest.mark.parametrize("answer", ["tan(x)", "x+y", "Derivative(x^2,x)", "Integral(x,x)"])
def test_unsupported_functions_symbols_and_calculus_constructs(client, answer):
    result = verify(client, "c1-sigillo", answer)
    assert result["status"] == "unsupported_expression"
    assert result["feedback_category"] is None


@pytest.mark.parametrize(
    "answer",
    [
        "__import__('os').system('echo unsafe')",
        "open('demo.json').read()",
        "lambda x: x",
        "x.__class__",
        "[x for x in range(10)]",
        "nan",
        "oo",
        "1/0",
    ],
)
def test_malicious_or_non_finite_inputs_are_controlled(client, answer):
    result = verify(client, "c1-sigillo", answer)
    assert result["status"] in {"syntax_error", "unsupported_expression"}
    assert result["feedback_category"] is None


@pytest.mark.parametrize("answer", ["", "   \t"])
def test_empty_input_is_a_controlled_syntax_error(client, answer):
    result = verify(client, "c1-sigillo", answer)
    assert result["status"] == "syntax_error"


def test_overlong_input_returns_422(client):
    response = client.post(
        "/api/puzzles/c1-sigillo/verify",
        json={"answer": "1" * 241},
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    "answer",
    [
        "x^1000",
        "1234567890123",
        "sin(" * 21 + "x" + ")" * 21,
        "x^x",
    ],
)
def test_resource_limits_are_controlled(client, answer):
    result = verify(client, "c1-sigillo", answer)
    assert result["status"] == "unsupported_expression"


def test_unknown_puzzle_returns_404(client):
    response = client.post("/api/puzzles/inesistente/verify", json={"answer": "x"})
    assert response.status_code == 404
    assert response.json() == {"detail": "Puzzle non trovato."}


def test_vite_development_origin_is_allowed(client):
    response = client.options(
        "/api/demo",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unrelated_origin_is_not_allowed(client):
    response = client.options(
        "/api/demo",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
