import "./styles.css";
import { AmbientMusic } from "./audio/AmbientMusic";
import { createCourtyard } from "./game/CourtyardScene";
import { gameEvents } from "./events";
import { fetchDemo, verifyAnswer } from "./services";
import { ProgressStore } from "./state/ProgressStore";
import { MathDialog } from "./ui/MathDialog";
import type { DemoContent, Puzzle } from "./types";

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento mancante: ${id}`);
  return found as T;
}

const mechanismIcons: Record<Puzzle["mechanism"], string> = {
  seal: "☼",
  gears: "⚙",
  fountain: "≈",
};

let content: DemoContent;
let store: ProgressStore;
let activePuzzleId: string | null = null;
let toastTimer = 0;
let completionTimer = 0;
const courtyard = createCourtyard();
const music = new AmbientMusic(window.localStorage);

const welcomeDialog = element<HTMLDialogElement>("welcome-dialog");
const journalDialog = element<HTMLDialogElement>("journal-dialog");
const completionDialog = element<HTMLDialogElement>("completion-dialog");
const confirmDialog = element<HTMLDialogElement>("confirm-dialog");
const loadingScreen = element("loading-screen");

const mathDialog = new MathDialog({
  getProgress: () => {
    if (!activePuzzleId) throw new Error("Nessun enigma attivo.");
    return store.snapshot.puzzles[activePuzzleId];
  },
  onHint: () => {
    if (!activePuzzleId) return 0;
    return store.revealHint(activePuzzleId);
  },
  onSubmit: async (answer) => {
    if (!activePuzzleId) throw new Error("Nessun enigma attivo.");
    const puzzleId = activePuzzleId;
    const result = await verifyAnswer(puzzleId, answer);
    const score = store.recordResult(puzzleId, result.status);

    if (result.status === "correct") {
      courtyard.syncProgress(store.snapshot, puzzleId);
      const puzzle = content.puzzles.find((item) => item.id === puzzleId);
      showToast(
        `Ben fatto! ${puzzle ? `«${puzzle.short_title}» è tornato in vita.` : "Il meccanismo si riattiva."}`,
        "✓",
        "success",
      );
      window.setTimeout(() => {
        if (activePuzzleId === puzzleId) mathDialog.close();
        updateCaption();
        if (store.snapshot.completed) {
          completionTimer = window.setTimeout(() => showCompletion(), 2800);
        }
      }, 1900);
      if (score !== null) element("hud-score").textContent = String(store.stats.totalScore);
    }
    return result;
  },
});

function renderMechanisms(): void {
  const snapshot = store.snapshot;
  const list = element("mechanism-list");
  list.replaceChildren();
  const solvedCount = content.puzzles.filter((puzzle) => snapshot.puzzles[puzzle.id].solved).length;

  content.puzzles.forEach((puzzle, index) => {
    const progress = snapshot.puzzles[puzzle.id];
    const unlocked = store.isUnlocked(puzzle.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mechanism-button${progress.solved ? " solved" : ""}${activePuzzleId === puzzle.id ? " active" : ""}`;
    button.dataset.puzzleId = puzzle.id;
    button.disabled = !unlocked;
    button.setAttribute(
      "aria-label",
      `${puzzle.short_title}. ${progress.solved ? `Attivo, ${progress.score} punti` : unlocked ? "Da attivare" : "In attesa del meccanismo precedente"}`,
    );
    button.addEventListener("click", () => openPuzzle(puzzle.id));

    const icon = document.createElement("span");
    icon.className = "mechanism-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = progress.solved ? "✓" : mechanismIcons[puzzle.mechanism];

    const copy = document.createElement("span");
    copy.className = "mechanism-copy";
    const label = document.createElement("small");
    label.textContent = `Enigma 0${index + 1}`;
    const title = document.createElement("strong");
    title.textContent = puzzle.short_title;
    const status = document.createElement("span");
    status.className = "mechanism-score";
    status.textContent = progress.solved
      ? `${progress.score} punti`
      : unlocked
        ? "Da attivare"
        : "In attesa";
    copy.append(label, title, status);

    const arrow = document.createElement("span");
    arrow.className = "mechanism-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = progress.solved ? "↗" : "›";
    button.append(icon, copy, arrow);
    list.append(button);
  });

  element("progress-fraction").textContent = `${solvedCount} / ${content.puzzles.length}`;
  element("progress-bar").style.width = `${(solvedCount / content.puzzles.length) * 100}%`;
  element("hud-score").textContent = String(store.stats.totalScore);
  element("scene-state").textContent = snapshot.completed
    ? "LA PORTA È APERTA"
    : "IL TEMPO È SOSPESO";
}

