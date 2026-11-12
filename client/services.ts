import { stubVerifyAnswer } from "./stub";
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

export async function fetchDemo(): Promise<DemoContent> {
  try {
    return await request<DemoContent>("/api/demo");
  } catch (error) {
    const response = await fetch(`${import.meta.env.BASE_URL}demo.json`);
    if (!response.ok) throw error;
    return (await response.json()) as DemoContent;
  }
}

export async function verifyAnswer(puzzleId: string, answer: string): Promise<VerifyResponse> {
  try {
    return await request<VerifyResponse>(`/api/puzzles/${encodeURIComponent(puzzleId)}/verify`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
  } catch {
    return stubVerifyAnswer(puzzleId, answer);
  }
}
