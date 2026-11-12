export const AUDIO_STORAGE_KEY = "palazzo-derivate:audio";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const HIJAZ_SCALE = [293.66, 311.13, 369.99, 392, 440, 466.16, 523.25, 587.33];
const MELODY = [
  7, -1, 6, 5, -1, 4, 5, 6, 7, 6, 4, -1, 5, 4, 3, 4, 2, -1, 3, 4, 5, -1, 4, 3, 2, 3, 4, -1, 2, -1,
  -1, -1,
];
const DUM_STEPS = new Set([0, 6, 16, 22]);
const TEK_STEPS = new Set([4, 8, 12, 20, 24, 28]);
const DRONE_FREQUENCIES = [73.42, 110, 146.83];
const TEMPO = 68;
const STEP_SECONDS = 60 / TEMPO / 2;
const LOOKAHEAD_SECONDS = 0.7;
const SCHEDULER_MS = 200;
const MASTER_VOLUME = 0.55;

type AudioContextConstructor = new () => AudioContext;

export class AmbientMusic {
  private context?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private timer?: number;
  private nextNoteTime = 0;
  private step = 0;
  private paused = false;
  private enabled: boolean;

  constructor(private readonly storage?: StorageLike) {
    this.enabled = this.readPreference();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get isPlaying(): boolean {
    return this.timer !== undefined;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.persistPreference(enabled);
    if (enabled) {
      void this.start();
    } else {
      this.stop();
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  async start(): Promise<void> {
    if (!this.enabled || typeof window === "undefined") return;
    if (!this.context) this.createContext();
    if (!this.context || !this.master) return;

    this.paused = false;
    try {
      await this.context.resume();
    } catch {
      return;
    }
    if (this.timer !== undefined) return;

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(0.0001, now);
    this.master.gain.exponentialRampToValueAtTime(MASTER_VOLUME, now + 2.5);
    this.nextNoteTime = now + 0.2;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), SCHEDULER_MS);
    this.schedule();
  }

  stop(): void {
    if (typeof window !== "undefined" && this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    window.setTimeout(() => {
      if (this.timer === undefined) void context.suspend();
    }, 700);
  }

  pause(): void {
    if (typeof window === "undefined" || this.timer === undefined) return;
    window.clearInterval(this.timer);
    this.timer = undefined;
    this.paused = true;
    void this.context?.suspend();
  }

  resume(): void {
    if (!this.paused || !this.enabled || !this.context) return;
    this.paused = false;
    const context = this.context;
    void context.resume().then(() => {
      if (this.timer !== undefined) return;
      this.nextNoteTime = context.currentTime + 0.15;
      this.timer = window.setInterval(() => this.schedule(), SCHEDULER_MS);
      this.schedule();
    });
  }

  private readPreference(): boolean {
    try {
      return this.storage?.getItem(AUDIO_STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  }

  private persistPreference(enabled: boolean): void {
    try {
      this.storage?.setItem(AUDIO_STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      return;
    }
  }

  private createContext(): void {
    const Constructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
    if (!Constructor) return;

    let context: AudioContext;
    try {
      context = new Constructor();
    } catch {
      return;
    }

    const master = context.createGain();
    master.gain.value = 0.0001;
    master.connect(context.destination);

    this.context = context;
    this.master = master;
    this.noise = this.createNoise(context);
    this.startDrone(context, master);
  }

  private createNoise(context: AudioContext): AudioBuffer {
    const length = Math.floor(context.sampleRate * 0.4);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private startDrone(context: AudioContext, master: GainNode): void {
    DRONE_FREQUENCIES.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 520;

      const gain = context.createGain();
      gain.gain.value = index === 0 ? 0.035 : 0.022;

      const lfo = context.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.07 + index * 0.013;
      const lfoDepth = context.createGain();
      lfoDepth.gain.value = 0.012;
      lfo.connect(lfoDepth).connect(gain.gain);
      lfo.start();

      oscillator.connect(filter).connect(gain).connect(master);
      oscillator.start();
    });
  }

  private schedule(): void {
    const context = this.context;
    if (!context) return;
    while (this.nextNoteTime < context.currentTime + LOOKAHEAD_SECONDS) {
      this.playStep(this.step, this.nextNoteTime);
      this.nextNoteTime += STEP_SECONDS;
      this.step = (this.step + 1) % MELODY.length;
    }
  }

  private playStep(step: number, time: number): void {
    const note = MELODY[step];
    if (note >= 0) {
      this.pluck(HIJAZ_SCALE[note], time, 1);
      if (step % 16 === 7) this.pluck(HIJAZ_SCALE[note] * 2, time + STEP_SECONDS * 0.5, 0.28);
    }
    if (DUM_STEPS.has(step)) this.drum(time, 0.55, 150);
    if (TEK_STEPS.has(step)) this.drum(time, 0.22, 2200);
  }

  private pluck(frequency: number, time: number, velocity: number): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(2600, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + 0.9);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.16 * velocity, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.7);

    const body = context.createOscillator();
    body.type = "triangle";
    body.frequency.value = frequency;
    body.detune.value = -4;

    const shimmer = context.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = frequency * 2;
    const shimmerGain = context.createGain();
    shimmerGain.gain.value = 0.22;

    body.connect(filter);
    shimmer.connect(shimmerGain).connect(filter);
    filter.connect(gain).connect(master);
    body.start(time);
    shimmer.start(time);
    body.stop(time + 1.8);
    shimmer.stop(time + 1.8);
  }

  private drum(time: number, velocity: number, pitch: number): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || !this.noise) return;

    const source = context.createBufferSource();
    source.buffer = this.noise;

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = pitch;
    filter.Q.value = 1.1;

    const gain = context.createGain();
    gain.gain.setValueAtTime(Math.max(velocity * 0.35, 0.0001), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    source.connect(filter).connect(gain).connect(master);
    source.start(time);
    source.stop(time + 0.2);

    if (pitch < 500) {
      const thump = context.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(88, time);
      thump.frequency.exponentialRampToValueAtTime(52, time + 0.2);
      const thumpGain = context.createGain();
      thumpGain.gain.setValueAtTime(velocity * 0.12, time);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
      thump.connect(thumpGain).connect(master);
      thump.start(time);
      thump.stop(time + 0.3);
    }
  }
}
