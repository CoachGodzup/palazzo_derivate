import "mathlive";
import type { MathfieldElement } from "mathlive";
import campaignData from "./campaign.json";
import { demoKeyboardLayouts } from "./keyboard";
import { verifyDerivative, type VerificationStatus } from "./verify";
import "./style.css";

interface Room {
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
  secret: boolean;
  hints: string[];
}

interface Chapter {
  id: string;
  number: string;
  name: string;
  theme: string;
  intro: string;
  outro: string;
  rooms: Room[];
}

interface Campaign {
  version: string;
  title: string;
  subtitle: string;
  teacher?: {
    secretRooms?: boolean;
  };
  chapters: Chapter[];
}

interface RoomProgress {
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
  activeChapter: string;
  rooms: Record<string, RoomProgress>;
}

const campaign: Campaign = campaignData;
const STORAGE_KEY = "palazzo-derivate:demo2";
const ENTERED_KEY = "palazzo-derivate:demo2-entered";
/**
 * Le stanze segrete restano nei contenuti ma sono disattivate dal docente.
 * Il pannello docente (post demo) potrà riaccenderle senza toccare il codice.
 */
const secretRoomsEnabled = campaign.teacher?.secretRooms === true;
const allRooms = campaign.chapters
  .flatMap((chapter) => chapter.rooms)
  .filter((room) => secretRoomsEnabled || !room.secret);