function updateCaption(): void {
  const caption = element("scene-caption");
  caption.replaceChildren();
  const rune = document.createElement("span");
  rune.className = "caption-rune";
  rune.setAttribute("aria-hidden", "true");
  rune.textContent = "✦";
  const text = document.createElement("p");
  const snapshot = store.snapshot;
  const next = content.puzzles.find((puzzle) => !snapshot.puzzles[puzzle.id].solved);
  if (snapshot.completed) {
    text.append("La porta è aperta. ");
    const strong = document.createElement("strong");
    strong.textContent = "Attraversa la corte";
    text.append(strong, " per concludere.");
  } else if (next) {
    text.append(next.order === 1 ? "Scegli il " : "Ora seleziona ");
    const strong = document.createElement("strong");
    strong.textContent = next.short_title.toLowerCase();
    text.append(strong, next.order === 1 ? " per iniziare." : ".");
  }
  caption.append(rune, text);
}

function showWelcome(): void {
  if (sessionStorage.getItem("palazzo-entered") === "1") return;
  const stats = store.stats;
  element("welcome-copy").textContent = content.intro;
  const button = element<HTMLButtonElement>("enter-button");
  if (stats.solved > 0) {
    element("welcome-title").textContent =
      stats.solved === content.puzzles.length ? "La corte ti attende." : "Il tuo viaggio continua.";
    button.firstChild!.textContent =
      stats.solved === content.puzzles.length ? "Rivedi la corte " : "Continua l'esplorazione ";
  }
  welcomeDialog.showModal();
  button.focus();
}

function enterGame(): void {
  sessionStorage.setItem("palazzo-entered", "1");
  welcomeDialog.close();
  void music.start().then(() => renderAudioButton());
  if (store.stats.solved < content.puzzles.length) {
    const next = content.puzzles.find(
      (puzzle) => !store.snapshot.puzzles[puzzle.id].solved && store.isUnlocked(puzzle.id),
    );
    if (next) {
      element("mechanism-list")
        .querySelector<HTMLButtonElement>(`[data-puzzle-id="${next.id}"]`)
        ?.focus();
    }
  }
}

function openPuzzle(puzzleId: string): void {
  const puzzle = content.puzzles.find((item) => item.id === puzzleId);
  if (!puzzle) return;
  if (!store.isUnlocked(puzzleId)) {
    const previous = content.puzzles[puzzle.order - 2];
    showToast(`Prima riattiva ${previous?.short_title ?? "il meccanismo precedente"}.`, "◈");
    return;
  }
  activePuzzleId = puzzleId;
  store.startPuzzle(puzzleId);
  renderMechanisms();
  mathDialog.open(puzzle);
}

function showCompletion(): void {
  const stats = store.stats;
  element("completion-copy").textContent = content.outro;
  element("final-score").textContent = String(stats.totalScore);
  element("final-attempts").textContent = String(stats.totalAttempts);
  element("final-hints").textContent = String(stats.totalHints);
  element("final-time").textContent = formatTime(stats.elapsedSeconds);
  if (!completionDialog.open) completionDialog.showModal();
  element("close-completion").focus();
}

