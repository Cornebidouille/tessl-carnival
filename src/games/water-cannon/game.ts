import {
  canvasFont,
  currentSkin,
  rankOf,
  recordScore,
  theme,
  type CarnivalGame,
  type SkinId,
} from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const TANK_SIZE = 15;
export const SHOT_SPEED = 700;
export const CANNON = { x: WIDTH / 2, y: HEIGHT - 30 } as const;
const RAILS = [
  { y: 110, speed: 180, radius: 22 },
  { y: 200, speed: -120, radius: 28 },
  { y: 290, speed: 60, radius: 34 },
];
const TARGETS_PER_RAIL = 3;

/** The toys on the Christmas skin's test rails, one kind per rail, top to bottom. */
export const TOYS = ['present', 'soldier', 'bear'] as const;
export type Toy = (typeof TOYS)[number];

/** The words the game uses, which change with the skin. */
export interface CannonLabels {
  name: string;
  description: string;
  /** The counter's label, as in "Water 12/15". */
  ammo: string;
  gameOver: (score: number) => string;
}

/** Water Cannon on the carnival skin, Snowball Cannon on the Christmas skin. */
export function labelsFor(skin: SkinId): CannonLabels {
  if (skin === 'christmas') {
    return {
      name: 'Snowball Cannon',
      description:
        'Knock the toys off the test rails before your snowballs run out. Faster toys score more.',
      ammo: 'Snowballs',
      gameOver: (score) => `Out of snowballs! You scored ${score}`,
    };
  }
  return {
    name: 'Water Cannon',
    description: 'Soak the targets before your tank runs dry. Faster targets score more.',
    ammo: 'Water',
    gameOver: (score) => `Tank empty! You scored ${score}`,
  };
}

/** The toy a target is drawn as on the Christmas skin, picked by its rail. */
export function toyFor(target: Pick<Target, 'y'>): Toy {
  const rail = RAILS.findIndex((r) => r.y === target.y);
  return TOYS[Math.max(rail, 0)] ?? TOYS[0];
}

// Picked once, when the module loads, as `theme` is.
const skin = currentSkin();
const labels = labelsFor(skin);

export interface Target {
  x: number;
  y: number;
  radius: number;
  /** Pixels per second; negative moves left. */
  speed: number;
}

export interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Splash {
  x: number;
  y: number;
  age: number;
}

export interface WaterCannonState {
  targets: Target[];
  shots: Shot[];
  splashes: Splash[];
  tank: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): WaterCannonState {
  const spacing = WIDTH / TARGETS_PER_RAIL;
  const targets = RAILS.flatMap((rail) =>
    Array.from({ length: TARGETS_PER_RAIL }, (_, i) => ({
      x: spacing * i + spacing / 2,
      y: rail.y,
      radius: rail.radius,
      speed: rail.speed,
    })),
  );
  return { targets, shots: [], splashes: [], tank: TANK_SIZE, score: 0, phase: 'playing' };
}

/** Faster targets are worth more: 10 points per 60 px/s, rounded up. */
export function scoreForHit(target: Target): number {
  return 10 * Math.ceil(Math.abs(target.speed) / 60);
}

export function isHit(shot: Shot, target: Target): boolean {
  return Math.hypot(shot.x - target.x, shot.y - target.y) <= target.radius;
}

/** Fires one shot of water towards the aim point. Returns false if nothing fired. */
export function fire(state: WaterCannonState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.tank === 0) return false;
  const dx = aimX - CANNON.x;
  const dy = Math.min(aimY - CANNON.y, -1);
  const length = Math.hypot(dx, dy);
  state.shots.push({
    x: CANNON.x,
    y: CANNON.y,
    vx: (dx / length) * SHOT_SPEED,
    vy: (dy / length) * SHOT_SPEED,
  });
  state.tank -= 1;
  return true;
}

/**
 * What a click or the Space bar does: fires at the aim point during a round, or
 * starts a new round on the game over screen. Returns the state to play on.
 */
export function press(state: WaterCannonState, aimX: number, aimY: number): WaterCannonState {
  if (state.phase === 'over') return createState();
  fire(state, aimX, aimY);
  return state;
}