const totalRooms = allRooms.length;

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento mancante: ${id}`);
  return found as T;
}

function emptyRoomProgress(): RoomProgress {
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
    version: campaign.version,
    activeChapter: campaign.chapters[0]?.id ?? "",
    rooms: Object.fromEntries(allRooms.map((room) => [room.id, emptyRoomProgress()])),
  };
}

function loadState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw) as Partial<DemoState>;
    if (saved.version !== campaign.version || !saved.rooms) return freshState();
    const state = freshState();
    for (const room of allRooms) {
      const candidate = saved.rooms[room.id];
      if (!candidate || typeof candidate !== "object") continue;
      state.rooms[room.id] = {
        solved: candidate.solved === true,
        attempts: counter(candidate.attempts),
        errors: counter(candidate.errors),
        hintsUsed: Math.min(counter(candidate.hintsUsed), room.hints.length),
        startedAt: timestamp(candidate.startedAt),
        completedAt: timestamp(candidate.completedAt),
        score: Math.min(100, counter(candidate.score)),
      };
    }
    if (
      typeof saved.activeChapter === "string" &&
      campaign.chapters.some((chapter) => chapter.id === saved.activeChapter)
    ) {
      state.activeChapter = saved.activeChapter;
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
let activeRoomId: string | null = null;
let toastTimer = 0;
let roomCompleteTimer = 0;
let lastSolvedRoomId: string | null = null;

function save(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // La demo continua anche quando lo storage non è disponibile.
  }
}

function chapterIndex(chapterId: string): number {
  return campaign.chapters.findIndex((chapter) => chapter.id === chapterId);
}

function currentChapter(): Chapter {
  return (
    campaign.chapters.find((chapter) => chapter.id === state.activeChapter) ?? campaign.chapters[0]
  );
}

function mainRooms(chapter: Chapter): Room[] {
  return chapter.rooms.filter((room) => !room.secret);
}

function secretRooms(chapter: Chapter): Room[] {
  if (!secretRoomsEnabled) return [];
  return chapter.rooms.filter((room) => room.secret);
}

function solvedIn(rooms: Room[]): number {
  return rooms.filter((room) => state.rooms[room.id]?.solved).length;
}

function isChapterComplete(chapter: Chapter): boolean {
  return solvedIn(mainRooms(chapter)) === mainRooms(chapter).length;
}

function isChapterUnlocked(chapter: Chapter): boolean {
  const index = chapterIndex(chapter.id);
  if (index <= 0) return true;
  return isChapterComplete(campaign.chapters[index - 1]);
}

function isRoomUnlocked(room: Room, chapter: Chapter): boolean {
  if (!isChapterUnlocked(chapter)) return false;
  return !room.secret || isChapterComplete(chapter);
}

function totalSolved(): number {
  return allRooms.filter((room) => state.rooms[room.id]?.solved).length;
}

function totalMainSolved(): number {
  return campaign.chapters.reduce((sum, chapter) => sum + solvedIn(mainRooms(chapter)), 0);
}

function totalScore(): number {
  return allRooms.reduce((sum, room) => sum + (state.rooms[room.id]?.score ?? 0), 0);
}

function totalMainCount(): number {
  return campaign.chapters.reduce((sum, chapter) => sum + mainRooms(chapter).length, 0);
}

function formatPercent(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function roomPosition(room: Room, chapter: Chapter): string {
  const mainIndex = chapter.rooms.filter((item) => !item.secret).indexOf(room);
  if (room.secret) return `Capitolo ${chapter.number} · Segreta`;
  return `Capitolo ${chapter.number} · Stanza ${mainIndex + 1}`;
}

function render(): void {
  const chapter = currentChapter();
  renderChapterList();
  renderChapterHero(chapter);
  renderRooms(chapter);
  renderSummary();
}

function renderChapterList(): void {
  const list = element("chapter-list");
  list.replaceChildren();
  campaign.chapters.forEach((chapter, index) => {
    const unlocked = isChapterUnlocked(chapter);
    const complete = isChapterComplete(chapter);
    const secretSolved = solvedIn(secretRooms(chapter));
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chapter-button${chapter.id === state.activeChapter ? " is-active" : ""}${
      complete ? " is-complete" : ""
    }${unlocked ? "" : " is-locked"}`;
    button.disabled = !unlocked;
    button.setAttribute(
      "aria-label",
      `Capitolo ${chapter.number}, ${chapter.name}. ${solvedIn(mainRooms(chapter))} di ${
        mainRooms(chapter).length
      } stanze completate${secretSolved ? `, ${secretSolved} stanza segreta` : ""}. ${
        unlocked ? "Apri il capitolo" : "Bloccato"
      }`,
    );
    button.addEventListener("click", () => {
      state.activeChapter = chapter.id;
      save();
      render();
    });

    const number = document.createElement("span");
    number.className = "chapter-button-number";
    number.textContent = chapter.number;

    const copy = document.createElement("span");
    copy.className = "chapter-button-copy";
    const name = document.createElement("strong");
    name.textContent = chapter.name;
    const meta = document.createElement("small");
    meta.textContent = `${solvedIn(mainRooms(chapter))}/${mainRooms(chapter).length} stanze${
      secretSolved ? " · ✦" : ""
    }`;
    copy.append(name, meta);

    const mark = document.createElement("span");
    mark.className = "chapter-button-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = complete ? "✓" : unlocked ? "›" : "⌑";

    button.append(number, copy, mark);
    list.append(button);
    if (index < campaign.chapters.length - 1) {
      const divider = document.createElement("span");
      divider.className = "chapter-divider";
      divider.setAttribute("aria-hidden", "true");
      list.append(divider);
    }
  });
}

function renderChapterHero(chapter: Chapter): void {
  const main = mainRooms(chapter);
  const solved = solvedIn(main);
  element("chapter-number").textContent = chapter.number;
  element("chapter-theme").textContent = chapter.theme;
  element("chapter-title").textContent = chapter.name;
  element("chapter-intro").textContent = chapter.intro;
  element("chapter-fraction").textContent = `${solved} / ${main.length}`;
  element("chapter-progress-bar").style.width = `${formatPercent(solved, main.length)}%`;
}

