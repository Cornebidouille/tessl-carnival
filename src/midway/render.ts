import { canvasFont, currentSkin, theme } from '../carnival';
import bannerUrl from './aidevcon-banner.png';
import { palette, type DayLook } from './palette';
import type { SnowmanParts } from './weather';
import {
  CART_KINDS,
  toScreen,
  type BoothSlot,
  type MidwayMap,
  type Point,
  type Prop,
  type Rect,
  type Walker,
} from './world';

/**
 * Flat, isometric vector drawing for the midway, in world pixels. The caller
 * sets up the canvas transform for the camera and zoom.
 */

type Ctx = CanvasRenderingContext2D;
type Pt = readonly [number, number];

/** A tile position, `z` pixels above the ground, in world pixels. */
function at(x: number, y: number, z = 0): Pt {
  const s = toScreen(x, y);
  return [s.x, s.y - z];
}

/** Under the Christmas skin, the midway's buildings become Santa's workshop. */
const NORTH_POLE = currentSkin() === 'christmas';

/** Screen size of a one-tile radius circle lying on the ground. */
const ISO_RX = 16 * Math.SQRT2;
const ISO_RY = 8 * Math.SQRT2;

function poly(ctx: Ctx, points: readonly Pt[], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function oval(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function stroke(ctx: Ctx, points: readonly Pt[], color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

const lerp = (a: number, b: number, s: number) => a + (b - a) * s;

/** A tile-aligned box, `z` pixels off the ground and `h` pixels tall. */
function box(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  h: number,
  top: string,
  left: string,
  right: string,
) {
  if (h > 0) {
    poly(
      ctx,
      [at(x, y + d, z), at(x + w, y + d, z), at(x + w, y + d, z + h), at(x, y + d, z + h)],
      left,
    );
    poly(
      ctx,
      [at(x + w, y + d, z), at(x + w, y, z), at(x + w, y, z + h), at(x + w, y + d, z + h)],
      right,
    );
  }
  poly(
    ctx,
    [at(x, y, z + h), at(x + w, y, z + h), at(x + w, y + d, z + h), at(x, y + d, z + h)],
    top,
  );
}

/** A vertical wall from one ground point to another, in alternating colour strips. */
function stripedWall(
  ctx: Ctx,
  a: Point,
  b: Point,
  z: number,
  h: number,
  strips: number,
  colors: readonly string[],
) {
  for (let i = 0; i < strips; i++) {
    const s0 = i / strips;
    const s1 = (i + 1) / strips;
    const x0 = lerp(a.x, b.x, s0);
    const y0 = lerp(a.y, b.y, s0);
    const x1 = lerp(a.x, b.x, s1);
    const y1 = lerp(a.y, b.y, s1);
    poly(
      ctx,
      [at(x0, y0, z), at(x1, y1, z), at(x1, y1, z + h), at(x0, y0, z + h)],
      colors[i % colors.length],
    );
  }
}

/** A scalloped trim hanging from an edge. */
function scallops(
  ctx: Ctx,
  a: Point,
  b: Point,
  z: number,
  count: number,
  depth: number,
  colors: readonly string[],
) {
  for (let i = 0; i < count; i++) {
    const p0 = at(lerp(a.x, b.x, i / count), lerp(a.y, b.y, i / count), z);
    const p1 = at(lerp(a.x, b.x, (i + 1) / count), lerp(a.y, b.y, (i + 1) / count), z);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + depth * 2, p1[0], p1[1]);
    ctx.closePath();
    ctx.fill();
  }
}

/** Little triangular flags hanging along a line of screen points. */
function flags(ctx: Ctx, points: readonly Pt[], t: number, size = 5, phase = 0) {
  let n = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const flutter = Math.sin(t * 4 + i * 0.9 + phase) * 1.2;
    ctx.fillStyle = palette.bunting[n++ % palette.bunting.length];
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo((x0 + x1) / 2 + flutter, (y0 + y1) / 2 + size * 1.4);
    ctx.closePath();
    ctx.fill();
  }
}

function flag(ctx: Ctx, x: number, y: number, t: number, color: string, size = 1) {
  stroke(
    ctx,
    [
      [x, y],
      [x, y - 14 * size],
    ],
    palette.metalShade,
    1.2,
  );
  const wave = Math.sin(t * 5 + x * 0.1) * 1.5 * size;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 14 * size);
  ctx.quadraticCurveTo(x + 6 * size, y - 16 * size + wave, x + 12 * size, y - 14 * size);
  ctx.lineTo(x + 9 * size, y - 11 * size + wave * 0.5);
  ctx.lineTo(x + 12 * size, y - 8 * size);
  ctx.quadraticCurveTo(x + 6 * size, y - 10 * size + wave, x, y - 8 * size);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws on a vertical plane facing down-left (parallel to the x axis), so
 * signs and wheels sit in the scene. Local x runs along the plane, local y down.
 */
function onPlane(ctx: Ctx, origin: Pt, paint: () => void) {
  ctx.save();
  ctx.transform(0.894, 0.447, 0, 1, origin[0], origin[1]);
  paint();
  ctx.restore();
}

/** A wooden sign with text, in plane-local coordinates centred on (0, 0). */
function signBoard(
  ctx: Ctx,
  text: string,
  width: number,
  height: number,
  colors: { board: string; edge: string; text: string },
  glow = false,
) {
  ctx.fillStyle = colors.edge;
  ctx.beginPath();
  ctx.roundRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 4);
  ctx.fill();
  ctx.fillStyle = colors.board;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, 3);
  ctx.fill();
  if (glow) {
    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.font = canvasFont('small', 'bold');
  const fit = Math.min(
    (height * 0.62) / theme.font.small,
    (width - 8) / ctx.measureText(text).width,
  );
  ctx.save();
  ctx.scale(fit, fit);
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

// ── Ground ────────────────────────────────────────────────────────────────

/** The world-pixel height of the horizon; the field runs off to it. */
export const HORIZON = -24;

function hash(x: number, y: number, salt = 0): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function rectPoints(r: Rect, lift = 0): Pt[] {
  return [
    at(r.x, r.y, lift),
    at(r.x + r.w, r.y, lift),
    at(r.x + r.w, r.y + r.h, lift),
    at(r.x, r.y + r.h, lift),
  ];
}

/** The world-pixel box the pre-drawn ground layer covers. */
export function groundBounds(map: MidwayMap): Box {
  return {
    left: -map.height * 16 - 64,
    right: map.width * 16 + 64,
    top: -64,
    bottom: (map.width + map.height) * 8 + 4,
  };
}

/** The open field round the midway, filling the view from the horizon down. */
export function drawField(ctx: Ctx, view: Box, look: DayLook) {
  ctx.fillStyle = look.haze;
  ctx.fillRect(view.left, HORIZON, view.right - view.left, 6);
  ctx.fillStyle = palette.grass;
  ctx.fillRect(view.left, HORIZON + 6, view.right - view.left, Math.max(0, view.bottom - HORIZON));
}

/**
 * The most pixels the ground layer may use. Safari refuses canvases over
 * 16,777,216 pixels, and a long midway on a sharp screen would pass that.
 */
const MAX_GROUND_PIXELS = 16_000_000;

export interface GroundLayer {
  canvas: HTMLCanvasElement;
  /** Device pixels per world pixel the layer was drawn at. */
  scale: number;
}

/**
 * Draws the parts of the ground that never change (the grass, paths, trees
 * and the hedge's back two sides) once, onto an off-screen canvas covering
 * groundBounds(map). It uses `scale` device pixels per world pixel, or less
 * when that would make the canvas too big, so its size stays bounded however
 * long the midway grows.
 */
export function drawGroundLayer(map: MidwayMap, wanted: number): GroundLayer {
  const bounds = groundBounds(map);
  const area = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
  const scale = Math.min(wanted, Math.sqrt(MAX_GROUND_PIXELS / area));
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((bounds.right - bounds.left) * scale);
  canvas.height = Math.ceil((bounds.bottom - bounds.top) * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, -bounds.left * scale, -bounds.top * scale);

  // Lighter plots of grass inside the hedge, raised a little above the paths.
  poly(ctx, rectPoints({ x: 0, y: 0, w: map.width, h: map.height }), palette.grassLight);
  for (const path of map.paths) poly(ctx, rectPoints(path, 3), palette.grassEdge);
  for (const path of map.paths) poly(ctx, rectPoints(path), palette.path);

  // Tufts of grass.
  ctx.strokeStyle = palette.grassDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.ground[y * map.width + x] !== 'grass' || hash(x, y) > 0.5) continue;
      const [px, py] = at(x + hash(x, y, 1), y + hash(x, y, 2));
      ctx.moveTo(px - 2, py - 2);
      ctx.lineTo(px, py);
      ctx.lineTo(px + 2, py - 3);
    }
  }
  ctx.stroke();

  // Trees out in the field behind the midway.
  for (let i = 0; i < map.width; i += 2) tree(ctx, i + 0.5 + hash(i, 1) * 0.6, -1.4 - hash(i, 2));
  for (let i = 2; i < map.height; i += 2) tree(ctx, -1.4 - hash(1, i), i + 0.5 + hash(2, i) * 0.6);

  hedge(ctx, { x: 0, y: 0, w: map.width, h: 1 });
  hedge(ctx, { x: 0, y: 0, w: 1, h: map.height });
  return { canvas, scale };
}

function tree(ctx: Ctx, x: number, y: number) {
  if (NORTH_POLE) return pine(ctx, x, y);
  const [px, py] = at(x, y);
  oval(ctx, px + 4, py + 1, 12, 5, palette.shadow);
  poly(
    ctx,
    [
      [px - 1.5, py],
      [px + 1.5, py],
      [px + 1.5, py - 12],
      [px - 1.5, py - 12],
    ],
    palette.woodDark,
  );
  oval(ctx, px, py - 20, 11, 11, palette.hedgeDark);
  oval(ctx, px - 2, py - 22, 9, 9, palette.hedge);
  oval(ctx, px - 4, py - 25, 4, 4, palette.hedgeLight);
}

/** Under the Christmas skin a field tree is a snow-topped pine. */
function pine(ctx: Ctx, x: number, y: number) {
  const [px, py] = at(x, y);
  oval(ctx, px + 4, py + 1, 10, 4, palette.shadow);
  poly(
    ctx,
    [
      [px - 1.5, py],
      [px + 1.5, py],
      [px + 1.5, py - 6],
      [px - 1.5, py - 6],
    ],
    palette.woodDark,
  );
  const tiers = [
    { y: py - 4, w: 11, h: 13 },
    { y: py - 12, w: 9, h: 12 },
    { y: py - 19, w: 6.5, h: 11 },
  ];
  for (const tier of tiers) {
    const top = tier.y - tier.h;
    poly(
      ctx,
      [
        [px, top],
        [px + tier.w, tier.y],
        [px - tier.w, tier.y],
      ],
      palette.hedgeDark,
    );
    poly(
      ctx,
      [
        [px, top],
        [px, tier.y],
        [px - tier.w, tier.y],
      ],
      palette.hedge,
    );
    // Snow lying on the tier's upper half.
    poly(
      ctx,
      [
        [px, top],
        [px + tier.w * 0.5, top + tier.h * 0.5],
        [px, top + tier.h * 0.4],
        [px - tier.w * 0.5, top + tier.h * 0.5],
      ],
      palette.snow,
    );
  }
}

function hedge(ctx: Ctx, area: Rect) {
  box(
    ctx,
    area.x + 0.15,
    area.y + 0.15,
    area.w - 0.3,
    area.h - 0.3,
    0,
    9,
    palette.hedgeLight,
    palette.hedge,
    palette.hedgeDark,
  );
}

/** The hedge's front two sides, which can stand in front of anything. */
export function drawFrontHedge(ctx: Ctx, map: MidwayMap) {
  const h = map.height - 1;
  hedge(ctx, { x: map.width - 1, y: 1, w: 1, h: map.height - 1 });
  hedge(ctx, { x: 1, y: h, w: map.avenueX - 1, h: 1 });
  hedge(ctx, { x: map.avenueX + 2, y: h, w: map.width - map.avenueX - 3, h: 1 });
}

// ── Round things: tents, the big top, the carousel ────────────────────────

interface Stripes {
  a: string;
  aShade: string;
  b: string;
  bShade: string;
}

const RED: Stripes = {
  a: palette.red,
  aShade: palette.redShade,
  b: palette.cream,
  bShade: palette.creamShade,
};
const GOLD: Stripes = {
  a: palette.gold,
  aShade: palette.goldShade,
  b: palette.cream,
  bShade: palette.creamShade,
};
const BLUE: Stripes = {
  a: palette.blue,
  aShade: palette.blueShade,
  b: palette.cream,
  bShade: palette.creamShade,
};
const TENT_COLORS = [GOLD, BLUE, BLUE, RED] as const;

