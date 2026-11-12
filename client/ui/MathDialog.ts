import "mathlive";
import type { MathfieldElement } from "mathlive";
import type { Puzzle, PuzzleProgress, VerifyResponse } from "../types";

interface MathDialogCallbacks {
  onSubmit: (answer: string) => Promise<VerifyResponse>;
  onHint: () => number;
  getProgress: () => PuzzleProgress;
}

const statusIcons: Record<string, string> = {
  correct: "✓",
  incorrect: "↻",
  syntax_error: "!",
  unsupported_expression: "!",
  error: "!",
};

export class MathDialog {
  private readonly dialog = this.element<HTMLDialogElement>("puzzle-dialog");
  private readonly answer = this.element<MathfieldElement>("answer-field");
  private readonly functionField = this.element<MathfieldElement>("function-field");
  private readonly form = this.element<HTMLFormElement>("answer-form");
  private readonly submit = this.element<HTMLButtonElement>("submit-answer");
  private readonly feedback = this.element<HTMLDivElement>("verification-feedback");
  private readonly hintList = this.element<HTMLOListElement>("hint-list");
  private puzzle?: Puzzle;
  private submitting = false;

  constructor(private readonly callbacks: MathDialogCallbacks) {
    this.functionField.readOnly = true;
    this.answer.mathVirtualKeyboardPolicy = "auto";
    const virtualKeyboard = window.mathVirtualKeyboard;
    virtualKeyboard.container = this.dialog;
    const syncKeyboardSpace = (): void => {
      const open = virtualKeyboard.visible;
      this.dialog.style.paddingBottom = open ? `${virtualKeyboard.boundingRect.height}px` : "";
    };
    virtualKeyboard.addEventListener("virtual-keyboard-toggle", syncKeyboardSpace);
    virtualKeyboard.addEventListener("geometrychange", syncKeyboardSpace);
    this.element("close-puzzle").addEventListener("click", () => this.dialog.close());
    this.element("keyboard-button").addEventListener("click", () => {
      if (window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide();
      else window.mathVirtualKeyboard.show();
      this.answer.focus();
    });
    this.hintList.replaceChildren();
    this.element("hint-button").addEventListener("click", () => {
      if (!this.puzzle || this.callbacks.getProgress().solved) return;
      this.callbacks.onHint();
      this.renderHints();
    });
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submitAnswer();
    });
    this.answer.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.form.requestSubmit();
      }
    });
    this.dialog.addEventListener("close", () => {
      window.mathVirtualKeyboard.hide();
      if (this.puzzle) {
        document.querySelector<HTMLButtonElement>(`[data-puzzle-id="${this.puzzle.id}"]`)?.focus();
      }
    });
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || !this.dialog.open) return;
        event.preventDefault();
        this.dialog.close();
      },
      true,
    );
  }

  open(puzzle: Puzzle): void {
    this.puzzle = puzzle;
    this.submitting = false;
    this.element("puzzle-step").textContent = `ENIGMA ${puzzle.order} DI 3`;
    this.element("puzzle-difficulty").textContent =
      `${"◆".repeat(puzzle.difficulty)}${"◇".repeat(3 - puzzle.difficulty)} COMPLESSITÀ`;
    this.element("puzzle-title").textContent = puzzle.title;
    this.element("puzzle-prompt").textContent = puzzle.prompt;
    this.functionField.setValue(puzzle.function_latex);
    this.answer.setValue("");
    this.answer.disabled = false;
    this.submit.disabled = false;
    this.submit.replaceChildren();
    const text = document.createElement("span");
    text.textContent = "Verifica e attiva";
    const rune = document.createElement("span");
    rune.setAttribute("aria-hidden", "true");
    rune.textContent = "✦";
    this.submit.append(text, rune);
    this.feedback.hidden = true;
    this.renderHints();
    if (!this.dialog.open) this.dialog.showModal();
    if (this.callbacks.getProgress().solved) {
      this.answer.disabled = true;
      this.submit.disabled = true;
      this.showFeedback({
        status: "correct",
        message:
          "Questo meccanismo è già attivo. Puoi rivedere la funzione e gli indizi consultati.",
        feedback_category: null,
      });
    } else {
      window.setTimeout(() => this.answer.focus(), 80);
    }
  }

  close(): void {
    this.dialog.close();
  }

  get currentPuzzleId(): string | undefined {
    return this.puzzle?.id;
  }

  private renderHints(): void {
    if (!this.puzzle) return;
    const progress = this.callbacks.getProgress();
    this.element("hint-count").textContent = `${progress.hintsUsed} / ${this.puzzle.hints.length}`;
    this.hintList.replaceChildren();
    this.puzzle.hints.slice(0, progress.hintsUsed).forEach((hint) => {
      const item = document.createElement("li");
      item.textContent = hint;
      this.hintList.append(item);
    });
    const button = this.element<HTMLButtonElement>("hint-button");
    const allRevealed = progress.hintsUsed >= this.puzzle.hints.length;
    button.hidden = allRevealed || progress.solved;
    this.element("hint-button-label").textContent =
      progress.hintsUsed === 0 ? "Rivela il primo indizio" : "Rivela un altro indizio";
  }

  private async submitAnswer(): Promise<void> {
    if (!this.puzzle || this.submitting || this.callbacks.getProgress().solved) return;
    const answer = this.answer.getValue("ascii-math").trim();
    if (!answer || answer === "?") {
      this.showRawFeedback("syntax_error", "Inserisci prima la derivata nel campo matematico.");
      this.answer.focus();
      return;
    }
    this.submitting = true;
    this.submit.disabled = true;
    this.answer.disabled = true;
    this.feedback.hidden = false;
    this.feedback.className = "feedback";
    this.feedback.textContent = "Il palazzo confronta le forme simboliche…";
    try {
      const result = await this.callbacks.onSubmit(answer);
      this.showFeedback(result);
      if (result.status !== "correct") {
        this.answer.disabled = false;
        this.submit.disabled = false;
        this.answer.focus();
      }
    } catch (error) {
      this.showRawFeedback(
        "error",
        error instanceof Error ? error.message : "Verifica non disponibile. Riprova.",
      );
      this.answer.disabled = false;
      this.submit.disabled = false;
    } finally {
      this.submitting = false;
    }
  }

  private showFeedback(result: VerifyResponse): void {
    this.showRawFeedback(result.status, result.message);
  }

  private showRawFeedback(status: string, message: string): void {
    this.feedback.className = `feedback ${status}`;
    this.feedback.textContent = `${statusIcons[status] ?? "•"} ${message}`;
    this.feedback.hidden = false;
  }

  private element<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Elemento mancante: ${id}`);
    return element as T;
  }
}