function resetDemo(): void {
  window.clearTimeout(completionTimer);
  activePuzzleId = null;
  music.stop();
  store.reset();
  courtyard.resetVisuals();
  courtyard.syncProgress(store.snapshot);
  mathDialog.close();
  completionDialog.close();
  confirmDialog.close();
  sessionStorage.removeItem("palazzo-entered");
  updateCaption();
  welcomeDialog.showModal();
  element("enter-button").focus();
  showToast("La corte è tornata al suo silenzio iniziale.", "↻");
}

function showToast(message: string, icon = "✦", variant?: "success"): void {
  window.clearTimeout(toastTimer);
  element("toast-icon").textContent = icon;
  element("toast-message").textContent = message;
  const toast = element("toast");
  toast.className = variant ? `toast is-${variant}` : "toast";
  toast.hidden = false;
  toastTimer = window.setTimeout(
    () => {
      toast.hidden = true;
    },
    variant === "success" ? 5200 : 4200,
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function renderAudioButton(): void {
  const button = element<HTMLButtonElement>("audio-button");
  const playing = music.isEnabled && music.isPlaying;
  const label = playing ? "Disattiva la musica" : "Attiva la musica";
  button.classList.toggle("is-muted", !playing);
  button.setAttribute("aria-pressed", String(playing));
  button.setAttribute("aria-label", label);
  button.title = label;
}

function bindInterface(): void {
  renderAudioButton();
  element("audio-button").addEventListener("click", () => {
    void (async () => {
      if (music.isEnabled && !music.isPlaying) {
        await music.start();
      } else {
        music.toggle();
      }
      renderAudioButton();
    })();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      music.pause();
    } else {
      music.resume();
    }
  });
  element("enter-button").addEventListener("click", enterGame);
  element("close-completion").addEventListener("click", () => completionDialog.close());
  element("replay-button").addEventListener("click", resetDemo);
  element("reset-button").addEventListener("click", () => {
    if (
      store.stats.solved === 0 &&
      store.stats.totalAttempts === 0 &&
      store.stats.totalHints === 0
    ) {
      resetDemo();
    } else {
      confirmDialog.showModal();
      element("cancel-reset").focus();
    }
  });
  element("cancel-reset").addEventListener("click", () => confirmDialog.close());
  element("confirm-reset").addEventListener("click", resetDemo);
  element("help-button").addEventListener("click", () => journalDialog.showModal());
  element("journal-button").addEventListener("click", () => journalDialog.showModal());
  element("close-journal").addEventListener("click", () => journalDialog.close());
  element("retry-button").addEventListener("click", () => window.location.reload());

  gameEvents.addEventListener("select-mechanism", (event) => {
    const puzzleId = (event as CustomEvent<string>).detail;
    if (content.puzzles.some((puzzle) => puzzle.id === puzzleId)) openPuzzle(puzzleId);
  });
}

function hydrateContent(): void {
  element("room-intro").textContent = content.intro;
  element<HTMLButtonElement>("journal-button").setAttribute(
    "aria-label",
    `Consulta le regole. ${content.puzzles.length} meccanismi da riattivare`,
  );
  courtyard.setContent(content.puzzles);
  courtyard.syncProgress(store.snapshot);
  store.subscribe(() => renderMechanisms());
  renderMechanisms();
  updateCaption();
  loadingScreen.hidden = true;
  showWelcome();
}

async function start(): Promise<void> {
  try {
    content = await fetchDemo();
    store = new ProgressStore(content.puzzles, content.version, window.localStorage);
    bindInterface();
    hydrateContent();
  } catch (error) {
    element("loading-title").textContent = "La porta resta chiusa";
    element("loading-message").textContent =
      error instanceof Error ? error.message : "Impossibile caricare il palazzo.";
    element<HTMLButtonElement>("retry-button").hidden = false;
    element<HTMLButtonElement>("retry-button").focus();
  }
}

void start();