const CANDY: Stripes = {
  a: palette.red,
  aShade: palette.redShade,
  b: palette.snow,
  bShade: palette.snowShade,
};
const PINE: Stripes = {
  a: palette.hedge,
  aShade: palette.hedgeDark,
  b: palette.hedgeLight,
  bShade: palette.hedge,
};

function rimPoint(c: Pt, r: number, angle: number, z: number): Pt {
  return [c[0] + Math.cos(angle) * r * ISO_RX, c[1] + Math.sin(angle) * r * ISO_RY - z];
}

/** The front half of a striped cylinder. */
function cylinder(ctx: Ctx, c: Pt, r: number, z: number, h: number, colors: Stripes, count = 16) {
  for (let k = 0; k < count; k++) {
    const a0 = Math.max(0, (k / count) * Math.PI * 2);
    const a1 = Math.min(Math.PI, ((k + 1) / count) * Math.PI * 2);
    if (a1 <= a0) continue;
    const points: Pt[] = [];
    for (let i = 0; i <= 4; i++) points.push(rimPoint(c, r, lerp(a0, a1, i / 4), z));
    for (let i = 4; i >= 0; i--) points.push(rimPoint(c, r, lerp(a0, a1, i / 4), z + h));
    const shade = (a0 + a1) / 2 < Math.PI * 0.35;
    poly(
      ctx,
      points,
      k % 2 === 0 ? (shade ? colors.aShade : colors.a) : shade ? colors.bShade : colors.b,
    );
  }
}

/** A striped, slightly domed cone roof. `turn` spins the stripes. */
function dome(
  ctx: Ctx,
  c: Pt,
  r: number,
  z: number,
  h: number,
  colors: Stripes,
  turn = 0,
  count = 16,
) {
  const apex: Pt = [c[0], c[1] - z - h];
  const wedges = Array.from({ length: count }, (_, k) => {
    const a0 = turn + (k / count) * Math.PI * 2;
    const a1 = turn + ((k + 1) / count) * Math.PI * 2;
    return { k, a0, a1, mid: (a0 + a1) / 2 };
  }).sort((p, q) => Math.sin(p.mid) - Math.sin(q.mid));
  for (const { k, a0, a1, mid } of wedges) {
    const control = (angle: number) => rimPoint(c, r * 0.92, angle, z + h * 0.6);
    const start = rimPoint(c, r, a0, z);
    const end = rimPoint(c, r, a1, z);
    const c0 = control(a0);
    const c1 = control(a1);
    ctx.beginPath();
    ctx.moveTo(apex[0], apex[1]);
    ctx.quadraticCurveTo(c0[0], c0[1], start[0], start[1]);
    for (let i = 1; i <= 3; i++) {
      const p = rimPoint(c, r, lerp(a0, a1, i / 3), z);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.lineTo(end[0], end[1]);
    ctx.quadraticCurveTo(c1[0], c1[1], apex[0], apex[1]);
    const shade = Math.cos(mid) > 0.45;
    ctx.fillStyle =
      k % 2 === 0 ? (shade ? colors.aShade : colors.a) : shade ? colors.bShade : colors.b;
    ctx.fill();
  }
}

/** Scallops round the front of a circle. */
function scallopRing(
  ctx: Ctx,
  c: Pt,
  r: number,
  z: number,
  count: number,
  depth: number,
  colors: readonly string[],
) {
  for (let k = 0; k < count; k++) {
    const a0 = (k / count) * Math.PI;
    const a1 = ((k + 1) / count) * Math.PI;
    const p0 = rimPoint(c, r, a0, z);
    const p1 = rimPoint(c, r, a1, z);
    const m = rimPoint(c, r * 1.02, (a0 + a1) / 2, z - depth * 2);
    ctx.fillStyle = colors[k % colors.length];
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.quadraticCurveTo(m[0], m[1], p1[0], p1[1]);
    ctx.closePath();
    ctx.fill();
  }
}

function ringFlags(ctx: Ctx, c: Pt, r: number, z: number, t: number, count = 14) {
  const points: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const angle = 0.08 + (i / count) * (Math.PI - 0.16);
    points.push(rimPoint(c, r, angle, z));
  }
  flags(ctx, points, t, 3.5);
}

function knob(ctx: Ctx, x: number, y: number) {
  oval(ctx, x, y, 3, 3, palette.gold);
  oval(ctx, x - 1, y - 1, 1.2, 1.2, palette.cream);
}

function roundTent(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  wall: number,
  roof: number,
  colors: Stripes,
  t: number,
  flagColor: string = palette.gold,
) {
  const c = at(cx, cy);
  oval(ctx, c[0] + 8, c[1] + 4, r * ISO_RX * 1.15, r * ISO_RY * 1.15, palette.shadow);
  cylinder(ctx, c, r, 0, wall, colors);
  // The door, with its curtains tied back.
  const door: Pt[] = [];
  for (let i = 0; i <= 6; i++)
    door.push(rimPoint(c, r, lerp(Math.PI / 2 - 0.24, Math.PI / 2 + 0.24, i / 6), 0));
  const top = rimPoint(c, r, Math.PI / 2, wall * 0.85);
  poly(
    ctx,
    [...door, [door[6][0], top[1] + 6], [top[0], top[1]], [door[0][0], top[1] + 6]],
    palette.opening,
  );
  stroke(ctx, [door[0], [door[0][0] + 2, top[1] + 8], [top[0], top[1]]], palette.gold, 2);
  stroke(ctx, [door[6], [door[6][0] - 2, top[1] + 8], [top[0], top[1]]], palette.gold, 2);

  scallopRing(ctx, c, r * 1.02, wall, 10, 3, [colors.a, colors.b]);
  dome(ctx, c, r * 1.12, wall, roof, colors);
  scallopRing(ctx, c, r * 1.12, wall, 12, 4, [colors.a, colors.b]);
  ringFlags(ctx, c, r * 1.05, wall + 2, t);
  const apex = c[1] - wall - roof;
  knob(ctx, c[0], apex);
  flag(ctx, c[0], apex - 2, t, flagColor);
}

function bigTop(ctx: Ctx, prop: Prop, t: number) {
  const cx = prop.x + prop.w / 2;
  const cy = prop.y + prop.h / 2;
  roundTent(ctx, cx, cy, 1.9, 38, 46, RED, t, palette.red);
  const c = at(cx, cy);
  // A second ring of bunting, and gold lights round the wall.
  ringFlags(ctx, c, 1.5, 38 + 22, t, 12);
  for (let i = 0; i < 9; i++) {
    const angle = 0.2 + (i / 8) * (Math.PI - 0.4);
    const p = rimPoint(c, 1.92, angle, 10);
    oval(ctx, p[0], p[1], 1.4, 1.4, Math.sin(t * 4 + i) > 0 ? palette.gold : palette.cream);
  }
}

function carousel(ctx: Ctx, prop: Prop, t: number) {
  const cx = prop.x + prop.w / 2;
  const cy = prop.y + prop.h / 2;
  const c = at(cx, cy);
  const turn = t * 0.5;
  const r = 1.75;
  oval(ctx, c[0] + 8, c[1] + 4, r * ISO_RX * 1.1, r * ISO_RY * 1.1, palette.shadow);
  cylinder(ctx, c, r, 0, 6, RED, 24);
  oval(ctx, c[0], c[1] - 6, r * ISO_RX, r * ISO_RY, palette.pink);
  oval(ctx, c[0], c[1] - 6, r * ISO_RX * 0.82, r * ISO_RY * 0.82, palette.pinkShade);

  const roofZ = 46;
  const horses = Array.from({ length: 8 }, (_, i) => {
    const angle = turn + (i / 8) * Math.PI * 2;
    return { i, angle, base: rimPoint(c, r * 0.72, angle, 6) };
  });
  const drawHorse = ({ i, angle, base }: (typeof horses)[number]) => {
    const bob = Math.sin(t * 3 + i * 1.4) * 3;
    const [x, y] = base;
    stroke(
      ctx,
      [
        [x, y],
        [x, y - (roofZ - 6) + (Math.sin(angle) * r * ISO_RY) / 4],
      ],
      palette.gold,
      1.4,
    );
    const facing = Math.cos(angle + Math.PI / 2) < 0 ? -1 : 1;
    const color = i % 2 ? palette.cream : palette.woodLight;
    const hy = y - 16 + bob;
    oval(ctx, x, hy, 6, 3.2, color);
    poly(
      ctx,
      [
        [x + facing * 4, hy - 1],
        [x + facing * 7, hy - 7],
        [x + facing * 9, hy - 6],
        [x + facing * 6, hy + 1],
      ],
      color,
    );
    stroke(
      ctx,
      [
        [x - 4, hy + 2],
        [x - 5, hy + 7],
      ],
      color,
      1.4,
    );
    stroke(
      ctx,
      [
        [x + 4, hy + 2],
        [x + 5, hy + 7],
      ],
      color,
      1.4,
    );
    poly(
      ctx,
      [
        [x - 2, hy - 3],
        [x + 2, hy - 3],
        [x + 1, hy - 1],
        [x - 1, hy - 1],
      ],
      palette.red,
    );
  };
  horses.filter((h) => Math.sin(h.angle) < 0).forEach(drawHorse);
  const column = rimPoint(c, 0, 0, 6);
  poly(
    ctx,
    [
      [column[0] - 5, column[1]],
      [column[0] + 5, column[1]],
      [column[0] + 5, c[1] - roofZ],
      [column[0] - 5, c[1] - roofZ],
    ],
    palette.gold,
  );
  poly(
    ctx,
    [
      [column[0] - 2, column[1]],
      [column[0] + 2, column[1]],
      [column[0] + 2, c[1] - roofZ],
      [column[0] - 2, c[1] - roofZ],
    ],
    palette.red,
  );
  horses.filter((h) => Math.sin(h.angle) >= 0).forEach(drawHorse);

  dome(ctx, c, r * 1.15, roofZ, 26, RED, turn);
  scallopRing(ctx, c, r * 1.15, roofZ, 14, 4, [palette.red, palette.cream]);
  ringFlags(ctx, c, r * 1.05, roofZ - 6, t, 16);
  knob(ctx, c[0], c[1] - roofZ - 26);
  flag(ctx, c[0], c[1] - roofZ - 28, t, palette.gold);
}

// ── The North Pole: Santa's workshop, gingerbread houses, the big tree ────

/** A five-pointed star centred on (x, y). */
function star(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const points: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const reach = i % 2 ? r * 0.45 : r;
    points.push([x + Math.cos(angle) * reach, y + Math.sin(angle) * reach]);
  }
  poly(ctx, points, color);
}

/** Under the Christmas skin the carousel is a big Christmas tree, turning slowly. */
function christmasTree(ctx: Ctx, prop: Prop, t: number) {
  const c = at(prop.x + prop.w / 2, prop.y + prop.h / 2);
  const turn = t * 0.5;
  const r = 1.75;
  oval(ctx, c[0] + 8, c[1] + 4, r * ISO_RX * 1.1, r * ISO_RY * 1.1, palette.shadow);
  cylinder(ctx, c, r, 0, 6, CANDY, 24);
  oval(ctx, c[0], c[1] - 6, r * ISO_RX, r * ISO_RY, palette.snow);
  poly(
    ctx,
    [
      [c[0] - 4, c[1] - 6],
      [c[0] + 4, c[1] - 6],
      [c[0] + 4, c[1] - 16],
      [c[0] - 4, c[1] - 16],
    ],
    palette.woodDark,
  );
  const tiers = [
    { r: 1.55, z: 12, h: 24 },
    { r: 1.2, z: 28, h: 22 },
    { r: 0.85, z: 44, h: 20 },
    { r: 0.5, z: 58, h: 18 },
  ];
  tiers.forEach((tier, n) => {
    dome(ctx, c, tier.r, tier.z, tier.h, PINE, turn + n * 0.4, 12);
    // Baubles round the front of each tier, turning with the tree.
    for (let k = 0; k < 6; k++) {
      const angle = turn + n * 0.7 + (k / 6) * Math.PI * 2;
      if (Math.sin(angle) <= 0) continue;
      const [bx, by] = rimPoint(c, tier.r * 0.92, angle, tier.z);
      oval(ctx, bx, by + 1.5, 2.2, 2.2, palette.balloons[(k + n) % palette.balloons.length]);
      oval(ctx, bx - 0.7, by + 0.8, 0.7, 0.7, palette.white);
    }
  });
  const top = c[1] - 58 - 18;
  star(ctx, c[0], top - 3, 7 + Math.sin(t * 3) * 0.6, palette.gold);
  oval(ctx, c[0], top - 3, 1.6, 1.6, palette.cream);
}

interface HouseColors {
  wall: string;
  wallShade: string;
  roof: string;
  roofShade: string;
  /** The window frames and the trim hanging from the eave. */
  trim: string;
}