function renderRooms(chapter: Chapter): void {
  const grid = element("room-grid");
  grid.replaceChildren();
  mainRooms(chapter).forEach((room) => {
    grid.append(roomCard(room, chapter));
  });

  const secretSection = element("secret-section");
  secretSection.hidden = !secretRoomsEnabled;
  element("rail-note").hidden = !secretRoomsEnabled;

  const secretGrid = element("secret-grid");
  secretGrid.replaceChildren();
  secretRooms(chapter).forEach((room) => {
    secretGrid.append(roomCard(room, chapter));
  });
  element("secret-progress").textContent = `${solvedIn(secretRooms(chapter))} / ${
    secretRooms(chapter).length
  }`;
  element("stage-progress").textContent = `${solvedIn(mainRooms(chapter))} / ${
    mainRooms(chapter).length
  }`;
}

function roomCard(room: Room, chapter: Chapter): HTMLButtonElement {
  const progress = state.rooms[room.id] ?? emptyRoomProgress();
  const unlocked = isRoomUnlocked(room, chapter);
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.roomId = room.id;
  button.className = `room-card${progress.solved ? " is-solved" : ""}${
    unlocked ? "" : " is-locked"
  }${room.secret ? " is-secret" : ""}`;
  button.disabled = !unlocked;
  button.setAttribute(
    "aria-label",
    `${room.name}. ${progress.solved ? `Completata con ${progress.score} punti` : unlocked ? "Da attivare" : "Bloccata"}.`,
  );
  button.addEventListener("click", () => openPuzzle(room));

  const top = document.createElement("span");
  top.className = "room-card-top";
  const icon = document.createElement("span");
  icon.className = "room-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = progress.solved ? "✓" : room.icon;
  const status = document.createElement("span");
  status.className = "room-status";
  status.textContent = progress.solved
    ? `${progress.score} PUNTI`
    : unlocked
      ? room.secret
        ? "SEGRETA"
        : "DA ATTIVARE"
      : room.secret
        ? "COMPLETA IL CAPITOLO"
        : "BLOCCATA";
  top.append(icon, status);

  const label = document.createElement("span");
  label.className = "room-label";
  label.textContent = roomPosition(room, chapter);

  const title = document.createElement("strong");
  title.className = "room-title";
  title.textContent = room.name;

  const formula = document.createElement("span");
  formula.className = "room-formula";
  formula.textContent = room.functionDisplay;

  const meta = document.createElement("span");
  meta.className = "room-meta";
  const rule = document.createElement("span");
  rule.textContent = room.rule;
  const dots = document.createElement("span");
  dots.className = "difficulty-dots";
  dots.setAttribute("aria-label", `Complessità ${room.difficulty} su 3`);
  dots.textContent = `${"◆".repeat(room.difficulty)}${"◇".repeat(Math.max(0, 3 - room.difficulty))}`;
  meta.append(rule, dots);

  button.append(top, label, title, formula, meta);
  return button;
}

function renderSummary(): void {
  const solved = totalSolved();
  const mainSolved = totalMainSolved();
  const mainTotal = totalMainCount();
  element("hud-score").textContent = String(totalScore());
  element("hud-max").textContent = `/ ${totalRooms * 100}`;
  element("campaign-fraction").textContent = `${solved} / ${totalRooms}`;
  const completion = element("campaign-complete");
  const complete = mainSolved === mainTotal;
  completion.hidden = !complete;
  if (complete) {
    element("complete-score").textContent = `${totalScore()} punti`;
  }
}

