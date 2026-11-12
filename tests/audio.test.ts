import { describe, expect, it } from "vitest";
import { AmbientMusic, AUDIO_STORAGE_KEY } from "../client/audio/AmbientMusic";

class MemoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("AmbientMusic", () => {
  it("is enabled by default and persists the preference", () => {
    const storage = new MemoryStorage();
    const music = new AmbientMusic(storage);

    expect(music.isEnabled).toBe(true);

    music.setEnabled(false);
    expect(storage.values.get(AUDIO_STORAGE_KEY)).toBe("off");

    const restored = new AmbientMusic(storage);
    expect(restored.isEnabled).toBe(false);
    expect(restored.toggle()).toBe(true);
    expect(storage.values.get(AUDIO_STORAGE_KEY)).toBe("on");
  });

  it("does not start without a browser audio context", async () => {
    const music = new AmbientMusic(new MemoryStorage());

    await music.start();

    expect(music.isPlaying).toBe(false);
    music.stop();
  });

  it("falls back to enabled when storage is unavailable", () => {
    const music = new AmbientMusic({
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    });

    expect(music.isEnabled).toBe(true);
    expect(() => music.setEnabled(false)).not.toThrow();
  });
});