/**
 * A house with a gabled roof running along the x axis, snow along the ridge,
 * a door on the gable end and a row of lit windows along the front.
 */
function house(
  ctx: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  wall: number,
  roof: number,
  windows: number,
  colors: HouseColors,
) {
  const ym = (y0 + y1) / 2;
  const eave = 0.18;
  poly(ctx, rectPoints({ x: x0 + 0.3, y: y0 + 0.3, w: x1 - x0, h: y1 - y0 }), palette.shadow);
  // The back of the roof, mostly hidden behind the front.
  poly(
    ctx,
    [
      at(x0 - 0.1, y0 - eave, wall - 3),
      at(x1 + 0.1, y0 - eave, wall - 3),
      at(x1 + 0.1, ym, wall + roof),
      at(x0 - 0.1, ym, wall + roof),
    ],
    colors.roofShade,
  );
  box(ctx, x0, y0, x1 - x0, y1 - y0, 0, wall, colors.wall, colors.wall, colors.wallShade);
  poly(ctx, [at(x1, y1, wall), at(x1, y0, wall), at(x1, ym, wall + roof)], colors.wallShade);

  // The door on the gable end, and a round window above it.
  poly(
    ctx,
    [
      at(x1, ym + 0.3, 0),
      at(x1, ym - 0.3, 0),
      at(x1, ym - 0.3, wall * 0.65),
      at(x1, ym + 0.3, wall * 0.65),
    ],
    colors.trim,
  );
  poly(
    ctx,
    [
      at(x1, ym + 0.24, 0),
      at(x1, ym - 0.24, 0),
      at(x1, ym - 0.24, wall * 0.6),
      at(x1, ym + 0.24, wall * 0.6),
    ],
    palette.woodDark,
  );
  const round = at(x1, ym, wall + roof * 0.35);
  oval(ctx, round[0], round[1], 4.5, 5, colors.trim);
  oval(ctx, round[0], round[1], 3.2, 3.7, palette.glow);

  // Lit windows along the front.
  const za = wall * 0.35;
  const zb = wall * 0.75;
  for (let i = 0; i < windows; i++) {
    const xa = lerp(x0, x1, (i + 0.25) / windows);
    const xb = lerp(x0, x1, (i + 0.75) / windows);
    poly(
      ctx,
      [
        at(xa - 0.05, y1, za - 2),
        at(xb + 0.05, y1, za - 2),
        at(xb + 0.05, y1, zb + 2),
        at(xa - 0.05, y1, zb + 2),
      ],
      colors.trim,
    );
    poly(ctx, [at(xa, y1, za), at(xb, y1, za), at(xb, y1, zb), at(xa, y1, zb)], palette.glow);
    const xm = (xa + xb) / 2;
    stroke(ctx, [at(xm, y1, za), at(xm, y1, zb)], colors.trim, 1);
    stroke(ctx, [at(xa, y1, (za + zb) / 2), at(xb, y1, (za + zb) / 2)], colors.trim, 1);
  }

  // The front of the roof, its gable edge, and snow along the ridge.
  poly(
    ctx,
    [
      at(x0 - 0.1, y1 + eave, wall - 3),
      at(x1 + 0.1, y1 + eave, wall - 3),
      at(x1 + 0.1, ym, wall + roof),
      at(x0 - 0.1, ym, wall + roof),
    ],
    colors.roof,
  );
  poly(
    ctx,
    [
      at(x1 + 0.1, y1 + eave, wall - 3),
      at(x1 + 0.1, ym, wall + roof),
      at(x1 + 0.1, ym, wall + roof - 2),
      at(x1 + 0.1, y1 + eave, wall - 5),
    ],
    colors.roofShade,
  );
  const ys = lerp(ym, y1 + eave, 0.45);
  const zs = lerp(wall + roof, wall - 3, 0.45);
  const drift: Pt[] = [];
  for (let i = 0; i <= 10; i++)
    drift.push(at(lerp(x1 + 0.1, x0 - 0.1, i / 10), ys, zs + (i % 2 ? 2 : -1)));
  poly(
    ctx,
    [at(x0 - 0.1, ym, wall + roof + 1.5), at(x1 + 0.1, ym, wall + roof + 1.5), ...drift],
    palette.snow,
  );
  scallops(ctx, { x: x0 - 0.1, y: y1 + eave }, { x: x1 + 0.1, y: y1 + eave }, wall - 3, 12, 2.5, [
    colors.trim,
  ]);
}

/** Under the Christmas skin the big top is Santa's workshop hall, smoke rising from its chimney. */
function workshopHall(ctx: Ctx, prop: Prop, t: number) {
  const x0 = prop.x + 0.3;
  const x1 = prop.x + prop.w - 0.3;
  const y0 = prop.y + 0.45;
  const y1 = prop.y + prop.h - 0.45;
  const ym = (y0 + y1) / 2;
  const wall = 34;
  const roof = 30;
  house(ctx, x0, y0, x1, y1, wall, roof, 4, {
    wall: palette.wood,
    wallShade: palette.woodDark,
    roof: palette.red,
    roofShade: palette.redShade,
    trim: palette.snow,
  });
  // A stone chimney on the front of the roof, capped with snow.
  const cx = x0 + 0.5;
  box(
    ctx,
    cx,
    ym + 0.1,
    0.4,
    0.35,
    wall + roof * 0.6,
    roof * 0.4 + 12,
    palette.snow,
    palette.creamShade,
    palette.metalShade,
  );
  const [sx, sy] = at(cx + 0.2, ym + 0.27, wall + roof + 14);
  ctx.save();
  const fade = ctx.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const rise = (t * 0.4 + i / 3) % 1;
    ctx.globalAlpha = fade * (1 - rise);
    oval(ctx, sx + rise * 8, sy - rise * 24, 2 + rise * 4, 2 + rise * 4, palette.cloudShade);
  }
  ctx.restore();
}

/** Under the Christmas skin a round tent is a gingerbread house with icing trim. */
function gingerbreadHouse(ctx: Ctx, prop: Prop) {
  const cx = prop.x + prop.w / 2;
  const cy = prop.y + prop.h / 2;
  const x0 = cx - 1.3;
  const x1 = cx + 1.3;
  const y1 = cy + 1;
  house(ctx, x0, cy - 1, x1, y1, 26, 30, 2, {
    wall: palette.gingerbread,
    wallShade: palette.gingerbreadShade,
    roof: palette.gingerbread,
    roofShade: palette.gingerbreadShade,
    trim: palette.snow,
  });
  // Gumdrops along the front wall.
  for (let i = 0; i < 5; i++) {
    const [gx, gy] = at(lerp(x0 + 0.2, x1 - 0.2, i / 4), y1, 3);
    oval(ctx, gx, gy, 2.4, 2, palette.balloons[(i + prop.variant) % palette.balloons.length]);
  }
}

// ── Square things ─────────────────────────────────────────────────────────

/** A tent with a ridged roof running along the x axis. */
function peakedTent(ctx: Ctx, prop: Prop, t: number) {
  const colors = NORTH_POLE ? CANDY : prop.variant % 2 === 0 ? BLUE : RED;
  const x0 = prop.x + 0.2;
  const x1 = prop.x + prop.w - 0.2;
  const y0 = prop.y + 0.25;
  const y1 = prop.y + prop.h - 0.25;
  const ym = (y0 + y1) / 2;
  const wall = 24;
  const roof = 26;
  const eave = 0.18;

  poly(ctx, rectPoints({ x: x0 + 0.3, y: y0 + 0.3, w: x1 - x0, h: y1 - y0 }), palette.shadow);
  // The back of the roof, mostly hidden behind the front.
  poly(
    ctx,
    [
      at(x0 - 0.1, y0 - eave, wall - 3),
      at(x1 + 0.1, y0 - eave, wall - 3),
      at(x1 + 0.1, ym, wall + roof),
      at(x0 - 0.1, ym, wall + roof),
    ],
    colors.aShade,
  );

  // The gable end, striped up to the roof line.
  const strips = 10;
  const half = (y1 - y0) / 2;
  const height = (y: number) => wall + roof * (1 - Math.abs(y - ym) / half);
  for (let i = 0; i < strips; i++) {
    const ya = lerp(y1, y0, i / strips);
    const yb = lerp(y1, y0, (i + 1) / strips);
    const points: Pt[] = [at(x1, ya, 0), at(x1, yb, 0), at(x1, yb, height(yb))];
    if ((ya - ym) * (yb - ym) < 0) points.push(at(x1, ym, height(ym)));
    points.push(at(x1, ya, height(ya)));
    poly(ctx, points, i % 2 === 0 ? colors.aShade : colors.bShade);
  }
  stripedWall(ctx, { x: x0, y: y1 }, { x: x1, y: y1 }, 0, wall, 14, [colors.a, colors.b]);
  // The entrance, on the gable end.
  const door = [
    at(x1, ym + 0.35, 0),
    at(x1, ym - 0.35, 0),
    at(x1, ym - 0.2, wall * 0.8),
    at(x1, ym, wall * 0.95),
    at(x1, ym + 0.2, wall * 0.8),
  ];
  poly(ctx, door, palette.opening);
  stroke(ctx, [door[0], door[4], door[3]], palette.gold, 1.6);
  stroke(ctx, [door[1], door[2], door[3]], palette.gold, 1.6);

  // The front of the roof.
  const roofStrips = 12;
  for (let i = 0; i < roofStrips; i++) {
    const xa = lerp(x0 - 0.1, x1 + 0.1, i / roofStrips);
    const xb = lerp(x0 - 0.1, x1 + 0.1, (i + 1) / roofStrips);
    poly(
      ctx,
      [
        at(xa, y1 + eave, wall - 3),
        at(xb, y1 + eave, wall - 3),
        at(xb, ym, wall + roof),
        at(xa, ym, wall + roof),
      ],
      i % 2 === 0 ? colors.a : colors.b,
    );
  }
  poly(
    ctx,
    [
      at(x1 + 0.1, y1 + eave, wall - 3),
      at(x1 + 0.1, ym, wall + roof),
      at(x1 + 0.1, ym, wall + roof - 2),
      at(x1 + 0.1, y1 + eave, wall - 5),
    ],
    colors.aShade,
  );
  scallops(ctx, { x: x0 - 0.1, y: y1 + eave }, { x: x1 + 0.1, y: y1 + eave }, wall - 3, 12, 3, [
    colors.a,
    colors.b,
  ]);
  const eaveLine: Pt[] = [];
  for (let i = 0; i <= 16; i++) eaveLine.push(at(lerp(x0, x1, i / 16), y1 + eave, wall - 7));
  flags(ctx, eaveLine, t, 3.5, prop.x);
  const ridgeFront = at(x1 + 0.1, ym, wall + roof);
  const ridgeBack = at(x0 - 0.1, ym, wall + roof);
  flag(ctx, ridgeBack[0], ridgeBack[1], t, palette.gold);
  flag(ctx, ridgeFront[0], ridgeFront[1], t + 1, palette.red);
}

function wheel(ctx: Ctx, x: number, y: number, r: number) {
  oval(ctx, x, y, r, r, palette.woodDark);
  oval(ctx, x, y, r * 0.65, r * 0.65, palette.gold);
  oval(ctx, x, y, r * 0.25, r * 0.25, palette.woodDark);
}

/** A sled's runner along one side, from `x0` to `x1`, curling up at the front. */
function runner(ctx: Ctx, x0: number, x1: number, y: number, z: number) {
  for (const sx of [lerp(x0, x1, 0.25), lerp(x0, x1, 0.75)])
    stroke(ctx, [at(sx, y, z), at(sx, y, 1)], palette.woodDark, 1.6);
  stroke(
    ctx,
    [
      at(x0 - 0.05, y, 1),
      at(x1, y, 1),
      at(x1 + 0.12, y, 2.5),
      at(x1 + 0.15, y, 6),
      at(x1 + 0.08, y, 8),
    ],
    palette.gold,
    1.8,
  );
}

/** A present: a box with a ribbon round it and a bow on top, centred on (x, y). */
function present(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 1);
  ctx.fill();
  const ribbon = color === palette.gold ? palette.red : palette.gold;
  poly(
    ctx,
    [
      [x - 1, y - h / 2],
      [x + 1, y - h / 2],
      [x + 1, y + h / 2],
      [x - 1, y + h / 2],
    ],
    ribbon,
  );
  poly(
    ctx,
    [
      [x - w / 2, y - 1],
      [x + w / 2, y - 1],
      [x + w / 2, y + 1],
      [x - w / 2, y + 1],
    ],
    ribbon,
  );
  oval(ctx, x - 1.8, y - h / 2 - 1, 1.8, 1.2, ribbon);
  oval(ctx, x + 1.8, y - h / 2 - 1, 1.8, 1.2, ribbon);
}