function openPuzzle(room: Room): void {
  const chapter = campaign.chapters.find((item) => item.rooms.includes(room));
  if (!chapter || !isRoomUnlocked(room, chapter)) return;
  hideRoomComplete();
  activeRoomId = room.id;
  const progress = state.rooms[room.id];
  if (progress.startedAt === null) {
    progress.startedAt = Date.now();
    save();
  }

  const dialog = element<HTMLDialogElement>("puzzle-dialog");
  element("puzzle-step").textContent = roomPosition(room, chapter).toUpperCase();
  element("puzzle-difficulty").textContent = `${"◆".repeat(room.difficulty)}${"◇".repeat(
    Math.max(0, 3 - room.difficulty),
  )} COMPLESSITÀ`;
  element("puzzle-title").textContent = room.name;
  element("puzzle-prompt").textContent = room.prompt;
  const functionField = element<MathfieldElement>("function-field");
  functionField.readOnly = true;
  functionField.setValue(room.functionLatex);

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
  renderHints(room, progress);

  if (!dialog.open) dialog.showModal();
  if (progress.solved) {
    showFeedback({
      status: "correct",
      message: "Questa stanza è già attiva. Puoi rivedere gli indizi consultati.",
    });
  } else {
    window.setTimeout(() => answer.focus(), 80);
  }
}

function renderHints(room: Room, progress: RoomProgress): void {
  const list = element<HTMLOListElement>("hint-list");
  list.replaceChildren();
  room.hints.slice(0, progress.hintsUsed).forEach((hint) => {
    const item = document.createElement("li");
    item.textContent = hint;
    list.append(item);
  });
  element("hint-count").textContent = `${progress.hintsUsed} / ${room.hints.length}`;
  const button = element<HTMLButtonElement>("hint-button");
  button.hidden = progress.solved || progress.hintsUsed >= room.hints.length;
  element("hint-button-label").textContent =
    progress.hintsUsed === 0 ? "Rivela il primo indizio" : "Rivela un altro indizio";
}

