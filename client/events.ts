export const gameEvents = new EventTarget();

export function selectMechanism(puzzleId: string): void {
  gameEvents.dispatchEvent(new CustomEvent("select-mechanism", { detail: puzzleId }));
}
