import type { DemoContent, VerifyResponse } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(
      "Il motore simbolico non risponde. Verifica che il server FastAPI sia attivo e riprova.",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? "La verifica non è disponibile in questo momento.");
  }
  return (await response.json()) as T;
}

export function fetchDemo(): Promise<DemoContent> {
  return request<DemoContent>("/api/demo");
}

export function verifyAnswer(puzzleId: string, answer: string): Promise<VerifyResponse> {
  return request<VerifyResponse>(`/api/puzzles/${encodeURIComponent(puzzleId)}/verify`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}