function revealHint(): void {
  if (!activeRoomId) return;
  const room = allRooms.find((item) => item.id === activeRoomId);
  if (!room) return;
  const progress = state.rooms[room.id];
  if (progress.solved || progress.hintsUsed >= room.hints.length) return;
  progress.hintsUsed += 1;
  save();
  renderHints(room, progress);
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

function recordAttempt(room: Room, status: VerificationStatus): number | null {
  const progress = state.rooms[room.id];
  if (progress.solved) return progress.score;
  progress.attempts += 1;
  if (status !== "correct") {
    progress.errors += 1;
    save();
    renderSummary();
    return null;
  }
  const elapsedSeconds = progress.startedAt ? (Date.now() - progress.startedAt) / 1000 : 0;
  progress.score =
    (progress.attempts === 1 ? 50 : 0) +
    (progress.hintsUsed === 0 ? 25 : 0) +
    (progress.errors === 0 ? 15 : 0) +
    (elapsedSeconds <= room.targetSeconds ? 10 : 0);
  progress.solved = true;
  progress.completedAt = Date.now();
  save();
  return progress.score;
}

function submitAnswer(): void {
  if (!activeRoomId) return;
  const room = allRooms.find((item) => item.id === activeRoomId);
  if (!room) return;
  const progress = state.rooms[room.id];
  if (progress.solved) return;
  const answer = element<MathfieldElement>("answer-field").getValue("ascii-math").trim();
  if (!answer || answer === "?") {
    showFeedback({ status: "syntax_error", message: "Scrivi una derivata prima di verificare." });
    playError();
    return;
  }

  const result = verifyDerivative(answer, room.derivativeSympy);
  recordAttempt(room, result.status);
  showFeedback(result);
  if (result.status === "correct") {
    element<MathfieldElement>("answer-field").disabled = true;
    element<HTMLButtonElement>("submit-answer").disabled = true;
    setSubmitLabel("Completato", "✓");
    element("answer-row").classList.add("is-correct");
    const chapter = campaign.chapters.find((item) => item.rooms.includes(room));
    const score = state.rooms[room.id].score;
    lastSolvedRoomId = room.id;
    render();
    if (chapter) {
      const index = chapterIndex(chapter.id);
      const next = isChapterComplete(chapter) ? campaign.chapters[index + 1] : undefined;
      showRoomComplete(room, score, chapter, next);
    }
  } else {
    playError();
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Celebrazione esplicita: la stanza riattivata resta leggibile prima di tornare al palazzo. */
function showRoomComplete(
  room: Room,
  score: number,
  chapter: Chapter,
  next: Chapter | undefined,
): void {
  const main = mainRooms(chapter);
  element("room-complete-name").textContent = room.name;
  element("room-complete-score").textContent = `+${score} punti`;
  const isLastChapter = chapterIndex(chapter.id) === campaign.chapters.length - 1;
  element("room-complete-note").textContent = next
    ? `Capitolo ${next.number} sbloccato: ${next.name}.`
    : isChapterComplete(chapter) && isLastChapter
      ? "Il palazzo ha ritrovato il suo tempo. Campagna completata!"
      : `Capitolo ${chapter.number} · ${solvedIn(main)} di ${main.length} stanze riattivate.`;
  const dialog = element<HTMLDialogElement>("room-complete-dialog");
  if (!dialog.open) dialog.showModal();
  element<HTMLButtonElement>("room-complete-continue").focus();
  window.clearTimeout(roomCompleteTimer);
  roomCompleteTimer = window.setTimeout(
    () => {
      if (dialog.open) dialog.close();
    },
    prefersReducedMotion() ? 1800 : 3200,
  );
}

function hideRoomComplete(): void {
  window.clearTimeout(roomCompleteTimer);
  const dialog = element<HTMLDialogElement>("room-complete-dialog");
  if (dialog.open) dialog.close();
}

function focusAndHighlightRoom(roomId: string): void {
  const card = document.querySelector<HTMLButtonElement>(`[data-room-id="${roomId}"]`);
  if (!card) return;
  card.classList.add("just-solved");
  card.focus();
  window.setTimeout(() => card.classList.remove("just-solved"), 1800);
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

function resetCampaign(): void {
  window.clearTimeout(toastTimer);
  hideRoomComplete();
  state.version = campaign.version;
  state.activeChapter = campaign.chapters[0]?.id ?? "";
  state.rooms = Object.fromEntries(allRooms.map((room) => [room.id, emptyRoomProgress()]));
  save();
  activeRoomId = null;
  element<HTMLDialogElement>("puzzle-dialog").close();
  element<HTMLDialogElement>("confirm-dialog").close();
  render();
  showToast("Il palazzo è tornato al suo silenzio iniziale.", "↻");
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
      if (event.key !== "Escape") return;
      // Con la celebrazione aperta, lascia che il browser chiuda il dialogo in cima.
      if (element<HTMLDialogElement>("room-complete-dialog").open) return;
      if (!dialog.open) return;
      event.preventDefault();
      dialog.close();
    },
    true,
  );
  const completeDialog = element<HTMLDialogElement>("room-complete-dialog");
  element("room-complete-continue").addEventListener("click", () => completeDialog.close());
  completeDialog.addEventListener("close", () => {
    window.clearTimeout(roomCompleteTimer);
    if (dialog.open) dialog.close();
  });
  dialog.addEventListener("close", () => {
    window.mathVirtualKeyboard.hide();
    const roomId = activeRoomId;
    activeRoomId = null;
    const solvedId = lastSolvedRoomId;
    lastSolvedRoomId = null;
    if (solvedId) {
      render();
      focusAndHighlightRoom(solvedId);
      return;
    }
    if (roomId) {
      document.querySelector<HTMLButtonElement>(`[data-room-id="${roomId}"]`)?.focus();
    }
  });

  element("reset-button").addEventListener("click", () => {
    if (totalSolved() === 0) {
      resetCampaign();
      return;
    }
    const confirm = element<HTMLDialogElement>("confirm-dialog");
    if (!confirm.open) confirm.showModal();
    element<HTMLButtonElement>("cancel-reset").focus();
  });
  element("cancel-reset").addEventListener("click", () => {
    element<HTMLDialogElement>("confirm-dialog").close();
  });
  element("confirm-reset").addEventListener("click", resetCampaign);
}

function start(): void {
  bind();
  render();
  showWelcome();
}

start();
