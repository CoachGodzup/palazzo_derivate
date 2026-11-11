import type {
  GameProgress,
  GameStats,
  Puzzle,
  PuzzleProgress,
  VerificationStatus,
} from "../types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "palazzo-derivate:progress";

const emptyPuzzle = (): PuzzleProgress => ({
  solved: false,
  attempts: 0,
  errors: 0,
  hintsUsed: 0,
  startedAt: null,
  completedAt: null,
  score: 0,
});

export class ProgressStore {
  private state: GameProgress;
  private readonly listeners = new Set<(state: GameProgress) => void>();

  constructor(
    private readonly puzzles: Puzzle[],
    private readonly version: string,
    private readonly storage?: StorageLike,
    private readonly now: () => number = Date.now,
  ) {
    this.state = this.load();
  }

  get snapshot(): GameProgress {
    return structuredClone(this.state);
  }

  subscribe(listener: (state: GameProgress) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isUnlocked(puzzleId: string): boolean {
    const index = this.puzzles.findIndex((puzzle) => puzzle.id === puzzleId);
    return index === 0 || (index > 0 && this.state.puzzles[this.puzzles[index - 1].id].solved);
  }

  startPuzzle(puzzleId: string): void {
    const progress = this.state.puzzles[puzzleId];
    if (progress.startedAt === null) {
      progress.startedAt = this.now();
      this.commit();
    }
  }

  revealHint(puzzleId: string): number {
    const progress = this.state.puzzles[puzzleId];
    const puzzle = this.requirePuzzle(puzzleId);
    const nextLevel = Math.min(progress.hintsUsed + 1, puzzle.hints.length);
    if (nextLevel !== progress.hintsUsed) {
      progress.hintsUsed = nextLevel;
      this.commit();
    }
    return progress.hintsUsed;
  }

  recordResult(puzzleId: string, status: VerificationStatus): number | null {
    const progress = this.state.puzzles[puzzleId];
    if (progress.solved) return progress.score;

    progress.attempts += 1;
    if (status !== "correct") {
      progress.errors += 1;
      this.commit();
      return null;
    }

    const puzzle = this.requirePuzzle(puzzleId);
    const elapsedSeconds = this.elapsedSeconds(progress);
    progress.score =
      (progress.attempts === 1 ? 50 : 0) +
      (progress.hintsUsed === 0 ? 25 : 0) +
      (progress.errors === 0 ? 15 : 0) +
      (elapsedSeconds <= puzzle.target_seconds ? 10 : 0);
    progress.solved = true;
    progress.completedAt = this.now();
    this.state.completed = this.puzzles.every((item) => this.state.puzzles[item.id].solved);
    this.commit();
    return progress.score;
  }

  get stats(): GameStats {
    const values = Object.values(this.state.puzzles);
    return {
      solved: values.filter((progress) => progress.solved).length,
      totalScore: values.reduce((sum, progress) => sum + progress.score, 0),
      totalAttempts: values.reduce((sum, progress) => sum + progress.attempts, 0),
      totalHints: values.reduce((sum, progress) => sum + progress.hintsUsed, 0),
      elapsedSeconds: values.reduce((sum, progress) => sum + this.elapsedSeconds(progress), 0),
    };
  }

  reset(): void {
    this.state = this.freshState();
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Il reset in memoria resta valido anche se lo storage non è disponibile.
    }
    this.commit();
  }

  private elapsedSeconds(progress: PuzzleProgress): number {
    if (progress.startedAt === null) return 0;
    return Math.max(0, Math.floor(((progress.completedAt ?? this.now()) - progress.startedAt) / 1000));
  }

  private requirePuzzle(puzzleId: string): Puzzle {
    const puzzle = this.puzzles.find((item) => item.id === puzzleId);
    if (!puzzle) throw new Error(`Puzzle sconosciuto: ${puzzleId}`);
    return puzzle;
  }

  private freshState(): GameProgress {
    return {
      version: this.version,
      puzzles: Object.fromEntries(this.puzzles.map((puzzle) => [puzzle.id, emptyPuzzle()])),
      completed: false,
    };
  }

  private load(): GameProgress {
    if (!this.storage) return this.freshState();
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return this.freshState();
      const saved = JSON.parse(raw) as Partial<GameProgress>;
      if (saved.version !== this.version || !saved.puzzles) return this.freshState();
      const state = this.freshState();
      for (const puzzle of this.puzzles) {
        const candidate = saved.puzzles[puzzle.id];
        if (!candidate) continue;
        state.puzzles[puzzle.id] = {
          solved: candidate.solved === true,
          attempts: this.nonNegativeInteger(candidate.attempts),
          errors: this.nonNegativeInteger(candidate.errors),
          hintsUsed: Math.min(this.nonNegativeInteger(candidate.hintsUsed), puzzle.hints.length),
          startedAt: this.validTimestamp(candidate.startedAt),
          completedAt: this.validTimestamp(candidate.completedAt),
          score: Math.min(100, this.nonNegativeInteger(candidate.score)),
        };
      }
      state.completed = this.puzzles.every((puzzle) => state.puzzles[puzzle.id].solved);
      return state;
    } catch {
      return this.freshState();
    }
  }

  private nonNegativeInteger(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;
  }

  private validTimestamp(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  }

  private commit(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Privacy mode o quota piena: la demo continua senza persistenza.
    }
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
