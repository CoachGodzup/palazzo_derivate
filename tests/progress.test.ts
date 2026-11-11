import { describe, expect, it } from "vitest";
import { ProgressStore, type StorageLike } from "../client/state/ProgressStore";
import type { Puzzle } from "../client/types";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const puzzles: Puzzle[] = [
  ["c1-sigillo", 90],
  ["c1-ingranaggi", 180],
  ["c1-fontana", 240],
].map(([id, target], index) => ({
  id: String(id),
  order: index + 1,
  title: String(id),
  short_title: String(id),
  mechanism: "seal",
  prompt: "Deriva",
  function_latex: "x",
  hints: ["Uno", "Due", "Tre"],
  target_seconds: Number(target),
  difficulty: index + 1,
}));

describe("ProgressStore", () => {
  it("calcola il punteggio pieno al primo tentativo e sblocca in sequenza", () => {
    let time = 1_000;
    const store = new ProgressStore(puzzles, "demo-1", undefined, () => time);
    expect(store.isUnlocked("c1-sigillo")).toBe(true);
    expect(store.isUnlocked("c1-ingranaggi")).toBe(false);
    store.startPuzzle("c1-sigillo");
    time += 30_000;
    expect(store.recordResult("c1-sigillo", "correct")).toBe(100);
    expect(store.isUnlocked("c1-ingranaggi")).toBe(true);
    expect(store.stats).toMatchObject({ solved: 1, totalScore: 100, totalAttempts: 1 });
  });

  it("registra errori, aiuti e non assegna due volte il punteggio", () => {
    let time = 1_000;
    const store = new ProgressStore(puzzles, "demo-1", undefined, () => time);
    store.startPuzzle("c1-sigillo");
    expect(store.revealHint("c1-sigillo")).toBe(1);
    store.recordResult("c1-sigillo", "incorrect");
    time += 91_000;
    expect(store.recordResult("c1-sigillo", "correct")).toBe(0);
    expect(store.recordResult("c1-sigillo", "correct")).toBe(0);
    expect(store.stats.totalAttempts).toBe(2);
  });

  it("ripristina il progresso salvato e ignora una versione diversa", () => {
    const storage = new MemoryStorage();
    const first = new ProgressStore(puzzles, "demo-1", storage, () => 1_000);
    first.startPuzzle("c1-sigillo");
    first.recordResult("c1-sigillo", "correct");
    const restored = new ProgressStore(puzzles, "demo-1", storage, () => 2_000);
    expect(restored.snapshot.puzzles["c1-sigillo"]).toMatchObject({ solved: true, score: 100 });
    expect(restored.stats.elapsedSeconds).toBe(0);
    const older = new ProgressStore(puzzles, "demo-0", storage);
    expect(older.stats.solved).toBe(0);
  });

  it("riparte da zero dopo il reset", () => {
    const storage = new MemoryStorage();
    const store = new ProgressStore(puzzles, "demo-1", storage);
    store.startPuzzle("c1-sigillo");
    store.revealHint("c1-sigillo");
    store.reset();
    expect(store.stats.solved).toBe(0);
    expect(store.stats.totalHints).toBe(0);
    expect(store.snapshot.puzzles["c1-sigillo"].startedAt).toBeNull();
  });
});