/** The game over line for a score's place on the board: "New best!", "2nd best score" and so on. */
export function placeText(place: number): string {
  if (place <= 1) return 'New best!';
  const teen = place % 100 >= 11 && place % 100 <= 13;
  const suffix = teen ? 'th' : (['th', 'st', 'nd', 'rd'][place % 10] ?? 'th');
  return `${place}${suffix} best score`;
}

/** Advances the game by `dt` seconds. */
export function step(state: WaterCannonState, dt: number): void {
  for (const target of state.targets) {
    target.x += target.speed * dt;
    if (target.x > WIDTH + target.radius) target.x = -target.radius;
    if (target.x < -target.radius) target.x = WIDTH + target.radius;
  }

  const remaining: Shot[] = [];
  for (const shot of state.shots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    const target = state.targets.find((t) => isHit(shot, t));
    if (target) {
      state.score += scoreForHit(target);
      state.splashes.push({ x: target.x, y: target.y, age: 0 });
      // Send the soaked target back to the start of its rail.
      target.x = target.speed > 0 ? -target.radius : WIDTH + target.radius;
    } else if (shot.y > -10 && shot.x > -10 && shot.x < WIDTH + 10) {
      remaining.push(shot);
    }
  }
  state.shots = remaining;

  for (const splash of state.splashes) splash.age += dt;
  state.splashes = state.splashes.filter((s) => s.age < 0.4);

  if (state.tank === 0 && state.shots.length === 0) state.phase = 'over';
}

type Colors = typeof theme.colors;

function drawRoundTarget(ctx: CanvasRenderingContext2D, colors: Colors, target: Target) {
  ctx.fillStyle = colors.stripeB;
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeB;
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws a toy that fits inside the target's hit circle. */
function drawToy(ctx: CanvasRenderingContext2D, colors: Colors, target: Target) {
  const { x, y, radius: r } = target;
  const toy = toyFor(target);
  if (toy === 'present') {
    const side = r * 1.3;
    ctx.fillStyle = colors.stripeA;
    ctx.fillRect(x - side / 2, y - side / 2, side, side);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(x - r * 0.12, y - side / 2, r * 0.24, side);
    ctx.fillRect(x - side / 2, y - r * 0.12, side, r * 0.24);
    disc(ctx, x - r * 0.25, y - side / 2 - r * 0.12, r * 0.2);
    disc(ctx, x + r * 0.25, y - side / 2 - r * 0.12, r * 0.2);
  } else if (toy === 'soldier') {
    // Tall hat, face, red jacket with a white belt, dark legs.
    ctx.fillStyle = colors.surface;
    ctx.fillRect(x - r * 0.3, y - r * 0.95, r * 0.6, r * 0.45);
    ctx.fillRect(x - r * 0.35, y + r * 0.4, r * 0.7, r * 0.55);
    ctx.fillStyle = colors.stripeB;
    disc(ctx, x, y - r * 0.32, r * 0.22);
    ctx.fillStyle = colors.stripeA;
    ctx.fillRect(x - r * 0.4, y - r * 0.1, r * 0.8, r * 0.5);
    ctx.fillStyle = colors.stripeB;
    ctx.fillRect(x - r * 0.4, y + r * 0.18, r * 0.8, r * 0.08);
    ctx.fillStyle = colors.accent;
    disc(ctx, x, y + r * 0.05, r * 0.06);
  } else {
    // Ears, body, head, muzzle.
    ctx.fillStyle = colors.wood;
    disc(ctx, x - r * 0.38, y - r * 0.62, r * 0.18);
    disc(ctx, x + r * 0.38, y - r * 0.62, r * 0.18);
    disc(ctx, x, y + r * 0.35, r * 0.5);
    disc(ctx, x, y - r * 0.35, r * 0.4);
    ctx.fillStyle = colors.muted;
    disc(ctx, x, y - r * 0.25, r * 0.16);
    ctx.fillStyle = colors.surface;
    disc(ctx, x, y - r * 0.3, r * 0.06);
    disc(ctx, x - r * 0.15, y - r * 0.45, r * 0.05);
    disc(ctx, x + r * 0.15, y - r * 0.45, r * 0.05);
  }
}

/** The carnival skin's striped tent wall. */
function drawAwning(ctx: CanvasRenderingContext2D, colors: Colors) {
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }
}

