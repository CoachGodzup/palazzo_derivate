export type VerificationStatus =
  | "correct"
  | "incorrect"
  | "syntax_error"
  | "unsupported_expression";

export interface Puzzle {
  id: string;
  order: number;
  title: string;
  short_title: string;
  mechanism: "seal" | "gears" | "fountain";
  prompt: string;
  function_latex: string;
  hints: string[];
  target_seconds: number;
  difficulty: number;
}

export interface DemoContent {
  version: string;
  chapter: string;
  room: string;
  intro: string;
  outro: string;
  puzzles: Puzzle[];
}

export interface VerifyResponse {
  status: VerificationStatus;
  message: string;
  feedback_category: string | null;
}

export interface PuzzleProgress {
  solved: boolean;
  attempts: number;
  errors: number;
  hintsUsed: number;
  startedAt: number | null;
  completedAt: number | null;
  score: number;
}

export interface GameProgress {
  version: string;
  puzzles: Record<string, PuzzleProgress>;
  completed: boolean;
}

export interface GameStats {
  solved: number;
  totalScore: number;
  totalAttempts: number;
  totalHints: number;
  elapsedSeconds: number;
}
