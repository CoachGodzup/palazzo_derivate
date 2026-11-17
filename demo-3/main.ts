import "mathlive";
import type { MathfieldElement } from "mathlive";
import roomData from "./rooms.json";
import { demoKeyboardLayouts } from "./keyboard";
import { verifyDerivative, type VerificationStatus } from "./verify";
import "./style.css";

interface Mechanism {
  id: string;
  name: string;
  kind: string;
  icon: string;
  functionDisplay: string;
  functionSympy: string;
  functionLatex: string;
  derivativeSympy: string;
  prompt: string;
  rule: string;
  difficulty: number;
  targetSeconds: number;
  hints: string[];
}

interface Room {
  id: string;
  name: string;
  intro: string;
  outro: string;
  mechanisms: Mechanism[];
}

interface RoomData {
  version: string;
  title: string;
  subtitle: string;
  room: Room;
}

interface MechanismProgress {
  solved: boolean;
  attempts: number;
  errors: number;
  hintsUsed: number;
  startedAt: number | null;
  completedAt: number | null;
  score: number;
}

interface DemoState {
  version: string;
  mechanisms: Record<string, MechanismProgress>;
}

const data: RoomData = roomData;
const room = data.room;
const mechanisms = room.mechanisms;
const STORAGE_KEY = "palazzo-derivate:demo3";
const ENTERED_KEY = "palazzo-derivate:demo3-entered";
const MAX_SCORE = mechanisms.length * 100;

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento mancante: ${id}`);
  return found as T;
}

function emptyProgress(): MechanismProgress {
  return {
    solved: false,
    attempts: 0,
    errors: 0,
    hintsUsed: 0,
    startedAt: null,
    completedAt: null,
    score: 0,
  };
}

function freshState(): DemoState {
  return {
    version: data.version,
    mechanisms: Object.fromEntries(mechanisms.map((m) => [m.id, emptyProgress()])),
  };
}

function loadState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw) as Partial<DemoState>;
    if (saved.version !== data.version || !saved.mechanisms) return freshState();
    const state = freshState();
    for (const mechanism of mechanisms) {
      const candidate = saved.mechanisms[mechanism.id];
      if (!candidate || typeof candidate !== "object") continue;
      state.mechanisms[mechanism.id] = {
        solved: candidate.solved === true,
        attempts: counter(candidate.attempts),
        errors: counter(candidate.errors),
        hintsUsed: Math.min(counter(candidate.hintsUsed), mechanism.hints.length),
        startedAt: timestamp(candidate.startedAt),
        completedAt: timestamp(candidate.completedAt),
        score: Math.min(100, counter(candidate.score)),
      };
    }
    return state;
  } catch {
    return freshState();
  }
}

function counter(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function timestamp(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

const state = loadState();
let activeMechanismId: string | null = null;
let toastTimer = 0;

function save(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // La demo continua anche quando lo storage non è disponibile.
  }
}

function progressOf(id: string): MechanismProgress {
  return state.mechanisms[id] ?? emptyProgress();
}

function solvedCount(): number {
  return mechanisms.filter((m) => progressOf(m.id).solved).length;
}

function totalScore(): number {
  return mechanisms.reduce((sum, m) => sum + progressOf(m.id).score, 0);
}

function totalAttempts(): number {
  return mechanisms.reduce((sum, m) => sum + progressOf(m.id).attempts, 0);
}

function totalHints(): number {
  return mechanisms.reduce((sum, m) => sum + progressOf(m.id).hintsUsed, 0);
}

function totalActiveMs(): number {
  return mechanisms.reduce((sum, m) => {
    const progress = progressOf(m.id);
    if (progress.startedAt === null || progress.completedAt === null) return sum;
    return sum + (progress.completedAt - progress.startedAt);
  }, 0);
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isRoomComplete(): boolean {
  return solvedCount() === mechanisms.length;
}

function render(): void {
  renderDeviceRow();
  renderPanel();
}

function renderDeviceRow(): void {
  const row = element("device-row");
  row.replaceChildren();
  mechanisms.forEach((mechanism) => {
    row.append(deviceCard(mechanism));
  });
}

function deviceCard(mechanism: Mechanism): HTMLDivElement {
  const progress = progressOf(mechanism.id);
  const card = document.createElement("div");
  card.className = `device${progress.solved ? " is-solved" : ""}`;
  card.dataset.kind = mechanism.kind;

  const visual = document.createElement("div");
  visual.className = "device-visual";
  visual.setAttribute("aria-hidden", "true");
  const icon = document.createElement("span");
  icon.textContent = progress.solved ? "✓" : mechanism.icon;
  visual.append(icon);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "device-button";
  button.dataset.mechanismId = mechanism.id;
  button.setAttribute(
    "aria-label",
    `${mechanism.name}. ${progress.solved ? `Riattivato con ${progress.score} punti` : "Da riattivare"}.`,
  );
  button.addEventListener("click", () => openPuzzle(mechanism));

  const name = document.createElement("span");
  name.className = "device-name";
  name.textContent = mechanism.name;

  const rule = document.createElement("span");
  rule.className = "device-rule";
  rule.textContent = progress.solved ? `${progress.score} PUNTI` : mechanism.rule;

  button.append(name, rule);
  card.append(visual, button);
  return card;
}

function renderPanel(): void {
  const solved = solvedCount();
  element("hud-score").textContent = String(totalScore());
  element("hud-max").textContent = `/ ${MAX_SCORE}`;
  element("room-title").textContent = room.name;
  element("room-intro").textContent = isRoomComplete() ? room.outro : room.intro;
  element("room-progress-bar").style.width = `${Math.round((solved / mechanisms.length) * 100)}%`;
  element("room-progress-label").textContent =
    `${solved} / ${mechanisms.length} meccanismi riattivati`;
  element("scene-state").textContent = isRoomComplete()
    ? "La corte ha ritrovato il suo tempo"
    : solved === 0
      ? "La corte è immobile"
      : `${solved} di ${mechanisms.length} meccanismi riattivati`;

  const outro = element("room-outro");
  outro.hidden = !isRoomComplete();
  outro.textContent = room.outro;
}

function openPuzzle(mechanism: Mechanism): void {
  activeMechanismId = mechanism.id;
  const progress = progressOf(mechanism.id);
  if (progress.startedAt === null) {
    progress.startedAt = Date.now();
    save();
  }

  const dialog = element<HTMLDialogElement>("puzzle-dialog");
  element("puzzle-step").textContent = mechanism.name.toUpperCase();
  element("puzzle-difficulty").textContent = `${"◆".repeat(mechanism.difficulty)}${"◇".repeat(
    Math.max(0, 3 - mechanism.difficulty),
  )} COMPLESSITÀ`;
  element("puzzle-title").textContent = mechanism.name;
  element("puzzle-prompt").textContent = mechanism.prompt;
  const functionField = element<MathfieldElement>("function-field");
  functionField.readOnly = true;
  functionField.setValue(mechanism.functionLatex);

  const answer = element<MathfieldElement>("answer-field");
  answer.setValue("");
  answer.disabled = progress.solved;
  const submit = element<HTMLButtonElement>("submit-answer");
  submit.disabled = progress.solved;
  setSubmitLabel(progress.solved ? "Completato" : "Verifica e attiva", progress.solved ? "✓" : "✦");
  resetAnswerState();
  const feedback = element("verification-feedback");
  feedback.hidden = true;
  feedback.replaceChildren();
  feedback.className = "feedback";
  renderHints(mechanism, progress);

  if (!dialog.open) dialog.showModal();
  if (progress.solved) {
    showFeedback({
      status: "correct",
      message: "Questo meccanismo è già attivo. Puoi rivedere gli indizi consultati.",
    });
  } else {
    window.setTimeout(() => answer.focus(), 80);
  }
}

function renderHints(mechanism: Mechanism, progress: MechanismProgress): void {
  const list = element<HTMLOListElement>("hint-list");
  list.replaceChildren();
  mechanism.hints.slice(0, progress.hintsUsed).forEach((hint) => {
    const item = document.createElement("li");
    item.textContent = hint;
    list.append(item);
  });
  element("hint-count").textContent = `${progress.hintsUsed} / ${mechanism.hints.length}`;
  const button = element<HTMLButtonElement>("hint-button");
  button.hidden = progress.solved || progress.hintsUsed >= mechanism.hints.length;
  element("hint-button-label").textContent =
    progress.hintsUsed === 0 ? "Rivela il primo indizio" : "Rivela un altro indizio";
}

function revealHint(): void {
  if (!activeMechanismId) return;
  const mechanism = mechanisms.find((m) => m.id === activeMechanismId);
  if (!mechanism) return;
  const progress = progressOf(mechanism.id);
  if (progress.solved || progress.hintsUsed >= mechanism.hints.length) return;
  progress.hintsUsed += 1;
  save();
  renderHints(mechanism, progress);
}

function setSubmitLabel(label: string, icon: string): void {
  const submit = element<HTMLButtonElement>("submit-answer");
  submit.replaceChildren();
  const text = document.createElement("span");
  text.textContent = label;
  const rune = document.createElement("span");
  rune.setAttribute("aria-hidden", "true");
  rune.textContent = icon;
  submit.append(text, rune);
}

function showFeedback(result: { status: VerificationStatus | "correct"; message: string }): void {
  const feedback = element<HTMLDivElement>("verification-feedback");
  feedback.className = `feedback ${result.status}`;
  feedback.replaceChildren();
  const icon = document.createElement("span");
  icon.className = "feedback-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = result.status === "correct" ? "✓" : result.status === "incorrect" ? "↻" : "!";
  const copy = document.createElement("span");
  copy.className = "feedback-copy";
  if (result.status === "correct") {
    const title = document.createElement("strong");
    title.className = "feedback-title";
    title.textContent = "Ben fatto!";
    const line = document.createElement("span");
    line.textContent = result.message;
    copy.append(title, line);
  } else {
    copy.textContent = result.message;
  }
  feedback.append(icon, copy);
  feedback.hidden = false;
  if (result.status === "correct") {
    feedback.classList.add("is-celebrating");
  }
}

function resetAnswerState(): void {
  const row = element("answer-row");
  row.classList.remove("is-correct", "is-error", "is-shaking");
}

function playError(): void {
  const row = element("answer-row");
  row.classList.remove("is-correct", "is-error", "is-shaking");
  void row.offsetWidth;
  row.classList.add("is-error", "is-shaking");
  window.setTimeout(() => row.classList.remove("is-shaking"), 380);
}

function recordAttempt(mechanism: Mechanism, status: VerificationStatus): number | null {
  const progress = progressOf(mechanism.id);
  if (progress.solved) return progress.score;
  progress.attempts += 1;
  if (status !== "correct") {
    progress.errors += 1;
    save();
    renderPanel();
    return null;
  }
  const elapsedSeconds = progress.startedAt ? (Date.now() - progress.startedAt) / 1000 : 0;
  progress.score =
    (progress.attempts === 1 ? 50 : 0) +
    (progress.hintsUsed === 0 ? 25 : 0) +
    (progress.errors === 0 ? 15 : 0) +
    (elapsedSeconds <= mechanism.targetSeconds ? 10 : 0);
  progress.solved = true;
  progress.completedAt = Date.now();
  save();
  return progress.score;
}

function completeRoomIfDone(): void {
  if (!isRoomComplete()) return;
  element("room-stage").classList.add("is-complete");
  renderPanel();
  // Il lampo di luce parte subito; il riepilogo compare dopo che la scena
  // ha iniziato ad animarsi e la modale dell'enigma si è chiusa.
  window.setTimeout(() => showToast("La corte ha ritrovato il suo tempo.", "✦", true), 1200);
  window.setTimeout(showCompletion, 2200);
}

function showCompletion(): void {
  element("final-score").textContent = String(totalScore());
  element("final-attempts").textContent = String(totalAttempts());
  element("final-hints").textContent = String(totalHints());
  element("final-time").textContent = formatTime(totalActiveMs());
  const dialog = element<HTMLDialogElement>("completion-dialog");
  if (!dialog.open) dialog.showModal();
  element<HTMLButtonElement>("close-completion").focus();
}

function submitAnswer(): void {
  if (!activeMechanismId) return;
  const mechanism = mechanisms.find((m) => m.id === activeMechanismId);
  if (!mechanism) return;
  const progress = progressOf(mechanism.id);
  if (progress.solved) return;
  const answer = element<MathfieldElement>("answer-field").getValue("ascii-math").trim();
  if (!answer || answer === "?") {
    showFeedback({ status: "syntax_error", message: "Scrivi una derivata prima di verificare." });
    playError();
    return;
  }

  const result = verifyDerivative(answer, mechanism.derivativeSympy);
  const score = recordAttempt(mechanism, result.status);
  showFeedback(result);
  if (result.status === "correct") {
    element<MathfieldElement>("answer-field").disabled = true;
    element<HTMLButtonElement>("submit-answer").disabled = true;
    setSubmitLabel("Completato", "✓");
    element("answer-row").classList.add("is-correct");
    showToast(`«${mechanism.name}» si è riattivato. +${score} punti.`, "✓", true);
    render();
    completeRoomIfDone();
    window.setTimeout(() => {
      element<HTMLDialogElement>("puzzle-dialog").close();
      render();
    }, 1500);
  } else {
    playError();
  }
}

function showToast(message: string, icon = "✦", success = false): void {
  window.clearTimeout(toastTimer);
  element("toast-icon").textContent = icon;
  element("toast-message").textContent = message;
  const toast = element("toast");
  toast.className = success ? "toast is-success" : "toast";
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4600);
}

function resetRoom(): void {
  window.clearTimeout(toastTimer);
  state.version = data.version;
  state.mechanisms = Object.fromEntries(mechanisms.map((m) => [m.id, emptyProgress()]));
  save();
  activeMechanismId = null;
  element("room-stage").classList.remove("is-complete");
  element<HTMLDialogElement>("puzzle-dialog").close();
  element<HTMLDialogElement>("confirm-dialog").close();
  render();
  showToast("La corte è tornata al suo silenzio iniziale.", "↻");
  showWelcome(true);
}

function showWelcome(force = false): void {
  if (!force && sessionStorage.getItem(ENTERED_KEY) === "1") return;
  sessionStorage.removeItem(ENTERED_KEY);
  const dialog = element<HTMLDialogElement>("welcome-dialog");
  if (!dialog.open) dialog.showModal();
  element<HTMLButtonElement>("enter-button").focus();
}

function bind(): void {
  const dialog = element<HTMLDialogElement>("puzzle-dialog");
  const answer = element<MathfieldElement>("answer-field");
  answer.mathVirtualKeyboardPolicy = "auto";
  const keyboard = window.mathVirtualKeyboard;
  keyboard.container = dialog;
  keyboard.layouts = [...demoKeyboardLayouts()];
  const syncKeyboardSpace = (): void => {
    dialog.style.paddingBottom = keyboard.visible ? `${keyboard.boundingRect.height}px` : "";
  };
  keyboard.addEventListener("virtual-keyboard-toggle", syncKeyboardSpace);
  keyboard.addEventListener("geometrychange", syncKeyboardSpace);

  element("enter-button").addEventListener("click", () => {
    sessionStorage.setItem(ENTERED_KEY, "1");
    element<HTMLDialogElement>("welcome-dialog").close();
  });
  element("help-button").addEventListener("click", () => {
    const rules = element<HTMLDialogElement>("rules-dialog");
    if (!rules.open) rules.showModal();
    element<HTMLButtonElement>("close-rules").focus();
  });
  element("close-rules").addEventListener("click", () => {
    element<HTMLDialogElement>("rules-dialog").close();
  });
  element("close-puzzle").addEventListener("click", () => dialog.close());
  element("hint-button").addEventListener("click", revealHint);
  element("keyboard-button").addEventListener("click", () => {
    if (window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide();
    else window.mathVirtualKeyboard.show();
    answer.focus();
  });
  element("answer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    submitAnswer();
  });
  answer.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      element<HTMLFormElement>("answer-form").requestSubmit();
    }
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !dialog.open) return;
      event.preventDefault();
      dialog.close();
    },
    true,
  );
  dialog.addEventListener("close", () => {
    window.mathVirtualKeyboard.hide();
    const mechanismId = activeMechanismId;
    activeMechanismId = null;
    if (mechanismId) {
      document.querySelector<HTMLButtonElement>(`[data-mechanism-id="${mechanismId}"]`)?.focus();
    }
  });

  element("reset-button").addEventListener("click", () => {
    if (solvedCount() === 0) {
      resetRoom();
      return;
    }
    const confirm = element<HTMLDialogElement>("confirm-dialog");
    if (!confirm.open) confirm.showModal();
    element<HTMLButtonElement>("cancel-reset").focus();
  });
  element("cancel-reset").addEventListener("click", () => {
    element<HTMLDialogElement>("confirm-dialog").close();
  });
  element("confirm-reset").addEventListener("click", resetRoom);

  element("close-completion").addEventListener("click", () => {
    element<HTMLDialogElement>("completion-dialog").close();
  });
  element("replay-button").addEventListener("click", () => {
    element<HTMLDialogElement>("completion-dialog").close();
    resetRoom();
  });
}

function start(): void {
  bind();
  render();
  if (isRoomComplete()) {
    element("room-stage").classList.add("is-complete");
  }
  showWelcome();
}

start();