/** The Christmas skin's workshop wall: wooden planks and a shelf with snow on it. */
function drawWorkshopWall(ctx: CanvasRenderingContext2D, colors: Colors) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, 0, WIDTH, 40);
  ctx.fillStyle = colors.surface;
  const plank = WIDTH / 16;
  for (let i = 1; i < 16; i++) ctx.fillRect(i * plank, 0, 2, 30);
  ctx.fillRect(0, 30, WIDTH, 10);
  ctx.fillStyle = colors.stripeB;
  ctx.fillRect(0, 26, WIDTH, 5);
  for (let x = plank / 4; x < WIDTH; x += plank / 2) disc(ctx, x, 27, 4);
}

/** A small burst of snow: flakes flying outwards from the hit. */
function drawSnowBurst(ctx: CanvasRenderingContext2D, splash: Splash) {
  const spread = 6 + splash.age * 90;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    disc(ctx, splash.x + Math.cos(angle) * spread, splash.y + Math.sin(angle) * spread, 3);
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  state: WaterCannonState,
  aim: { x: number; y: number },
  place: number | undefined,
) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (skin === 'christmas') drawWorkshopWall(ctx, colors);
  else drawAwning(ctx, colors);

  for (const rail of RAILS) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(0, rail.y + rail.radius + 4, WIDTH, 6);
  }

  for (const target of state.targets) {
    if (skin === 'christmas') drawToy(ctx, colors, target);
    else drawRoundTarget(ctx, colors, target);
  }

  // Snowballs on the Christmas skin, water drops otherwise.
  ctx.fillStyle = skin === 'christmas' ? colors.stripeB : colors.water;
  for (const shot of state.shots) disc(ctx, shot.x, shot.y, 5);

  ctx.strokeStyle = colors.water;
  ctx.fillStyle = colors.stripeB;
  ctx.lineWidth = 3;
  for (const splash of state.splashes) {
    ctx.globalAlpha = 1 - splash.age / 0.4;
    if (skin === 'christmas') {
      drawSnowBurst(ctx, splash);
    } else {
      ctx.beginPath();
      ctx.arc(splash.x, splash.y, 10 + splash.age * 90, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Cannon, pointing at the aim.
  const angle = Math.atan2(Math.min(aim.y - CANNON.y, -1), aim.x - CANNON.x);
  ctx.save();
  ctx.translate(CANNON.x, CANNON.y);
  ctx.rotate(angle);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(0, -8, 46, 16);
  ctx.restore();
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.arc(CANNON.x, CANNON.y, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`${labels.ammo} ${state.tank}/${TANK_SIZE}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(labels.gameOver(state.score), WIDTH / 2, HEIGHT / 2);
    if (place !== undefined) {
      ctx.fillStyle = colors.text;
      ctx.font = canvasFont('body', 'bold');
      ctx.fillText(placeText(place), WIDTH / 2, HEIGHT / 2 + 40);
    }
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click or press Space to play again', WIDTH / 2, HEIGHT / 2 + 76);
  }
}

export const waterCannon: CarnivalGame = {
  id: 'water-cannon',
  name: labels.name,
  description: labels.description,

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    let place: number | undefined;
    const aim = { x: WIDTH / 2, y: 0 };

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => Object.assign(aim, toCanvas(event));
    const onPress = () => {
      const next = press(state, aim.x, aim.y);
      if (next !== state) {
        state = next;
        scoreRecorded = false;
        place = undefined;
      }
    };
    const onDown = (event: PointerEvent) => {
      Object.assign(aim, toCanvas(event));
      onPress();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.ctrlKey || event.altKey || event.metaKey) return;
      // Leave Space alone when a link or other control on the page has focus.
      const target = event.target;
      if (target instanceof Element && target.closest('a, button, input, select, textarea')) return;
      // Keep Space from scrolling the page, and fire once per press.
      event.preventDefault();
      if (!event.repeat) onPress();
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        const entry = recordScore(waterCannon.id, state.score);
        place = rankOf(waterCannon.id, entry.score);
        scoreRecorded = true;
      }
      draw(ctx, state, aim, place);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  },
};

export default waterCannon;