/** The colours presents come in, round the midway. */
const PRESENTS = [palette.red, palette.hedgeLight, palette.blue, palette.gold, palette.cream];

/** Under the Christmas skin a wagon is a sled: a red body on runners, piled with presents. */
function sled(ctx: Ctx, prop: Prop) {
  const x = prop.x + 0.2;
  const y = prop.y + 0.1;
  const w = prop.w - 0.5;
  const d = prop.h - 0.25;
  const body =
    prop.variant % 2 === 0
      ? { left: palette.red, right: palette.redShade }
      : { left: palette.hedgeLight, right: palette.hedge };
  poly(ctx, rectPoints({ x: x + 0.3, y: y + 0.3, w, h: d }), palette.shadow);
  runner(ctx, x, x + w, y + 0.08, 7);
  box(ctx, x, y, w, d, 7, 10, body.left, body.left, body.right);
  // A tall curved back at the rear, and gold trim along the side.
  box(ctx, x, y, 0.3, d, 17, 12, body.left, body.left, body.right);
  poly(
    ctx,
    [at(x + 0.3, y + d, 15), at(x + w, y + d, 15), at(x + w, y + d, 17), at(x + 0.3, y + d, 17)],
    palette.gold,
  );
  // Presents piled on the seat.
  for (let i = 0; i < 3; i++) {
    const [px, py] = at(lerp(x + 0.7, x + w - 0.3, i / 2), y + d / 2, 17);
    const size = 9 - (i % 2) * 2;
    present(ctx, px, py - size / 2, size, size, PRESENTS[(i + prop.variant) % PRESENTS.length]);
  }
  runner(ctx, x, x + w, y + d + 0.02, 7);
}

function wagon(ctx: Ctx, prop: Prop) {
  const body =
    prop.variant % 2 === 0
      ? { top: palette.red, left: palette.red, right: palette.redShade }
      : { top: palette.blue, left: palette.blue, right: palette.blueShade };
  const x = prop.x + 0.1;
  const y = prop.y + 0.1;
  const w = prop.w - 0.2;
  const d = prop.h - 0.25;
  poly(ctx, rectPoints({ x: x + 0.3, y: y + 0.3, w, h: d }), palette.shadow);
  box(ctx, x, y, w, d, 7, 24, body.top, body.left, body.right);
  // Cage bars along the side.
  for (let i = 1; i < 14; i++) {
    const bx = lerp(x + 0.3, x + w - 0.3, i / 14);
    stroke(ctx, [at(bx, y + d, 11), at(bx, y + d, 27)], palette.cream, 1.4);
  }
  poly(
    ctx,
    [
      at(x + 0.25, y + d, 11),
      at(x + w - 0.25, y + d, 11),
      at(x + w - 0.25, y + d, 12.5),
      at(x + 0.25, y + d, 12.5),
    ],
    palette.gold,
  );
  box(
    ctx,
    x - 0.05,
    y - 0.05,
    w + 0.1,
    d + 0.1,
    31,
    3,
    palette.gold,
    palette.goldShade,
    palette.goldShade,
  );
  // A gold crest on the side, and the wheels.
  const crest = at(x + w / 2, y + d, 33);
  oval(ctx, crest[0], crest[1] - 2, 7, 4, palette.gold);
  for (const wx of [x + 0.45, x + w - 0.45]) {
    const p = at(wx, y + d + 0.02, 6);
    wheel(ctx, p[0], p[1], 6);
  }
}

