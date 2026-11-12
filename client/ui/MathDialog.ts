import "mathlive";
import type { MathfieldElement } from "mathlive";
import type { Puzzle, PuzzleProgress, VerifyResponse } from "../types";
import { virtualKeyboardLayouts } from "./keyboard";

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

const SHAKE_DURATION = 380;
const SPARK_COUNT = 14;
const SPARK_DURATION = 1000;

export class MathDialog {
  private readonly dialog = this.element<HTMLDialogElement>("puzzle-dialog");
  private readonly answer = this.element<MathfieldElement>("answer-field");
  private readonly answerRow = this.element<HTMLDivElement>("answer-row");
  private readonly functionField = this.element<MathfieldElement>("function-field");
  private readonly form = this.element<HTMLFormElement>("answer-form");
  private readonly submit = this.element<HTMLButtonElement>("submit-answer");
  private readonly feedback = this.element<HTMLDivElement>("verification-feedback");
  private readonly hintList = this.element<HTMLOListElement>("hint-list");
  private puzzle?: Puzzle;
  private submitting = false;
  private shakeTimer = 0;
  private sparkTimer = 0;

  constructor(private readonly callbacks: MathDialogCallbacks) {
    this.functionField.readOnly = true;
    this.answer.mathVirtualKeyboardPolicy = "auto";
    const virtualKeyboard = window.mathVirtualKeyboard;
    virtualKeyboard.container = this.dialog;
    virtualKeyboard.layouts = [...virtualKeyboardLayouts];
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
    this.changeSubmitLabel("Verifica e attiva", "✦");
    this.feedback.hidden = true;
    this.resetAnswerState();
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
      this.playError();
      this.answer.focus();
      return;
    }
    this.resetAnswerState();
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
    if (result.status === "correct") {
      this.showSuccess(result.message);
      return;
    }
    this.showRawFeedback(result.status, result.message);
    this.playError();
  }

  private showSuccess(serverMessage: string): void {
    this.feedback.className = "feedback correct is-celebrating";
    this.feedback.replaceChildren();
    const icon = document.createElement("span");
    icon.className = "feedback-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✓";
    const copy = document.createElement("span");
    copy.className = "feedback-copy";
    const title = document.createElement("strong");
    title.className = "feedback-title";
    title.textContent = "Ben fatto!";
    const line = document.createElement("span");
    line.textContent = "Esatto, la derivata è corretta.";
    const detail = document.createElement("span");
    detail.className = "feedback-detail";
    detail.textContent = "Il meccanismo si sta riattivando…";
    detail.title = serverMessage;
    copy.append(title, line, detail);
    this.feedback.append(icon, copy);
    this.feedback.hidden = false;
    this.answerRow.classList.add("is-correct");
    this.changeSubmitLabel("Completato", "✓");
    this.spawnSparks();
  }

  private showRawFeedback(status: string, message: string): void {
    this.feedback.className = `feedback ${status}`;
    this.feedback.replaceChildren();
    const icon = document.createElement("span");
    icon.className = "feedback-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = statusIcons[status] ?? "•";
    const copy = document.createElement("span");
    copy.className = "feedback-copy";
    copy.textContent = message;
    this.feedback.append(icon, copy);
    this.feedback.hidden = false;
  }

  private playError(): void {
    this.answerRow.classList.remove("is-correct");
    this.answerRow.classList.add("is-error");
    this.answerRow.classList.remove("is-shaking");
    void this.answerRow.offsetWidth;
    this.answerRow.classList.add("is-shaking");
    window.clearTimeout(this.shakeTimer);
    this.shakeTimer = window.setTimeout(() => {
      this.answerRow.classList.remove("is-shaking");
    }, SHAKE_DURATION);
  }

  private changeSubmitLabel(label: string, rune: string): void {
    this.submit.replaceChildren();
    const text = document.createElement("span");
    text.textContent = label;
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = rune;
    this.submit.append(text, icon);
  }

  private spawnSparks(): void {
    window.clearTimeout(this.sparkTimer);
    this.answerRow.querySelectorAll(".success-spark").forEach((spark) => spark.remove());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let index = 0; index < SPARK_COUNT; index += 1) {
      const spark = document.createElement("span");
      spark.className = "success-spark";
      spark.setAttribute("aria-hidden", "true");
      const angle = (Math.PI * 2 * index) / SPARK_COUNT;
      const distance = 26 + Math.random() * 26;
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
      spark.style.setProperty("--spark-delay", `${Math.random() * 80}ms`);
      spark.style.setProperty("--spark-size", `${4 + Math.round(Math.random() * 4)}px`);
      spark.style.animationDelay = `${Math.random() * 80}ms`;
      this.answerRow.append(spark);
    }
    this.sparkTimer = window.setTimeout(() => {
      this.answerRow.querySelectorAll(".success-spark").forEach((spark) => spark.remove());
    }, SPARK_DURATION + 120);
  }

  private resetAnswerState(): void {
    window.clearTimeout(this.shakeTimer);
    window.clearTimeout(this.sparkTimer);
    this.answerRow.classList.remove("is-correct", "is-error", "is-shaking");
    this.answerRow.querySelectorAll(".success-spark").forEach((spark) => spark.remove());
  }

  private element<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Elemento mancante: ${id}`);
    return element as T;
  }
}
