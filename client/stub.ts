import type { VerifyResponse } from "./types";

// Fallback per la demo statica (es. GitHub Pages) dove il backend FastAPI/SymPy
// non è disponibile. NON è il motore di verifica: accetta soltanto le forme
// equivalenti documentate in docs/DEMO_SCOPE.md. In sviluppo e nei test E2E la
// verifica avviene sempre sul backend reale tramite SymPy, mai su questo stub.
const ACCEPTED_ANSWERS: Record<string, string[]> = {
  "c1-sigillo": ["6*x-5", "3*2*x-5"],
  "c1-ingranaggi": ["9*x^2+6*x-2", "6*x*(x+1)+3*x^2-2"],
  "c1-fontana": ["3/(2*sqrt(x))+3*sqrt(x)", "(3+6*x)/(2*sqrt(x))"],
};

function normalize(value: string): string {
  return value.replace(/\s+/g, "").replace(/\*/g, "").toLowerCase();
}

export function stubVerifyAnswer(puzzleId: string, answer: string): VerifyResponse {
  const normalized = normalize(answer);
  const accepted = (ACCEPTED_ANSWERS[puzzleId] ?? []).map(normalize);
  if (accepted.includes(normalized)) {
    return {
      status: "correct",
      message: "Corretto: il meccanismo si riattiva!",
      feedback_category: null,
    };
  }
  return {
    status: "incorrect",
    message: "La derivata non è equivalente: rivedi la regola applicata e i calcoli.",
    feedback_category: null,
  };
}