function person(
  ctx: Ctx,
  x: number,
  y: number,
  look: Look,
  options: { swing?: number; back?: boolean; dir?: number; player?: boolean; t?: number } = {},
) {
  const swing = options.swing ?? 0;
  const dir = options.dir ?? 1;
  oval(ctx, x, y, 5, 2, palette.shadow);
  if (options.player) {
    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (ELVES) elf(ctx, x, y, look, swing, dir, options.back ?? false);
  else human(ctx, x, y, look, swing, dir, options.back ?? false);
  if (options.player) {
    // Under the Christmas skin the marker rides above the elf's hat.
    const hop = Math.sin((options.t ?? 0) * 5) * 1.5 - (ELVES ? 6 : 0);
    poly(
      ctx,
      [
        [x - 4, y - 34 + hop],
        [x + 4, y - 34 + hop],
        [x, y - 29 + hop],
      ],
      palette.gold,
    );
  }
}

/** Today's carnival visitor: shirt, trousers, hair and an optional cap. */
function human(
  ctx: Ctx,
  x: number,
  y: number,
  look: Look,
  swing: number,
  dir: number,
  back: boolean,
) {
  stroke(
    ctx,
    [
      [x - 1.6, y - 8],
      [x - 1.6 + swing * 1.6, y - 1],
    ],
    look.pants,
    2.6,
  );
  stroke(
    ctx,
    [
      [x + 1.6, y - 8],
      [x + 1.6 - swing * 1.6, y - 1],
    ],
    look.pants,
    2.6,
  );
  ctx.fillStyle = look.shirt;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 16.5, 8, 9.5, 3);
  ctx.fill();
  stroke(
    ctx,
    [
      [x - 4, y - 15],
      [x - 5 - swing, y - 9],
    ],
    look.skin,
    2,
  );
  stroke(
    ctx,
    [
      [x + 4, y - 15],
      [x + 5 + swing, y - 9],
    ],
    look.skin,
    2,
  );
  oval(ctx, x, y - 20.5, 4, 4, look.skin);
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  if (back) ctx.arc(x, y - 20.8, 4.2, 0, Math.PI * 2);
  else ctx.arc(x, y - 21, 4.2, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  if (!back) {
    oval(ctx, x - 1.5 + dir, y - 20.3, 0.6, 0.7, palette.ink);
    oval(ctx, x + 1.5 + dir, y - 20.3, 0.6, 0.7, palette.ink);
  }
  if (look.cap) {
    ctx.fillStyle = look.cap;
    ctx.beginPath();
    ctx.arc(x, y - 22, 4.4, Math.PI, Math.PI * 2);
    ctx.fill();
    if (!back)
      poly(
        ctx,
        [
          [x, y - 22.5],
          [x + dir * 7, y - 22.5],
          [x + dir * 7, y - 21.3],
          [x, y - 21.3],
        ],
        look.cap,
      );
  }
}

/** Under the Christmas skin, everyone on the midway is one of Santa's elves. */
const ELVES = currentSkin() === 'christmas';

/** A leg in a red-and-white striped stocking, ending in a small curled shoe. */
function stocking(ctx: Ctx, hip: Pt, foot: Pt, dir: number) {
  stroke(ctx, [hip, foot], palette.red, 2.6);
  for (const f of [0.2, 0.55]) {
    const a: Pt = [lerp(hip[0], foot[0], f), lerp(hip[1], foot[1], f)];
    const b: Pt = [lerp(hip[0], foot[0], f + 0.16), lerp(hip[1], foot[1], f + 0.16)];
    ctx.lineCap = 'butt';
    ctx.strokeStyle = palette.white;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  const [fx, fy] = foot;
  poly(
    ctx,
    [
      [fx - dir * 1.4, fy - 1.2],
      [fx + dir * 2.4, fy - 1],
      [fx + dir * 3.6, fy - 2.6],
      [fx + dir * 3, fy + 0.4],
      [fx - dir * 1.4, fy + 0.6],
    ],
    palette.elfShoe,
  );
}

/** One of Santa's elves, the same size and walk as a visitor. */
function elf(
  ctx: Ctx,
  x: number,
  y: number,
  look: Look,
  swing: number,
  dir: number,
  back: boolean,
) {
  stocking(ctx, [x - 1.6, y - 8], [x - 1.6 + swing * 1.6, y - 1], dir);
  stocking(ctx, [x + 1.6, y - 8], [x + 1.6 - swing * 1.6, y - 1], dir);
  // Sleeves in the tunic's colour, with a hand at the end.
  for (const side of [-1, 1]) {
    const hand: Pt = [x + side * (5 + swing), y - 9];
    stroke(ctx, [[x + side * 4, y - 15], hand], look.tunic, 2.2);
    oval(ctx, hand[0], hand[1], 1.1, 1.1, look.skin);
  }
  poly(
    ctx,
    [
      [x - 3.6, y - 16.5],
      [x + 3.6, y - 16.5],
      [x + 5, y - 7],
      [x - 5, y - 7],
    ],
    look.tunic,
  );
  poly(
    ctx,
    [
      [x - 4.4, y - 12],
      [x + 4.4, y - 12],
      [x + 4.6, y - 10.6],
      [x - 4.6, y - 10.6],
    ],
    palette.belt,
  );
  if (!back) oval(ctx, x, y - 11.3, 1, 0.8, palette.gold);
  // Pointed ears either side of the head.
  for (const side of [-1, 1]) {
    poly(
      ctx,
      [
        [x + side * 3, y - 22],
        [x + side * 7, y - 23.5],
        [x + side * 3.4, y - 19],
      ],
      look.skin,
    );
  }
  oval(ctx, x, y - 20.5, 4, 4, look.skin);
  if (back) {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(x, y - 20.8, 4.1, Math.PI * 0.1, Math.PI * 0.9, true);
    ctx.fill();
  } else {
    oval(ctx, x - 1.5 + dir, y - 20.3, 0.6, 0.7, palette.ink);
    oval(ctx, x + 1.5 + dir, y - 20.3, 0.6, 0.7, palette.ink);
  }
  // A tall pointy hat that flops over behind them, with a white bobble and brim.
  poly(
    ctx,
    [
      [x - 4.2, y - 23],
      [x + 4.2, y - 23],
      [x + 0.5 - dir * 0.5, y - 31],
      [x - dir * 5, y - 30.5],
      [x - dir * 1.5, y - 29],
    ],
    look.hat,
  );
  oval(ctx, x - dir * 5, y - 30.5, 1.5, 1.5, palette.white);
  oval(ctx, x, y - 23, 4.6, 1.5, palette.white);
}

/**
 * Santa, by the gate: bigger than an elf, in a red suit with white trim, a black
 * belt and a white beard, slowly waving one arm.
 */
function santa(ctx: Ctx, prop: Prop, t: number) {
  const [x, y] = at(prop.x + 0.5, prop.y + 0.5);
  oval(ctx, x, y, 8, 3, palette.shadow);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);
  // Black boots under the red trousers.
  for (const side of [-1, 1]) {
    stroke(
      ctx,
      [
        [side * 2, -8],
        [side * 2, -2],
      ],
      palette.red,
      3,
    );
    oval(ctx, side * 2.4, -1, 2.2, 1.2, palette.belt);
  }
  // The suit: a round red coat with a white hem and a white stripe down the front.
  ctx.fillStyle = palette.red;
  ctx.beginPath();
  ctx.roundRect(-5.5, -17.5, 11, 11.5, 4);
  ctx.fill();
  poly(
    ctx,
    [
      [-5.5, -7.5],
      [5.5, -7.5],
      [5.5, -6],
      [-5.5, -6],
    ],
    palette.white,
  );
  poly(
    ctx,
    [
      [-0.7, -17],
      [0.7, -17],
      [0.7, -7.5],
      [-0.7, -7.5],
    ],
    palette.white,
  );
  poly(
    ctx,
    [
      [-5.6, -12.5],
      [5.6, -12.5],
      [5.6, -10.8],
      [-5.6, -10.8],
    ],
    palette.belt,
  );
  poly(
    ctx,
    [
      [-1.2, -12.7],
      [1.2, -12.7],
      [1.2, -10.6],
      [-1.2, -10.6],
    ],
    palette.gold,
  );
  // One arm rests at his side; the other waves slowly overhead.
  stroke(
    ctx,
    [
      [-5, -16],
      [-6.2, -10],
    ],
    palette.red,
    2.6,
  );
  oval(ctx, -6.2, -9.6, 1.3, 1.3, palette.white);
  const wave = Math.sin(t * 2) * 0.45;
  const hand: Pt = [5 + Math.cos(-1.1 + wave) * 7, -16 + Math.sin(-1.1 + wave) * 7];
  stroke(ctx, [[5, -16], hand], palette.red, 2.6);
  oval(ctx, hand[0], hand[1], 1.4, 1.4, palette.white);
  // His face, and a white beard over the chin and down onto the coat.
  oval(ctx, 0, -21, 4, 4, palette.skins[0]);
  oval(ctx, -1.4, -21.6, 0.6, 0.7, palette.ink);
  oval(ctx, 1.4, -21.6, 0.6, 0.7, palette.ink);
  ctx.fillStyle = palette.white;
  ctx.beginPath();
  ctx.moveTo(-4.4, -21);
  ctx.quadraticCurveTo(-4, -14.5, 0, -13.5);
  ctx.quadraticCurveTo(4, -14.5, 4.4, -21);
  ctx.quadraticCurveTo(0, -18.5, -4.4, -21);
  ctx.fill();
  // A red hat that droops to one side, with a white brim and bobble.
  poly(
    ctx,
    [
      [-4.2, -23.5],
      [4.2, -23.5],
      [1, -30],
      [5.5, -28],
    ],
    palette.red,
  );
  oval(ctx, 5.5, -28, 1.6, 1.6, palette.white);
  oval(ctx, 0, -23.5, 4.8, 1.6, palette.white);
  ctx.restore();
}

function cart(ctx: Ctx, prop: Prop, t: number) {
  const kind = prop.variant % CART_KINDS.length;
  const x = prop.x + 0.18;
  const y = prop.y + 0.3;
  const w = 0.64;
  const d = 0.45;
  const look = visitorLook(prop.x + prop.y);
  // The vendor stands behind the cart.
  const vendor = at(prop.x + 0.5, prop.y + 0.12);
  person(ctx, vendor[0], vendor[1], { ...look, shirt: palette.cream, cap: palette.red });
  poly(ctx, rectPoints({ x: x + 0.15, y: y + 0.15, w, h: d }), palette.shadow);

  const body =
    kind === 0
      ? { top: palette.cream, left: palette.red, right: palette.redShade }
      : kind === 1
        ? { top: palette.cream, left: palette.pink, right: palette.pinkShade }
        : { top: palette.cream, left: palette.blue, right: palette.blueShade };
  box(ctx, x, y, w, d, 5, 14, body.top, body.left, body.right);
  stripedWall(ctx, { x, y: y + d }, { x: x + w, y: y + d }, 9, 3, 6, [palette.cream, body.left]);
  if (NORTH_POLE) {
    runner(ctx, x, x + w, y + d + 0.02, 5);
  } else {
    const wheelAt = at(x + w * 0.3, y + d + 0.02, 5);
    wheel(ctx, wheelAt[0], wheelAt[1], 5);
  }
  const top = at(x + w / 2, y + d / 2, 19);

  if (kind === 0) {
    box(
      ctx,
      x + 0.06,
      y + 0.06,
      w - 0.12,
      d - 0.12,
      19,
      10,
      'rgba(255,255,255,0.35)',
      'rgba(255,255,255,0.45)',
      'rgba(255,255,255,0.3)',
    );
    for (let i = 0; i < 9; i++)
      oval(
        ctx,
        top[0] - 8 + (i % 5) * 4,
        top[1] - 3 - Math.floor(i / 5) * 3 - (i % 2),
        2,
        2,
        palette.cream,
      );
    box(ctx, x, y, w, d, 29, 2, palette.red, palette.red, palette.redShade);
  } else if (kind === 1) {
    for (let i = 0; i < 3; i++) {
      const sx = top[0] - 7 + i * 7;
      const bob = Math.sin(t * 2 + i) * 0.5;
      stroke(
        ctx,
        [
          [sx, top[1]],
          [sx, top[1] - 9],
        ],
        palette.cream,
        1,
      );
      oval(ctx, sx, top[1] - 13 + bob, 4.5, 4.5, palette.pink);
      oval(ctx, sx - 1.5, top[1] - 14.5 + bob, 1.8, 1.8, palette.cream);
    }
  } else if (kind === 2) {
    stroke(ctx, [top, [top[0], top[1] - 22]], palette.metalShade, 1.2);
    dome(ctx, [top[0], top[1] - 18], 0.75, 0, 9, BLUE, 0, 10);
    for (let i = 0; i < 3; i++)
      oval(
        ctx,
        top[0] - 6 + i * 6,
        top[1] - 2,
        2.5,
        2.5,
        [palette.pink, palette.cream, palette.woodLight][i],
      );
  } else {
    // A giant drink on the roof.
    const [cx, cy] = top;
    poly(
      ctx,
      [
        [cx - 5, cy],
        [cx + 5, cy],
        [cx + 7, cy - 16],
        [cx - 7, cy - 16],
      ],
      palette.red,
    );
    poly(
      ctx,
      [
        [cx - 5.5, cy - 6],
        [cx + 5.5, cy - 6],
        [cx + 6, cy - 10],
        [cx - 6, cy - 10],
      ],
      palette.cream,
    );
    oval(ctx, cx, cy - 16, 7, 2, palette.cream);
    stroke(
      ctx,
      [
        [cx + 1, cy - 16],
        [cx + 4, cy - 24],
      ],
      palette.cream,
      1.5,
    );
  }

  // A little sign above it all.
  const sign = at(prop.x + 0.5, prop.y + 0.5, kind === 2 ? 50 : 42);
  onPlane(ctx, sign, () =>
    signBoard(ctx, CART_KINDS[kind].toUpperCase(), 30, 9, {
      board: palette.board,
      edge: palette.woodDark,
      text: palette.ink,
    }),
  );
}

function ticketBooth(ctx: Ctx, prop: Prop) {
  const x = prop.x + 0.15;
  const y = prop.y + 0.15;
  poly(ctx, rectPoints({ x: x + 0.2, y: y + 0.2, w: 0.7, h: 0.7 }), palette.shadow);
  box(ctx, x, y, 0.7, 0.7, 0, 26, palette.cream, palette.red, palette.redShade);
  poly(
    ctx,
    [
      at(x + 0.15, y + 0.7, 10),
      at(x + 0.55, y + 0.7, 10),
      at(x + 0.55, y + 0.7, 20),
      at(x + 0.15, y + 0.7, 20),
    ],
    palette.opening,
  );
  for (let i = 0; i < 6; i++) {
    const xa = lerp(x - 0.05, x + 0.75, i / 6);
    const xb = lerp(x - 0.05, x + 0.75, (i + 1) / 6);
    poly(
      ctx,
      [at(xa, y + 0.7, 23), at(xb, y + 0.7, 23), at(xb, y + 0.95, 17), at(xa, y + 0.95, 17)],
      i % 2 ? palette.cream : palette.blue,
    );
  }
  box(ctx, x - 0.05, y - 0.05, 0.8, 0.8, 26, 3, palette.blue, palette.blueShade, palette.blueShade);
  onPlane(ctx, at(x + 0.35, y + 0.35, 38), () =>
    signBoard(ctx, 'TICKETS', 28, 9, { board: palette.gold, edge: palette.red, text: palette.red }),
  );
}

/** Under the Christmas skin the ticket booth is a post office for letters to Santa. */
function postOffice(ctx: Ctx, prop: Prop) {
  const x = prop.x + 0.15;
  const y = prop.y + 0.15;
  poly(ctx, rectPoints({ x: x + 0.2, y: y + 0.2, w: 0.7, h: 0.7 }), palette.shadow);
  box(ctx, x, y, 0.7, 0.7, 0, 26, palette.snow, palette.red, palette.redShade);
  poly(
    ctx,
    [
      at(x + 0.15, y + 0.7, 12),
      at(x + 0.55, y + 0.7, 12),
      at(x + 0.55, y + 0.7, 20),
      at(x + 0.15, y + 0.7, 20),
    ],
    palette.glow,
  );
  // The letter slot under the window, and a letter on the side wall.
  poly(
    ctx,
    [
      at(x + 0.2, y + 0.7, 6),
      at(x + 0.5, y + 0.7, 6),
      at(x + 0.5, y + 0.7, 8),
      at(x + 0.2, y + 0.7, 8),
    ],
    palette.belt,
  );
  poly(
    ctx,
    [
      at(x + 0.7, y + 0.55, 9),
      at(x + 0.7, y + 0.15, 9),
      at(x + 0.7, y + 0.15, 17),
      at(x + 0.7, y + 0.55, 17),
    ],
    palette.snow,
  );
  stroke(
    ctx,
    [at(x + 0.7, y + 0.55, 17), at(x + 0.7, y + 0.35, 13), at(x + 0.7, y + 0.15, 17)],
    palette.redShade,
    1,
  );
  for (let i = 0; i < 6; i++) {
    const xa = lerp(x - 0.05, x + 0.75, i / 6);
    const xb = lerp(x - 0.05, x + 0.75, (i + 1) / 6);
    poly(
      ctx,
      [at(xa, y + 0.7, 23), at(xb, y + 0.7, 23), at(xb, y + 0.95, 17), at(xa, y + 0.95, 17)],
      i % 2 ? palette.snow : palette.hedgeLight,
    );
  }
  box(ctx, x - 0.05, y - 0.05, 0.8, 0.8, 26, 3, palette.snow, palette.snowShade, palette.snowShade);
  onPlane(ctx, at(x + 0.35, y + 0.35, 38), () =>
    signBoard(ctx, 'LETTERS TO SANTA', 34, 10, {
      board: palette.snow,
      edge: palette.red,
      text: palette.red,
    }),
  );
}

function bench(ctx: Ctx, prop: Prop) {
  const x = prop.x + 0.12;
  const y = prop.y + 0.4;
  for (const lx of [x + 0.08, x + 0.68])
    box(ctx, lx, y + 0.05, 0.05, 0.2, 0, 6, palette.woodDark, palette.woodDark, palette.woodDark);
  box(ctx, x, y, 0.76, 0.26, 6, 2, palette.woodLight, palette.wood, palette.woodDark);
  box(ctx, x, y - 0.02, 0.76, 0.06, 8, 7, palette.woodLight, palette.wood, palette.woodDark);
  if (!NORTH_POLE) return;
  // A dusting of snow on the seat and along the top of the back.
  box(
    ctx,
    x + 0.02,
    y + 0.08,
    0.72,
    0.16,
    8,
    1,
    palette.snow,
    palette.snowShade,
    palette.snowShade,
  );
  box(ctx, x, y - 0.02, 0.76, 0.06, 15, 1, palette.snow, palette.snowShade, palette.snowShade);
}

function planter(ctx: Ctx, prop: Prop) {
  if (NORTH_POLE) return presentStack(ctx, prop);
  const c = at(prop.x + 0.5, prop.y + 0.5);
  oval(ctx, c[0] + 3, c[1] + 1, 10, 4, palette.shadow);
  box(
    ctx,
    prop.x + 0.28,
    prop.y + 0.28,
    0.44,
    0.44,
    0,
    8,
    palette.creamShade,
    palette.cream,
    palette.creamShade,
  );
  oval(ctx, c[0] - 3, c[1] - 13, 5, 5, palette.hedge);
  oval(ctx, c[0] + 3, c[1] - 13, 5, 5, palette.hedgeDark);
  oval(ctx, c[0], c[1] - 17, 5, 5, palette.hedgeLight);
}

/** Under the Christmas skin a planter is a stack of wrapped presents. */
function presentStack(ctx: Ctx, prop: Prop) {
  const [x, y] = at(prop.x + 0.5, prop.y + 0.5);
  oval(ctx, x + 3, y + 1, 10, 4, palette.shadow);
  const n = prop.x + prop.y;
  present(ctx, x - 4, y - 4, 10, 8, PRESENTS[n % PRESENTS.length]);
  present(ctx, x + 4, y - 3.5, 8, 7, PRESENTS[(n + 1) % PRESENTS.length]);
  present(ctx, x, y - 12, 9, 8, PRESENTS[(n + 2) % PRESENTS.length]);
  present(ctx, x + 1, y - 19, 6, 5, PRESENTS[(n + 3) % PRESENTS.length]);
}

/** A small six-armed snowflake centred on (x, y). */
function snowflake(ctx: Ctx, x: number, y: number, r: number) {
  ctx.strokeStyle = palette.snow;
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI) / 3;
    const dx = Math.cos(angle) * r;
    const dy = Math.sin(angle) * r;
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
  }
  ctx.stroke();
}

/**
 * Under the Christmas skin a balloon stand is a drift of snow, with flakes
 * falling onto it while it snows (`snow` from 0 to 1).
 */
function snowfall(ctx: Ctx, prop: Prop, t: number, snow: number) {
  const [x, y] = at(prop.x + 0.5, prop.y + 0.5);
  oval(ctx, x + 1, y + 1, 9, 3.5, palette.snowShade);
  oval(ctx, x, y - 1, 7, 3, palette.snow);
  if (snow <= 0) return;
  const before = ctx.globalAlpha;
  const fade = before * snow;
  for (let i = 0; i < 4; i++) {
    const fall = (t * 0.25 + i / 4 + hash(prop.x, prop.y, i)) % 1;
    const fx = x - 8 + i * 5 + Math.sin(t * 1.2 + i * 2) * 2.5;
    const fy = y - 48 + fall * 44;
    ctx.globalAlpha = fade * Math.min(1, (1 - fall) * 4);
    snowflake(ctx, fx, fy, 2 + (i % 2));
  }
  ctx.globalAlpha = before;
}

