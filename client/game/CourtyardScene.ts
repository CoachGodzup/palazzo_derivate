import Phaser from "phaser";
import { selectMechanism } from "../events";
import type { GameProgress, Puzzle } from "../types";

const GOLD = 0xd5ae62;
const PALE_GOLD = 0xf2d495;
const TURQUOISE = 0x55dbc7;
const NIGHT = 0x071923;

function points(raw: number[][]): Phaser.Geom.Point[] {
  return raw.map(([x, y]) => new Phaser.Geom.Point(x, y));
}

export class CourtyardScene extends Phaser.Scene {
  private puzzles: Puzzle[] = [];
  private progress?: GameProgress;
  private readonly activated = new Set<string>();
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private sealHalo?: Phaser.GameObjects.Graphics;
  private sealRotor?: Phaser.GameObjects.Container;
  private gearA?: Phaser.GameObjects.Container;
  private gearB?: Phaser.GameObjects.Container;
  private water?: Phaser.GameObjects.Graphics;
  private doorLeft?: Phaser.GameObjects.Container;
  private doorRight?: Phaser.GameObjects.Container;
  private doorLight?: Phaser.GameObjects.Graphics;
  private doorLock?: Phaser.GameObjects.Container;
  private readonly stateLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly markers = new Map<string, Phaser.GameObjects.Container>();
  private hotspotsCreated = false;

  constructor() {
    super("courtyard");
  }

  setContent(puzzles: Puzzle[]): void {
    this.puzzles = puzzles;
    if (!this.scene.isActive()) return;
    this.drawLabels();
    if (!this.hotspotsCreated) {
      this.createHotspots();
      this.hotspotsCreated = true;
    }
    if (this.progress) this.syncProgress(this.progress);
  }

  resetVisuals(): void {
    this.activated.clear();
    this.progress = undefined;
    this.sealHalo?.setAlpha(0.15);
    this.sealRotor?.setRotation(0);
    this.gearA?.setRotation(0);
    this.gearB?.setRotation(0);
    this.water?.clear();
    this.doorLock?.setVisible(true);
    this.doorLight?.setAlpha(0.12);
    if (this.doorLeft) {
      this.tweens.killTweensOf(this.doorLeft);
      this.doorLeft.setX(520);
    }
    if (this.doorRight) {
      this.tweens.killTweensOf(this.doorRight);
      this.doorRight.setX(640);
    }
    for (const puzzle of this.puzzles) {
      this.stateLabels.get(puzzle.id)?.setText("SELEZIONA").setColor("#76acae");
      this.markers.get(puzzle.id)?.setAlpha(1);
    }
  }

  syncProgress(progress: GameProgress, animateId?: string): void {
    this.progress = progress;
    if (!this.scene.isActive() || !this.sealHalo) return;

    for (const puzzle of this.puzzles) {
      const solved = progress.puzzles[puzzle.id]?.solved ?? false;
      this.stateLabels
        .get(puzzle.id)
        ?.setText(solved ? "ATTIVO" : this.isUnlocked(puzzle.id) ? "SELEZIONA" : "IN ATTESA");
      this.updateMarker(puzzle.id);
      if (!solved || this.activated.has(puzzle.id)) continue;
      this.activated.add(puzzle.id);
      this.activate(puzzle, animateId === puzzle.id);
    }

    if (progress.completed) this.openDoor(animateId === this.puzzles.at(-1)?.id);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(NIGHT);
    this.drawArchitecture();
    this.drawDoor();
    this.drawSeal();
    this.drawGears();
    this.drawFountain();
    this.drawLabels();
    if (this.puzzles.length > 0) {
      this.createHotspots();
      this.hotspotsCreated = true;
    }
    if (this.progress) this.syncProgress(this.progress);
  }