function balloons(ctx: Ctx, prop: Prop, t: number, snow: number) {
  if (NORTH_POLE) return snowfall(ctx, prop, t, snow);
  const c = at(prop.x + 0.5, prop.y + 0.5);
  oval(ctx, c[0] + 2, c[1] + 1, 5, 2, palette.shadow);
  box(
    ctx,
    prop.x + 0.42,
    prop.y + 0.42,
    0.16,
    0.16,
    0,
    4,
    palette.blue,
    palette.blueShade,
    palette.blueShade,
  );
  for (let i = 0; i < 3; i++) {
    const bob = Math.sin(t * 1.8 + i + prop.x) * 1.5;
    const bx = c[0] - 6 + i * 6;
    const by = c[1] - 40 - (i === 1 ? 7 : 0) + bob;
    const color = palette.balloons[(i + prop.x) % palette.balloons.length];
    ctx.strokeStyle = palette.metalShade;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(c[0], c[1] - 4);
    ctx.quadraticCurveTo(bx, by + 18, bx, by + 7);
    ctx.stroke();
    oval(ctx, bx, by, 5, 6.5, color);
    oval(ctx, bx - 1.8, by - 2.5, 1.4, 2, 'rgba(255,255,255,0.6)');
    poly(
      ctx,
      [
        [bx - 1, by + 7],
        [bx + 1, by + 7],
        [bx, by + 6],
      ],
      color,
    );
  }
}

/** How high a billboard's sign stands, to the bottom of its board. */
const BILLBOARD_HEIGHT = 40;

/**
 * The billboard's sign, in plane-local pixels: the banner plus its gold frame.
 * The board keeps the banner image's shape, 4 by 1.
 */
const BILLBOARD_SIGN = { width: 144, height: 36, frame: 3 };

let banner: HTMLImageElement | undefined;

/** The AI DevCon banner, loaded the first time the billboard is drawn. */
function bannerImage(): HTMLImageElement {
  if (!banner) {
    banner = new Image();
    banner.src = bannerUrl;
  }
  return banner;
}

/** Where a billboard's posts stand, and the point its sign is centred on. */
function billboardFrame(prop: Prop) {
  const y = prop.y + 0.5;
  const left = prop.x + 0.35;
  const right = prop.x + prop.w - 0.35;
  return { y, left, right, centre: at((left + right) / 2, y, BILLBOARD_HEIGHT + 18) };
}

/**
 * The screen box a billboard covers, sign and posts, for clicks and fading.
 * The sign sits on a slanted plane (see onPlane), so its corners are mapped
 * with the same 0.894 and 0.447 factors.
 */
function billboardBounds(prop: Prop): Box {
  const { y, left, right, centre } = billboardFrame(prop);
  const halfWidth = BILLBOARD_SIGN.width / 2 + BILLBOARD_SIGN.frame;
  const halfHeight = BILLBOARD_SIGN.height / 2 + BILLBOARD_SIGN.frame;
  const feet = [at(left, y), at(right, y)];
  return {
    left: Math.min(centre[0] - 0.894 * halfWidth, ...feet.map((p) => p[0])),
    right: Math.max(centre[0] + 0.894 * halfWidth, ...feet.map((p) => p[0])),
    top: centre[1] - 0.447 * halfWidth - halfHeight,
    bottom: Math.max(centre[1] + 0.447 * halfWidth + halfHeight, ...feet.map((p) => p[1])),
  };
}

/** The AI DevCon billboard: the event banner, lit, on two posts. Clicking it opens the event page. */
function billboard(ctx: Ctx, prop: Prop, t: number) {
  const { y, left, right, centre } = billboardFrame(prop);
  poly(
    ctx,
    rectPoints({ x: prop.x + 0.3, y: prop.y + 0.4, w: prop.w - 0.4, h: 0.5 }),
    palette.shadow,
  );
  for (const px of [left, right]) {
    box(
      ctx,
      px - 0.07,
      y - 0.07,
      0.14,
      0.14,
      0,
      BILLBOARD_HEIGHT + 12,
      palette.woodLight,
      palette.wood,
      palette.woodDark,
    );
  }
  onPlane(ctx, centre, () => {
    const { width, height, frame } = BILLBOARD_SIGN;
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.roundRect(
      -width / 2 - frame,
      -height / 2 - frame,
      width + frame * 2,
      height + frame * 2,
      5,
    );
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, 3);
    ctx.fill();
    // Until the banner loads, the board stays plain.
    const image = bannerImage();
    if (image.complete && image.naturalWidth > 0) {
      ctx.save();
      ctx.clip();
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, -width / 2, -height / 2, width, height);
      ctx.restore();
    }
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = Math.sin(t * 4 - i * 0.7) > 0 ? palette.cream : palette.goldShade;
      ctx.beginPath();
      ctx.arc(-width / 2 + 4 + i * ((width - 8) / 11), -height / 2 - 1.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** How high the top of a bunting pole is. */
const POLE_HEIGHT = 44;

function buntingPole(ctx: Ctx, prop: Prop) {
  const [x, y] = at(prop.x + 0.5, prop.y + 0.5);
  oval(ctx, x + 2, y + 1, 4, 1.6, palette.shadow);
  poly(
    ctx,
    [
      [x - 1.3, y],
      [x + 1.3, y],
      [x + 1.3, y - POLE_HEIGHT],
      [x - 1.3, y - POLE_HEIGHT],
    ],
    palette.cream,
  );
  for (let z = 4; z < POLE_HEIGHT; z += 8)
    poly(
      ctx,
      [
        [x - 1.3, y - z],
        [x + 1.3, y - z - 2],
        [x + 1.3, y - z - 5],
        [x - 1.3, y - z - 3],
      ],
      palette.red,
    );
  knob(ctx, x, y - POLE_HEIGHT - 1);
}

/** Bunting between the poles, skipping any strung outside the view. */
export function drawBunting(ctx: Ctx, map: MidwayMap, t: number, view: Box) {
  map.bunting.forEach(([a, b], n) => {
    const p = at(a.x + 0.5, a.y + 0.5, POLE_HEIGHT - 2);
    const q = at(b.x + 0.5, b.y + 0.5, POLE_HEIGHT - 2);
    if (!buntingInView(p, q, view)) return;
    const points = buntingLine(p, q);
    stroke(ctx, points, palette.woodDark, 0.6);
    if (NORTH_POLE) fairyLights(ctx, points, t, n);
    else flags(ctx, points, t, 4, n);
  });
}

/** A fairy light bulb at each point along a string, twinkling with `t`. */
function fairyLights(ctx: Ctx, points: readonly Pt[], t: number, phase = 0) {
  const fade = ctx.globalAlpha;
  points.forEach(([x, y], i) => {
    const color = palette.fairyLights[(i + phase) % palette.fairyLights.length];
    ctx.globalAlpha = fade * (Math.sin(t * 3 + i * 1.7 + phase) > -0.3 ? 1 : 0.45);
    oval(ctx, x, y + 1.6, 1.3, 1.7, color);
  });
  ctx.globalAlpha = fade;
}

/** Whether a string of bunting between `p` and `q`, sag included, can reach the view. */
function buntingInView(p: Pt, q: Pt, view: Box) {
  if (Math.max(p[0], q[0]) < view.left || Math.min(p[0], q[0]) > view.right) return false;
  return !(Math.max(p[1], q[1]) + 20 < view.top || Math.min(p[1], q[1]) > view.bottom);
}

/** Screen points along a string of bunting, sagging between its two ends. */
function buntingLine(p: Pt, q: Pt): Pt[] {
  const sag = Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.12;
  const points: Pt[] = [];
  const count = 12;
  for (let i = 0; i <= count; i++) {
    const s = i / count;
    points.push([lerp(p[0], q[0], s), lerp(p[1], q[1], s) + 4 * sag * s * (1 - s)]);
  }
  return points;
}

function ferrisWheel(ctx: Ctx, prop: Prop, t: number) {
  const cx = prop.x + prop.w / 2;
  const cy = prop.y + prop.h / 2;
  const radius = 60;
  const hubZ = 76;
  const spread = 0.28;
  const turn = t * 0.2;
  const cars = 10;
  const hubAt = (offset: number) => at(cx, cy + offset, hubZ);
  const onWheel = (offset: number, angle: number, r = radius): Pt => {
    const [hx, hy] = hubAt(offset);
    return [
      hx + Math.cos(angle) * r * 0.894,
      hy + Math.cos(angle) * r * 0.447 - Math.sin(angle) * r,
    ];
  };
  const ring = (offset: number, r: number, color: string, width: number) => {
    const points: Pt[] = [];
    for (let i = 0; i <= 48; i++) points.push(onWheel(offset, (i / 48) * Math.PI * 2, r));
    stroke(ctx, points, color, width);
  };
  const legs = (offset: number, color: string) => {
    stroke(ctx, [at(cx - 1.4, cy + offset), hubAt(offset), at(cx + 1.4, cy + offset)], color, 4.5);
  };

  const base = at(cx, cy);
  oval(ctx, base[0] + 10, base[1] + 4, 44, 14, palette.shadow);
  legs(-spread - 0.15, palette.creamShade);
  for (const side of [-spread, spread]) {
    if (side > 0) {
      // The cars hang between the two rims.
      for (let i = 0; i < cars; i++) {
        const angle = turn + (i / cars) * Math.PI * 2;
        const [gx, gy] = onWheel(0, angle);
        stroke(
          ctx,
          [
            [gx, gy],
            [gx, gy + 4],
          ],
          palette.metalShade,
          1,
        );
        if (NORTH_POLE) {
          present(ctx, gx, gy + 8, 10, 8, PRESENTS[i % PRESENTS.length]);
          continue;
        }
        ctx.fillStyle = palette.red;
        ctx.beginPath();
        ctx.roundRect(gx - 5, gy + 4, 10, 8, 2);
        ctx.fill();
        poly(
          ctx,
          [
            [gx - 6, gy + 4],
            [gx + 6, gy + 4],
            [gx + 4, gy + 1.5],
            [gx - 4, gy + 1.5],
          ],
          palette.gold,
        );
        poly(
          ctx,
          [
            [gx - 3.5, gy + 6],
            [gx + 3.5, gy + 6],
            [gx + 3.5, gy + 8.5],
            [gx - 3.5, gy + 8.5],
          ],
          palette.cream,
        );
      }
    }
    for (let i = 0; i < cars; i++) {
      const angle = turn + (i / cars) * Math.PI * 2;
      const spoke = [hubAt(side), onWheel(side, angle)];
      if (NORTH_POLE) {
        // Candy-cane spokes: red stripes over white.
        stroke(ctx, spoke, palette.snow, 1.8);
        ctx.setLineDash([3, 3]);
        stroke(ctx, spoke, palette.red, 1.8);
        ctx.setLineDash([]);
      } else {
        stroke(ctx, spoke, palette.cream, 1.4);
      }
    }
    ring(side, radius * 0.6, palette.gold, 4);
    ring(side, radius, side > 0 ? palette.blue : palette.blueShade, 4.5);
  }
  stroke(ctx, [hubAt(-spread), hubAt(spread)], palette.woodDark, 4);
  const hub = hubAt(spread);
  oval(ctx, hub[0], hub[1], 7, 7, palette.wood);
  oval(ctx, hub[0], hub[1], 3.5, 3.5, palette.woodDark);
  legs(spread + 0.15, palette.cream);
  box(ctx, cx - 0.6, cy - 0.5, 1.2, 1, 0, 4, palette.creamShade, palette.cream, palette.creamShade);
}

// ── Booths ────────────────────────────────────────────────────────────────

const CARNIVAL_BOOTH_SCHEMES = [
  {
    wall: palette.gold,
    wallShade: palette.goldShade,
    awning: [palette.blue, palette.cream],
    awningShade: [palette.blueShade, palette.creamShade],
  },
  {
    wall: palette.cream,
    wallShade: palette.creamShade,
    awning: [palette.red, palette.cream],
    awningShade: [palette.redShade, palette.creamShade],
  },
  {
    wall: palette.sky2,
    wallShade: palette.blue,
    awning: [palette.gold, palette.cream],
    awningShade: [palette.goldShade, palette.creamShade],
  },
  {
    wall: palette.pink,
    wallShade: palette.pinkShade,
    awning: [palette.red, palette.gold],
    awningShade: [palette.redShade, palette.goldShade],
  },
] as const;
/** Under the Christmas skin the booths are wooden toy workbenches with snowy awnings. */
const WORKBENCH_SCHEMES = [
  {
    wall: palette.wood,
    wallShade: palette.woodDark,
    awning: [palette.red, palette.snow],
    awningShade: [palette.redShade, palette.snowShade],
  },
  {
    wall: palette.wood,
    wallShade: palette.woodDark,
    awning: [palette.hedgeLight, palette.snow],
    awningShade: [palette.hedge, palette.snowShade],
  },
  {
    wall: palette.wood,
    wallShade: palette.woodDark,
    awning: [palette.gold, palette.snow],
    awningShade: [palette.goldShade, palette.snowShade],
  },
  {
    wall: palette.wood,
    wallShade: palette.woodDark,
    awning: [palette.blue, palette.snow],
    awningShade: [palette.blueShade, palette.snowShade],
  },
] as const;
const BOOTH_SCHEMES = NORTH_POLE ? WORKBENCH_SCHEMES : CARNIVAL_BOOTH_SCHEMES;
const CLOSED_SCHEME = {
  wall: palette.closed,
  wallShade: palette.closedShade,
  awning: [palette.closed, palette.metal],
  awningShade: [palette.closedShade, palette.metalShade],
} as const;

const BOOTH_WALL = 34;
/** How far above a booth's footprint its sign hangs. */
export const BOOTH_SIGN_HEIGHT = BOOTH_WALL + 22;

function target(ctx: Ctx, r: number) {
  const rings = [palette.red, palette.cream, palette.red, palette.cream];
  rings.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1 - i / rings.length), 0, Math.PI * 2);
    ctx.fill();
  });
}

function booth(ctx: Ctx, slot: BoothSlot, name: string, t: number, glow: boolean) {
  const open = slot.gameId !== undefined;
  const scheme = open ? BOOTH_SCHEMES[slot.index % BOOTH_SCHEMES.length] : CLOSED_SCHEME;
  const x0 = slot.x + 0.15;
  const y0 = slot.y + 0.15;
  const s = 1.7;
  const x1 = x0 + s;
  const y1 = y0 + s;
  const wall = BOOTH_WALL;

  poly(ctx, rectPoints({ x: x0 + 0.35, y: y0 + 0.35, w: s, h: s }), palette.shadow);
  box(ctx, x0, y0, s, s, 0, wall, scheme.wall, scheme.wall, scheme.wallShade);

  // A window and counter on both faces we can see.
  const windows = [
    { a: { x: x0 + 0.15, y: y1 }, b: { x: x1 - 0.15, y: y1 }, out: { x: 0, y: 1 } },
    { a: { x: x1, y: y1 - 0.15 }, b: { x: x1, y: y0 + 0.15 }, out: { x: 1, y: 0 } },
  ];
  windows.forEach(({ a, b, out }, side) => {
    poly(
      ctx,
      [at(a.x, a.y, 9), at(b.x, b.y, 9), at(b.x, b.y, wall - 7), at(a.x, a.y, wall - 7)],
      palette.opening,
    );
    if (open) {
      for (let i = 0; i < 4; i++) {
        const p = at(lerp(a.x, b.x, (i + 0.5) / 4), lerp(a.y, b.y, (i + 0.5) / 4), 13);
        const hop = Math.sin(t * 2 + i + slot.index + side) > 0.9 ? 1.5 : 0;
        const color = palette.balloons[(i + side + slot.index) % palette.balloons.length];
        oval(ctx, p[0], p[1] - hop, 2.6, 2.6, color);
        oval(ctx, p[0] - 1.6, p[1] - 2.4 - hop, 1, 1, color);
        oval(ctx, p[0] + 1.6, p[1] - 2.4 - hop, 1, 1, color);
      }
    } else {
      // Shutters down.
      for (let i = 0; i < 4; i++) {
        const z = 9 + i * 3;
        poly(
          ctx,
          [at(a.x, a.y, z), at(b.x, b.y, z), at(b.x, b.y, z + 2.2), at(a.x, a.y, z + 2.2)],
          palette.metalShade,
        );
      }
    }
    const lip = 0.14;
    const aOut = { x: a.x + out.x * lip, y: a.y + out.y * lip };
    const bOut = { x: b.x + out.x * lip, y: b.y + out.y * lip };
    poly(
      ctx,
      [at(a.x, a.y, 9), at(b.x, b.y, 9), at(bOut.x, bOut.y, 9), at(aOut.x, aOut.y, 9)],
      palette.woodLight,
    );
    poly(
      ctx,
      [at(aOut.x, aOut.y, 9), at(bOut.x, bOut.y, 9), at(bOut.x, bOut.y, 7), at(aOut.x, aOut.y, 7)],
      palette.woodDark,
    );
  });

  box(
    ctx,
    x0 - 0.06,
    y0 - 0.06,
    s + 0.12,
    s + 0.12,
    wall,
    3,
    NORTH_POLE ? palette.snow : scheme.wall,
    scheme.wallShade,
    scheme.wallShade,
  );

  // Striped awnings over each window.
  const reach = open ? 0.42 : 0.12;
  const strips = 8;
  for (let i = 0; i < strips; i++) {
    const ya = lerp(y1 + 0.06, y0 - 0.06, i / strips);
    const yb = lerp(y1 + 0.06, y0 - 0.06, (i + 1) / strips);
    poly(
      ctx,
      [
        at(x1 + 0.06, ya, wall),
        at(x1 + 0.06, yb, wall),
        at(x1 + 0.06 + reach, yb, wall - 8),
        at(x1 + 0.06 + reach, ya, wall - 8),
      ],
      scheme.awningShade[i % 2],
    );
  }
  if (NORTH_POLE) {
    const sx = x1 + 0.06 + reach * 0.45;
    poly(
      ctx,
      [
        at(x1 + 0.06, y1 + 0.06, wall),
        at(x1 + 0.06, y0 - 0.06, wall),
        at(sx, y0 - 0.06, wall - 3.6),
        at(sx, y1 + 0.06, wall - 3.6),
      ],
      palette.snowShade,
    );
  }
  scallops(
    ctx,
    { x: x1 + 0.06 + reach, y: y1 + 0.06 },
    { x: x1 + 0.06 + reach, y: y0 - 0.06 },
    wall - 8,
    strips,
    2.5,
    scheme.awningShade,
  );
  for (let i = 0; i < strips; i++) {
    const xa = lerp(x0 - 0.06, x1 + 0.06, i / strips);
    const xb = lerp(x0 - 0.06, x1 + 0.06, (i + 1) / strips);
    poly(
      ctx,
      [
        at(xa, y1 + 0.06, wall),
        at(xb, y1 + 0.06, wall),
        at(xb, y1 + 0.06 + reach, wall - 8),
        at(xa, y1 + 0.06 + reach, wall - 8),
      ],
      scheme.awning[i % 2],
    );
  }
  if (NORTH_POLE) {
    const sy = y1 + 0.06 + reach * 0.45;
    poly(
      ctx,
      [
        at(x0 - 0.06, y1 + 0.06, wall),
        at(x1 + 0.06, y1 + 0.06, wall),
        at(x1 + 0.06, sy, wall - 3.6),
        at(x0 - 0.06, sy, wall - 3.6),
      ],
      palette.snow,
    );
  }
  scallops(
    ctx,
    { x: x0 - 0.06, y: y1 + 0.06 + reach },
    { x: x1 + 0.06, y: y1 + 0.06 + reach },
    wall - 8,
    strips,
    2.5,
    scheme.awning,
  );

  // The sign on the roof, with the game's name on it.
  const signAt = at(x0 + s / 2, y0 + s / 2, BOOTH_SIGN_HEIGHT - 6);
  onPlane(ctx, signAt, () => {
    ctx.fillStyle = palette.woodDark;
    ctx.fillRect(-20, 2, 2, 12);
    ctx.fillRect(18, 2, 2, 12);
    if (open) {
      ctx.save();
      ctx.translate(0, -18);
      target(ctx, 9);
      ctx.restore();
    }
    signBoard(
      ctx,
      name,
      60,
      16,
      open
        ? { board: palette.cream, edge: palette.red, text: palette.red }
        : { board: palette.metal, edge: palette.closedShade, text: palette.closedShade },
      glow,
    );
    if (open) {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = Math.sin(t * 5 + i * 1.3) > -0.2 ? palette.gold : palette.goldShade;
        ctx.beginPath();
        ctx.arc(-28 + i * (56 / 7), -10, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// ── Bounds, for clicks and for fading things in front of the player ───────

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The screen box a booth and its sign are drawn in. */
export function boothBounds(slot: BoothSlot): Box {
  const c = toScreen(slot.x + 1, slot.y + 1);
  return { left: c.x - 32, right: c.x + 32, top: c.y - BOOTH_SIGN_HEIGHT - 30, bottom: c.y + 18 };
}

const PROP_HEIGHTS: Record<Prop['kind'], number> = {
  'big-top': 100,
  'round-tent': 80,
  'peaked-tent': 56,
  'ferris-wheel': 150,
  carousel: 86,
  wagon: 38,
  cart: 50,
  'ticket-booth': 46,
  bench: 16,
  planter: 22,
  balloons: 52,
  'bunting-pole': 0,
  billboard: BILLBOARD_HEIGHT + 40,
  santa: 52,
};

/** Roughly the screen box a prop is drawn in. */
export function propBounds(prop: Prop): Box {
  if (prop.kind === 'billboard') return billboardBounds(prop);
  const c = toScreen(prop.x + prop.w / 2, prop.y + prop.h / 2);
  const half = ((prop.w + prop.h) * 16) / 2;
  const footprint = ((prop.w + prop.h) * 8) / 2;
  return {
    left: c.x - half,
    right: c.x + half,
    top: c.y - footprint - PROP_HEIGHTS[prop.kind],
    bottom: c.y + footprint,
  };
}

// ── People ────────────────────────────────────────────────────────────────

export interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  cap?: string;
  /** What an elf wears, under the Christmas skin. */
  tunic: string;
  hat: string;
}

export function visitorLook(n: number): Look {
  return {
    skin: palette.skins[n % palette.skins.length],
    hair: palette.hairs[(n * 3 + 1) % palette.hairs.length],
    shirt: palette.shirts[(n * 2 + 1) % palette.shirts.length],
    pants: palette.pants[n % palette.pants.length],
    tunic: palette.tunics[(n * 2 + 1) % palette.tunics.length],
    hat: palette.elfHats[(n * 3 + 2) % palette.elfHats.length],
  };
}

export const PLAYER_LOOK: Look = {
  skin: palette.skins[0],
  hair: palette.hairs[2],
  shirt: palette.red,
  pants: palette.pants[0],
  cap: palette.gold,
  tunic: palette.tunics[1],
  hat: palette.red,
};

export function drawWalker(ctx: Ctx, walker: Walker, look: Look, player = false, t = 0) {
  const p = toScreen(walker.x, walker.y);
  const swing = walker.walking ? Math.sin(walker.stride * Math.PI * 2.2) : 0;
  person(ctx, p.x, p.y, look, {
    swing,
    back: walker.facing === 'back',
    dir: walker.flipped ? -1 : 1,
    player,
    t,
  });
}

// ── The gate ──────────────────────────────────────────────────────────────

const ARCH_HEIGHT = 58;
const ARCH_LEFT = -0.45;
const ARCH_RIGHT = 2.2;

export function archBounds(map: MidwayMap): Box {
  const y = map.height - 1;
  const left = toScreen(map.avenueX + ARCH_LEFT - 0.6, y + 0.3);
  const right = toScreen(map.avenueX + ARCH_RIGHT + 0.8, y - 0.3);
  return { left: left.x, right: right.x, top: right.y - ARCH_HEIGHT - 26, bottom: left.y };
}

export function drawArch(ctx: Ctx, map: MidwayMap, t: number) {
  const y = map.height - 0.75;
  const left = map.avenueX + ARCH_LEFT;
  const right = map.avenueX + ARCH_RIGHT;
  for (const px of [left, right])
    box(
      ctx,
      px,
      y - 0.15,
      0.26,
      0.26,
      0,
      ARCH_HEIGHT,
      palette.woodLight,
      palette.wood,
      palette.woodDark,
    );
  const centre = at((left + right + 0.26) / 2, y, ARCH_HEIGHT + 2);
  onPlane(ctx, centre, () => {
    if (NORTH_POLE) return workshopSign(ctx, t);
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.ellipse(0, -10, 18, 14, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.red;
    ctx.beginPath();
    ctx.ellipse(0, -10, 12, 9, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    signBoard(ctx, 'TESSL CARNIVAL', 92, 20, {
      board: palette.wood,
      edge: palette.woodDark,
      text: palette.gold,
    });
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = Math.sin(t * 5 - i * 0.8) > 0 ? palette.cream : palette.goldShade;
      ctx.beginPath();
      ctx.arc(-44 + i * (88 / 13), 13.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  for (const px of [left, right]) {
    const top = at(px + 0.13, y - 0.02, ARCH_HEIGHT);
    flag(ctx, top[0], top[1], t + px, palette.red);
  }
}

/** The gate's sign under the Christmas skin, in plane-local pixels: a wreath over it, fairy lights under. */
function workshopSign(ctx: Ctx, t: number) {
  ctx.strokeStyle = palette.hedge;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -19, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = palette.hedgeLight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -19, 9, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.4;
    oval(ctx, Math.cos(angle) * 8, -19 + Math.sin(angle) * 8, 1.2, 1.2, palette.red);
  }
  poly(
    ctx,
    [
      [0, -11],
      [-5, -14],
      [-5, -8],
    ],
    palette.red,
  );
  poly(
    ctx,
    [
      [0, -11],
      [5, -14],
      [5, -8],
    ],
    palette.red,
  );
  signBoard(ctx, "SANTA'S WORKSHOP", 92, 20, {
    board: palette.red,
    edge: palette.redShade,
    text: palette.snow,
  });
  const lights: Pt[] = [];
  for (let i = 0; i < 14; i++) {
    const s = i / 13;
    lights.push([-44 + s * 88, 12.5 + Math.sin(s * Math.PI) * 1.5]);
  }
  fairyLights(ctx, lights, t * 1.6);
}

// ── The sky ───────────────────────────────────────────────────────────────

export interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export function drawCloud(ctx: Ctx, x: number, y: number, size: number, look: DayLook) {
  ctx.fillStyle = look.cloud;
  ctx.beginPath();
  ctx.roundRect(x - 30 * size, y - 8 * size, 60 * size, 12 * size, 6 * size);
  ctx.arc(x - 14 * size, y - 8 * size, 11 * size, 0, Math.PI * 2);
  ctx.arc(x + 4 * size, y - 13 * size, 15 * size, 0, Math.PI * 2);
  ctx.arc(x + 20 * size, y - 6 * size, 9 * size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.cloudShade;
  ctx.beginPath();
  ctx.roundRect(x - 30 * size, y, 60 * size, 4 * size, 2 * size);
  ctx.fill();
}

/**
 * A few stars, fixed in the sky across a `width` by `height` screen area
 * that ends at the horizon. `brightness` runs from 0 (none) to 1.
 */
export function drawStars(ctx: Ctx, width: number, horizon: number, brightness: number) {
  if (brightness <= 0) return;
  ctx.fillStyle = palette.star;
  for (let i = 0; i < 60; i++) {
    const x = hash(i, 3) * width;
    const y = horizon - 20 - hash(i, 4) * 600;
    if (y < 0) continue;
    ctx.globalAlpha = brightness * (0.4 + hash(i, 5) * 0.6);
    const size = hash(i, 6) > 0.85 ? 2 : 1.2;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

/** How many seconds a snowflake drifts down before it melts away. */
export const SNOWFLAKE_LIFE = 8;

export interface Floater {
  x: number;
  y: number;
  age: number;
  color: string;
}

/**
 * Balloons someone let go of, drifting up into the sky. Under the Christmas
 * skin they are snowflakes drifting down over the map, fading in and out with
 * the snowfall (`snow` from 0 to 1).
 */
export function drawFloaters(ctx: Ctx, floaters: readonly Floater[], snow = 0) {
  if (NORTH_POLE) {
    for (const f of floaters) {
      ctx.globalAlpha = snow * Math.max(0, Math.min(1, f.age, SNOWFLAKE_LIFE - f.age));
      snowflake(ctx, f.x + Math.sin(f.age * 1.5 + f.x) * 6, f.y, 2.5);
    }
    ctx.globalAlpha = 1;
    return;
  }
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, 6 - f.age));
    const sway = Math.sin(f.age * 2) * 3;
    ctx.strokeStyle = palette.metalShade;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(f.x + sway, f.y + 7);
    ctx.quadraticCurveTo(f.x + sway - 3, f.y + 13, f.x + sway, f.y + 18);
    ctx.stroke();
    oval(ctx, f.x + sway, f.y, 5, 6.5, f.color);
    oval(ctx, f.x + sway - 1.8, f.y - 2.5, 1.4, 2, 'rgba(255,255,255,0.6)');
  }
  ctx.globalAlpha = 1;
}

// ── Snowmen ───────────────────────────────────────────────────────────────

/** A snowman's bottom ball, middle ball and head: radius and how high its centre sits. */
const SNOWMAN_BALLS = [
  { r: 7, z: 6 },
  { r: 5, z: 15.5 },
  { r: 3.6, z: 22.5 },
] as const;

/** The world-pixel box a snowman at a tile position covers. */
export function snowmanBounds(spot: Point): Box {
  const p = toScreen(spot.x, spot.y);
  return { left: p.x - 22, right: p.x + 12, top: p.y - 36, bottom: p.y + 4 };
}

/**
 * A snowman at a tile position, built as far as `parts` says: the bottom ball
 * rolls in and grows, then the middle ball and the head, then the coal eyes,
 * the carrot nose, a scarf and a hat. `melt`, from 0 to 1, slumps it into the
 * snow and fades it away.
 */
export function drawSnowman(ctx: Ctx, spot: Point, parts: SnowmanParts, melt: number) {
  if (parts.bottom <= 0 || melt >= 1) return;
  const [x, y] = at(spot.x, spot.y);
  const fade = ctx.globalAlpha;
  ctx.save();
  ctx.globalAlpha = fade * (1 - melt);
  ctx.translate(x, y);
  ctx.scale(1 + melt * 0.5, 1 - melt * 0.85);

  const grown = [parts.bottom, parts.middle, parts.head];
  oval(ctx, 3, 1, 9 * Math.max(0.4, parts.bottom), 3.5, palette.shadow);
  SNOWMAN_BALLS.forEach((ball, i) => {
    const s = grown[i];
    if (s <= 0) return;
    const r = ball.r * (0.3 + 0.7 * s);
    // The bottom ball rolls in from the left as it grows; the others settle on top.
    const bx = i === 0 ? -(1 - s) * 12 : 0;
    const bz = i === 0 ? r - 1 : ball.z + (1 - s) * 6;
    oval(ctx, bx + 0.8, -bz + 0.8, r, r * 0.95, palette.snowShade);
    oval(ctx, bx, -bz, r, r * 0.95, palette.snow);
  });

  const d = parts.dressing;
  if (d > 0) {
    const head = SNOWMAN_BALLS[2];
    const body = SNOWMAN_BALLS[1];
    ctx.globalAlpha = fade * (1 - melt) * Math.min(1, d * 4);
    oval(ctx, -1.3, -head.z - 0.6, 0.6, 0.6, palette.coal);
    oval(ctx, 1.3, -head.z - 0.6, 0.6, 0.6, palette.coal);
    oval(ctx, 0, -body.z + 1, 0.7, 0.7, palette.coal);
    oval(ctx, 0, -body.z - 2, 0.7, 0.7, palette.coal);
    if (d > 0.25) {
      ctx.globalAlpha = fade * (1 - melt) * Math.min(1, (d - 0.25) * 4);
      poly(
        ctx,
        [
          [0, -head.z + 0.2],
          [4.5, -head.z + 0.9],
          [0, -head.z + 1.4],
        ],
        palette.carrot,
      );
    }
    if (d > 0.5) {
      const scarf = palette.scarf[Math.floor(Math.abs(spot.x * 3 + spot.y)) % palette.scarf.length];
      ctx.globalAlpha = fade * (1 - melt) * Math.min(1, (d - 0.5) * 4);
      oval(ctx, 0, -head.z + 3.6, 4.2, 1.5, scarf);
      poly(
        ctx,
        [
          [1.5, -head.z + 4],
          [3.2, -head.z + 4],
          [3.8, -head.z + 9],
          [2, -head.z + 9],
        ],
        scarf,
      );
    }
    if (d > 0.75) {
      ctx.globalAlpha = fade * (1 - melt) * Math.min(1, (d - 0.75) * 4);
      const top = -head.z - head.r + 0.8;
      oval(ctx, 0, top, 4.4, 1.3, palette.hat);
      poly(
        ctx,
        [
          [-2.6, top],
          [2.6, top],
          [2.4, top - 5],
          [-2.4, top - 5],
        ],
        palette.hat,
      );
    }
  }
  ctx.restore();
}

// ── Lights after dark ─────────────────────────────────────────────────────

/** Where each lit prop glows, as a height off the ground and a radius, in world pixels. */
const PROP_GLOWS: Partial<Record<Prop['kind'], { z: number; r: number }>> = {
  'big-top': { z: 40, r: 80 },
  'round-tent': { z: 30, r: 56 },
  'peaked-tent': { z: 22, r: 48 },
  'ferris-wheel': { z: 76, r: 90 },
  carousel: { z: 30, r: 64 },
  cart: { z: 18, r: 28 },
  'ticket-booth': { z: 20, r: 30 },
  billboard: { z: BILLBOARD_HEIGHT, r: 60 },
};

function glow(ctx: Ctx, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, palette.glow);
  g.addColorStop(1, palette.glowEdge);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * Lights the open booths, the tents, the rides, the gate and the bunting,
 * adding a warm glow on top of what's drawn. `brightness` runs from 0 (off)
 * to 1, and anything outside `view` is skipped.
 */
export function drawLights(ctx: Ctx, map: MidwayMap, brightness: number, t: number, view: Box) {
  if (brightness <= 0) return;
  const seen = (x: number, y: number, r: number) =>
    x + r > view.left && x - r < view.right && y + r > view.top && y - r < view.bottom;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = brightness * 0.45;
  for (const slot of map.booths) {
    if (!slot.gameId) continue;
    const [x, y] = at(slot.x + 1, slot.y + 1, 20);
    if (seen(x, y, 44)) glow(ctx, x, y, 44);
  }
  for (const prop of map.props) {
    const lit = PROP_GLOWS[prop.kind];
    if (!lit) continue;
    const [x, y] = at(prop.x + prop.w / 2, prop.y + prop.h / 2, lit.z);
    if (seen(x, y, lit.r)) glow(ctx, x, y, lit.r);
  }
  const gate = at(map.avenueX + (ARCH_LEFT + ARCH_RIGHT) / 2, map.height - 0.75, ARCH_HEIGHT);
  if (seen(gate[0], gate[1], 60)) glow(ctx, gate[0], gate[1], 60);

  // A bulb at every flag along the bunting, twinkling a little.
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = palette.bulb;
  map.bunting.forEach(([a, b], n) => {
    const p = at(a.x + 0.5, a.y + 0.5, POLE_HEIGHT - 2);
    const q = at(b.x + 0.5, b.y + 0.5, POLE_HEIGHT - 2);
    if (!buntingInView(p, q, view)) return;
    buntingLine(p, q).forEach(([x, y], i) => {
      if (!seen(x, y, 2)) return;
      ctx.globalAlpha = brightness * (Math.sin(t * 3 + i + n) > -0.6 ? 1 : 0.5);
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
}

// ── Everything else ───────────────────────────────────────────────────────

/** Draws a prop. `snow`, from 0 to 1, is how hard it's snowing, under the Christmas skin. */
export function drawProp(ctx: Ctx, prop: Prop, t: number, snow = 0) {
  switch (prop.kind) {
    case 'big-top':
      return NORTH_POLE ? workshopHall(ctx, prop, t) : bigTop(ctx, prop, t);
    case 'round-tent': {
      if (NORTH_POLE) return gingerbreadHouse(ctx, prop);
      const colors = TENT_COLORS[prop.variant % TENT_COLORS.length];
      return roundTent(
        ctx,
        prop.x + prop.w / 2,
        prop.y + prop.h / 2,
        1.55,
        30,
        34,
        colors,
        t,
        prop.variant % 2 ? palette.blue : palette.gold,
      );
    }
    case 'peaked-tent':
      return peakedTent(ctx, prop, t);
    case 'ferris-wheel':
      return ferrisWheel(ctx, prop, t);
    case 'carousel':
      return NORTH_POLE ? christmasTree(ctx, prop, t) : carousel(ctx, prop, t);
    case 'wagon':
      return NORTH_POLE ? sled(ctx, prop) : wagon(ctx, prop);
    case 'cart':
      return cart(ctx, prop, t);
    case 'ticket-booth':
      return NORTH_POLE ? postOffice(ctx, prop) : ticketBooth(ctx, prop);
    case 'bench':
      return bench(ctx, prop);
    case 'planter':
      return planter(ctx, prop);
    case 'balloons':
      return balloons(ctx, prop, t, snow);
    case 'bunting-pole':
      return buntingPole(ctx, prop);
    case 'billboard':
      return billboard(ctx, prop, t);
    case 'santa':
      return santa(ctx, prop, t);
  }
}

export function drawBooth(ctx: Ctx, slot: BoothSlot, name: string, t: number, glow: boolean) {
  booth(ctx, slot, name, t, glow);
}

/** A rounded callout with a line of text, pointing down at a screen point. */
export function label(ctx: Ctx, text: string, x: number, y: number) {
  const { colors, radius } = theme;
  ctx.font = canvasFont('small', 'bold');
  const width = ctx.measureText(text).width + 22;
  const height = theme.font.small + 14;
  ctx.fillStyle = colors.background;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, Math.min(radius, height / 2));
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, y + height / 2);
  ctx.lineTo(x + 6, y + height / 2);
  ctx.lineTo(x, y + height / 2 + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}