  update(time: number, delta: number): void {
    if (this.activated.has("c1-sigillo") && this.sealRotor && !this.reducedMotion) {
      this.sealRotor.rotation += delta * 0.00022;
    }
    if (this.activated.has("c1-ingranaggi") && this.gearA && this.gearB && !this.reducedMotion) {
      this.gearA.rotation += delta * 0.00065;
      this.gearB.rotation -= delta * 0.00087;
    }
    if (this.water) {
      this.water.clear();
      if (this.activated.has("c1-fontana")) this.animateWater(time);
    }
    const next = this.puzzles.find(
      (puzzle) => !this.activated.has(puzzle.id) && this.isUnlocked(puzzle.id),
    );
    if (next && !this.reducedMotion) {
      const marker = this.markers.get(next.id);
      if (marker) marker.setAlpha(0.82 + Math.sin(time * 0.003) * 0.18);
    }
  }

  private drawArchitecture(): void {
    const background = this.add.graphics();
    background.fillGradientStyle(0x071621, 0x071621, 0x103747, 0x103747, 1);
    background.fillRect(0, 0, 1280, 510);
    background.fillGradientStyle(0x142b34, 0x142b34, 0x071319, 0x071319, 1);
    background.fillRect(0, 510, 1280, 210);

    for (let index = 0; index < 85; index += 1) {
      const x = ((index * 149 + 47) % 1240) + 20;
      const y = ((index * 71 + 23) % 300) + 20;
      background.fillStyle(index % 7 === 0 ? PALE_GOLD : 0x8fc2c8, 0.18 + (index % 4) * 0.08);
      background.fillCircle(x, y, index % 9 === 0 ? 1.8 : 1);
    }

    background.fillStyle(0x061219, 0.8);
    for (const x of [80, 180, 1060, 1160]) {
      background.fillRect(x - 45, 215, 90, 265);
      background.fillCircle(x, 210, 45);
      background.fillTriangle(x - 60, 205, x, 120, x + 60, 205);
      background.fillRect(x - 3, 100, 6, 40);
    }

    const walls = this.add.graphics();
    walls.fillStyle(0x102832);
    walls.fillRect(0, 145, 1280, 385);
    walls.fillStyle(0x183844, 0.9);
    walls.fillRect(0, 300, 1280, 15);
    walls.lineStyle(2, GOLD, 0.18);
    walls.lineBetween(0, 316, 500, 316);
    walls.lineBetween(780, 316, 1280, 316);

    for (const center of [100, 350, 930, 1180]) {
      walls.fillStyle(0x061923);
      walls.fillPoints(
        points([
          [center - 70, 365],
          [center - 70, 240],
          [center, 145],
          [center + 70, 240],
          [center + 70, 365],
        ]),
        true,
      );
      walls.lineStyle(4, GOLD, 0.25);
      walls.strokePoints(
        points([
          [center - 78, 365],
          [center - 78, 238],
          [center, 134],
          [center + 78, 238],
          [center + 78, 365],
        ]),
        false,
      );
    }

    const columns = this.add.graphics();
    for (const x of [38, 440, 840, 1242]) {
      columns.fillGradientStyle(0x254552, 0x102733, 0x122b37, 0x091b24, 1);
      columns.fillRect(x - 28, 105, 56, 430);
      columns.fillStyle(0x315563);
      columns.fillRect(x - 34, 110, 68, 18);
      columns.fillRect(x - 42, 510, 84, 22);
      columns.lineStyle(2, GOLD, 0.25);
      columns.strokeRect(x - 21, 140, 42, 350);
      for (let y = 160; y < 490; y += 44) columns.lineBetween(x - 20, y, x + 20, y + 22);
    }

    const floor = this.add.graphics();
    floor.lineStyle(1, 0x63909a, 0.13);
    for (let x = -400; x <= 1680; x += 135) floor.lineBetween(640, 380, x, 720);
    for (const y of [510, 545, 590, 650, 720]) floor.lineBetween(0, y, 1280, y);
    floor.lineStyle(2, GOLD, 0.18);
    floor.strokeEllipse(640, 626, 600, 140);
    floor.strokeEllipse(640, 626, 510, 108);

    this.add
      .text(640, 43, "✦   L A   C O R T E   D E L L E   M E R I D I A N E   ✦", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#bda776",
      })
      .setOrigin(0.5);
  }

  private drawDoor(): void {
    const frame = this.add.graphics();
    frame.fillStyle(0x030b10);
    frame.fillPoints(
      points([
        [505, 510],
        [505, 275],
        [640, 115],
        [775, 275],
        [775, 510],
      ]),
      true,
    );
    this.doorLight = this.add.graphics();
    this.doorLight.fillGradientStyle(0x0a777b, 0x0a777b, 0x48c9b7, 0x48c9b7, 0.85);
    this.doorLight.fillPoints(
      points([
        [520, 505],
        [520, 278],
        [640, 140],
        [760, 278],
        [760, 505],
      ]),
      true,
    );
    this.doorLight.lineStyle(2, PALE_GOLD, 0.7);
    for (let y = 180; y < 500; y += 28) this.doorLight.lineBetween(590, y, 690, y + 50);
    this.doorLight.setAlpha(0.12);

    const left = this.add.graphics();
    left.fillGradientStyle(0x173947, 0x214958, 0x0c2530, 0x102c38, 1);
    left.fillPoints(
      points([
        [0, 310],
        [0, 85],
        [120, 0],
        [120, 310],
      ]),
      true,
    );
    left.lineStyle(4, GOLD, 0.65);
    left.strokePoints(
      points([
        [5, 303],
        [5, 90],
        [117, 8],
        [117, 303],
      ]),
      false,
    );
    left.lineStyle(2, GOLD, 0.35);
    left.strokeRect(20, 155, 82, 125);
    left.lineBetween(20, 220, 102, 155);
    left.lineBetween(20, 155, 102, 220);
    this.doorLeft = this.add.container(520, 195, [left]);

    const right = this.add.graphics();
    right.fillGradientStyle(0x214958, 0x173947, 0x102c38, 0x0c2530, 1);
    right.fillPoints(
      points([
        [0, 0],
        [120, 85],
        [120, 310],
        [0, 310],
      ]),
      true,
    );
    right.lineStyle(4, GOLD, 0.65);
    right.strokePoints(
      points([
        [3, 8],
        [115, 90],
        [115, 303],
        [3, 303],
      ]),
      false,
    );
    right.lineStyle(2, GOLD, 0.35);
    right.strokeRect(18, 155, 82, 125);
    right.lineBetween(18, 155, 100, 220);
    right.lineBetween(18, 220, 100, 155);
    this.doorRight = this.add.container(640, 195, [right]);

    const arch = this.add.graphics();
    for (const offset of [0, 12, 25]) {
      arch.lineStyle(
        offset === 12 ? 7 : 2,
        offset === 12 ? 0x6b5835 : GOLD,
        offset === 12 ? 1 : 0.6,
      );
      arch.strokePoints(
        points([
          [500 - offset / 3, 512],
          [500 - offset / 3, 273],
          [640, 105 - offset],
          [780 + offset / 3, 273],
          [780 + offset / 3, 512],
        ]),
        false,
      );
    }
    for (let index = 0; index < 9; index += 1) {
      const angle = Math.PI + (index / 8) * Math.PI;
      arch.fillStyle(PALE_GOLD, 0.65);
      arch.fillCircle(640 + Math.cos(angle) * 152, 285 + Math.sin(angle) * 152, 3);
    }

    const lock = this.add.graphics();
    lock.fillStyle(0x0b2029);
    lock.fillCircle(0, 0, 36);
    lock.lineStyle(3, GOLD, 0.9);
    lock.strokeCircle(0, 0, 36);
    lock.strokeCircle(0, 0, 26);
    lock.fillStyle(GOLD);
    lock.fillPoints(
      points([
        [0, -15],
        [6, -4],
        [18, 0],
        [6, 5],
        [0, 16],
        [-6, 5],
        [-18, 0],
        [-6, -4],
      ]),
      true,
    );
    this.doorLock = this.add.container(640, 345, [lock]);
  }

  private drawSeal(): void {
    const pedestal = this.add.graphics();
    pedestal.fillGradientStyle(0x1e414e, 0x122d38, 0x0c222c, 0x0c222c, 1);
    pedestal.fillPoints(
      points([
        [180, 450],
        [320, 450],
        [300, 370],
        [200, 370],
      ]),
      true,
    );
    pedestal.fillStyle(0x264b56);
    pedestal.fillRect(170, 445, 160, 16);
    pedestal.lineStyle(2, GOLD, 0.4);
    pedestal.strokeRect(214, 388, 72, 45);
    pedestal.lineBetween(214, 388, 286, 433);
    pedestal.lineBetween(286, 388, 214, 433);

    this.sealHalo = this.add.graphics();
    this.sealHalo.lineStyle(18, TURQUOISE, 0.13);
    this.sealHalo.strokeCircle(250, 288, 94);
    this.sealHalo.lineStyle(3, TURQUOISE, 0.5);
    this.sealHalo.strokeCircle(250, 288, 94);
    this.sealHalo.setAlpha(0.15);

    const rotor = this.add.graphics();
    rotor.lineStyle(3, GOLD, 0.65);
    for (let index = 0; index < 24; index += 1) {
      const angle = (index / 24) * Math.PI * 2;
      const inner = index % 2 === 0 ? 59 : 65;
      rotor.lineBetween(
        Math.cos(angle) * inner,
        Math.sin(angle) * inner,
        Math.cos(angle) * 76,
        Math.sin(angle) * 76,
      );
    }
    rotor.strokeCircle(0, 0, 52);
    this.sealRotor = this.add.container(250, 288, [rotor]);

    const disc = this.add.graphics();
    disc.fillGradientStyle(0x9a743b, 0x735126, 0x402f1c, 0x5c4020, 1);
    disc.fillCircle(250, 288, 49);
    disc.lineStyle(2, PALE_GOLD, 0.8);
    disc.strokeCircle(250, 288, 42);
    disc.fillStyle(PALE_GOLD, 0.8);
    disc.fillPoints(
      points([
        [250, 252],
        [258, 276],
        [284, 288],
        [258, 298],
        [250, 324],
        [240, 298],
        [216, 288],
        [240, 276],
      ]),
      true,
    );
    disc.fillStyle(0x183440);
    disc.fillCircle(250, 288, 10);
  }

  private makeGear(x: number, y: number, radius: number): Phaser.GameObjects.Container {
    const gear = this.add.graphics();
    const outline: number[][] = [];
    for (let index = 0; index < 64; index += 1) {
      const angle = (index / 64) * Math.PI * 2;
      const r = index % 4 < 2 ? radius : radius * 0.81;
      outline.push([Math.cos(angle) * r, Math.sin(angle) * r]);
    }
    gear.fillStyle(0x74582f);
    gear.fillPoints(points(outline), true);
    gear.lineStyle(3, PALE_GOLD, 0.55);
    gear.strokePoints(points(outline), true);
    gear.lineStyle(7, 0xbb9553);
    gear.strokeCircle(0, 0, radius * 0.64);
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      gear.lineStyle(10, 0x9b773d);
      gear.lineBetween(
        Math.cos(angle) * 10,
        Math.sin(angle) * 10,
        Math.cos(angle) * radius * 0.57,
        Math.sin(angle) * radius * 0.57,
      );
    }
    gear.fillStyle(0x142e38);
    gear.fillCircle(0, 0, radius * 0.2);
    gear.lineStyle(2, PALE_GOLD, 0.8);
    gear.strokeCircle(0, 0, radius * 0.2);
    return this.add.container(x, y, [gear]);
  }

  private drawGears(): void {
    const backing = this.add.graphics();
    backing.fillStyle(0x081a22, 0.9);
    backing.fillCircle(1040, 292, 118);
    backing.lineStyle(3, GOLD, 0.25);
    backing.strokeCircle(1040, 292, 119);
    this.gearA = this.makeGear(1003, 320, 65);
    this.gearB = this.makeGear(1090, 251, 50);
    const mount = this.add.graphics();
    mount.fillStyle(0x16333e);
    mount.fillPoints(
      points([
        [975, 455],
        [1140, 455],
        [1090, 375],
        [1025, 375],
      ]),
      true,
    );
    mount.fillRect(965, 450, 185, 15);
  }

  private drawFountain(): void {
    const fountain = this.add.graphics();
    fountain.fillStyle(0x071b24, 0.6);
    fountain.fillEllipse(640, 615, 350, 75);
    fountain.fillGradientStyle(0x244b55, 0x183944, 0x0c2732, 0x0c2732, 1);
    fountain.fillRect(606, 437, 68, 118);
    fountain.fillEllipse(640, 435, 190, 42);
    fountain.fillStyle(0x0a222c);
    fountain.fillEllipse(640, 442, 165, 28);
    fountain.lineStyle(3, GOLD, 0.45);
    fountain.strokeEllipse(640, 435, 190, 42);
    fountain.fillGradientStyle(0x2a535e, 0x183b48, 0x102d39, 0x102d39, 1);
    fountain.fillPoints(
      points([
        [475, 538],
        [805, 538],
        [765, 605],
        [515, 605],
      ]),
      true,
    );
    fountain.fillStyle(0x315b64);
    fountain.fillEllipse(640, 540, 340, 72);
    fountain.fillStyle(0x09242f);
    fountain.fillEllipse(640, 535, 310, 53);
    fountain.lineStyle(3, GOLD, 0.42);
    fountain.strokeEllipse(640, 540, 340, 72);
    fountain.lineStyle(1, GOLD, 0.28);
    for (const x of [540, 575, 610, 670, 705, 740])
      fountain.lineBetween(x, 568, x + (640 - x) * 0.08, 596);
    this.water = this.add.graphics();
  }

  private animateWater(time: number): void {
    if (!this.water) return;
    const phase = time * 0.004;
    this.water.fillStyle(0x28a7ae, 0.38);
    this.water.fillEllipse(640, 534, 300, 47);
    this.water.lineStyle(2, 0x7cf3e4, 0.5);
    this.water.strokeEllipse(640, 531, 250 + Math.sin(phase) * 18, 28);
    for (let stream = 0; stream < 5; stream += 1) {
      const x = 611 + stream * 14;
      this.water.lineStyle(3, stream % 2 === 0 ? 0x80f8e7 : 0x32b8c2, 0.65);
      this.water.beginPath();
      this.water.moveTo(640, 315);
      for (let y = 315; y <= 440; y += 12) {
        this.water.lineTo(x + Math.sin(y * 0.07 + phase + stream) * 3, y);
      }
      this.water.strokePath();
    }
    this.water.lineStyle(3, 0x55d9d5, 0.55);
    for (const direction of [-1, 1]) {
      for (let jet = 0; jet < 3; jet += 1) {
        this.water.beginPath();
        this.water.moveTo(640, 435);
        for (let step = 0; step <= 20; step += 1) {
          const t = step / 20;
          this.water.lineTo(
            640 + direction * t * (95 + jet * 25),
            430 - Math.sin(t * Math.PI) * (68 + jet * 9) + t * 100,
          );
        }
        this.water.strokePath();
      }
    }
    for (let drop = 0; drop < 16; drop += 1) {
      const t = (time * 0.00035 + drop * 0.13) % 1;
      const angle = drop * 2.4;
      this.water.fillStyle(0x93fff0, 1 - t);
      this.water.fillCircle(
        640 + Math.cos(angle) * t * 130,
        430 + Math.sin(angle) * t * 28 - Math.sin(t * Math.PI) * 75,
        2.2,
      );
    }
  }

  private drawLabels(): void {
    if (!this.scene.isActive() || this.puzzles.length === 0) return;
    const positions: Record<string, [number, number]> = {
      "c1-sigillo": [250, 487],
      "c1-ingranaggi": [1050, 493],
      "c1-fontana": [640, 668],
    };
    for (const puzzle of this.puzzles) {
      const [x, y] = positions[puzzle.id];
      if (!this.markers.has(puzzle.id)) {
        const label = this.add
          .text(
            0,
            0,
            `${["I", "II", "III"][puzzle.order - 1]}  ·  ${puzzle.short_title.toUpperCase()}`,
            {
              fontFamily: "Georgia, serif",
              fontSize: "15px",
              color: "#e5c98b",
              align: "center",
              backgroundColor: "#071923cc",
              padding: { x: 12, y: 7 },
            },
          )
          .setOrigin(0.5);
        const status = this.add
          .text(0, 31, "SELEZIONA", {
            fontFamily: "Arial, sans-serif",
            fontSize: "9px",
            color: "#76acae",
            letterSpacing: 2,
          })
          .setOrigin(0.5);
        this.markers.set(puzzle.id, this.add.container(x, y, [label, status]));
        this.stateLabels.set(puzzle.id, status);
      }
    }
  }

  private createHotspots(): void {
    const zones: Record<string, [number, number, number, number]> = {
      "c1-sigillo": [250, 320, 220, 320],
      "c1-ingranaggi": [1040, 315, 240, 300],
      "c1-fontana": [640, 510, 340, 270],
    };
    for (const puzzle of this.puzzles) {
      const [x, y, width, height] = zones[puzzle.id];
      const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => selectMechanism(puzzle.id));
      zone.on("pointerover", () => this.markers.get(puzzle.id)?.setScale(1.06));
      zone.on("pointerout", () => this.markers.get(puzzle.id)?.setScale(1));
    }
  }

  private isUnlocked(puzzleId: string): boolean {
    if (!this.progress) return puzzleId === this.puzzles[0]?.id;
    const index = this.puzzles.findIndex((puzzle) => puzzle.id === puzzleId);
    return index === 0 || this.progress.puzzles[this.puzzles[index - 1]?.id]?.solved === true;
  }

  private updateMarker(puzzleId: string): void {
    const solved = this.progress?.puzzles[puzzleId]?.solved ?? false;
    const marker = this.markers.get(puzzleId);
    if (!marker) return;
    marker.setAlpha(solved ? 0.72 : 1);
    this.stateLabels.get(puzzleId)?.setColor(solved ? "#6fe0c5" : "#76acae");
  }

  private activate(puzzle: Puzzle, animate: boolean): void {
    if (puzzle.mechanism === "seal") this.sealHalo?.setAlpha(1);
    if (animate) {
      const positions: Record<Puzzle["mechanism"], readonly [number, number]> = {
        seal: [250, 288],
        gears: [1040, 290],
        fountain: [640, 430],
      };
      const [x, y] = positions[puzzle.mechanism];
      this.burst(x, y);
      this.cameras.main.flash(180, 95, 220, 195, false);
    }
  }

  private burst(x: number, y: number): void {
    if (this.reducedMotion) return;
    for (let index = 0; index < 22; index += 1) {
      const angle = (index / 22) * Math.PI * 2;
      const distance = 60 + (index % 5) * 18;
      const spark = this.add.star(x, y, 4, 2, 7, index % 2 === 0 ? PALE_GOLD : TURQUOISE);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 800 + (index % 4) * 130,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private openDoor(animate: boolean): void {
    if (!this.doorLeft || !this.doorRight || !this.doorLight || !this.doorLock) return;
    this.doorLight.setAlpha(animate && !this.reducedMotion ? 0.2 : 0.85);
    this.doorLock.setVisible(false);
    if (animate && !this.reducedMotion) {
      this.tweens.add({ targets: this.doorLeft, x: 415, duration: 1700, ease: "Cubic.easeInOut" });
      this.tweens.add({ targets: this.doorRight, x: 745, duration: 1700, ease: "Cubic.easeInOut" });
      this.tweens.add({ targets: this.doorLight, alpha: 0.85, duration: 1800 });
    } else {
      this.doorLeft.setX(415);
      this.doorRight.setX(745);
    }
  }
}

export function createCourtyard(): CourtyardScene {
  const courtyard = new CourtyardScene();
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-container",
    width: 1280,
    height: 720,
    backgroundColor: "#071923",
    scene: [courtyard],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
    audio: { noAudio: true },
    banner: false,
  });
  return courtyard;
}
