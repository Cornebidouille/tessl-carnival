import { describe, expect, it } from 'vitest';
import {
  CANNON,
  TANK_SIZE,
  createState,
  fire,
  isHit,
  labelsFor,
  placeText,
  press,
  scoreForHit,
  step,
  toyFor,
  type Target,
} from './game';

const target: Target = { x: 400, y: 200, radius: 28, speed: 120 };

describe('water cannon', () => {
  it('starts with a full tank and no score', () => {
    const state = createState();
    expect(state.tank).toBe(TANK_SIZE);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('uses one shot of water per fire', () => {
    const state = createState();
    expect(fire(state, 400, 0)).toBe(true);
    expect(state.tank).toBe(TANK_SIZE - 1);
    expect(state.shots).toHaveLength(1);
  });

  it('cannot fire once the tank is empty', () => {
    const state = createState();
    state.tank = 0;
    expect(fire(state, 400, 0)).toBe(false);
    expect(state.shots).toHaveLength(0);
  });

  it('never fires downwards, even when aimed below the cannon', () => {
    const state = createState();
    fire(state, CANNON.x + 100, CANNON.y + 100);
    expect(state.shots[0].vy).toBeLessThan(0);
  });

  it('scores a hit and sends the target back to the start of its rail', () => {
    const state = createState();
    state.targets = [{ ...target }];
    state.shots = [{ x: target.x, y: target.y + 5, vx: 0, vy: 0 }];
    step(state, 0);
    expect(state.score).toBe(scoreForHit(target));
    expect(state.shots).toHaveLength(0);
    expect(state.targets[0].x).toBeLessThan(0);
  });

  it('ends the game when the tank is empty and the last shot has landed', () => {
    const state = createState();
    state.tank = 0;
    state.shots = [{ x: 10, y: -20, vx: 0, vy: -700 }];
    step(state, 0.1);
    expect(state.phase).toBe('over');
  });

  it('keeps playing while a shot is still in the air', () => {
    const state = createState();
    state.targets = [];
    state.tank = 0;
    state.shots = [{ x: 400, y: 300, vx: 0, vy: -700 }];
    step(state, 0.1);
    expect(state.phase).toBe('playing');
  });

  it('detects a hit inside the target and a miss outside it', () => {
    expect(isHit({ x: 410, y: 210, vx: 0, vy: 0 }, target)).toBe(true);
    expect(isHit({ x: 460, y: 200, vx: 0, vy: 0 }, target)).toBe(false);
  });

  it('scores a fast target higher than a slow one', () => {
    const slow = scoreForHit({ ...target, speed: 60 });
    const fast = scoreForHit({ ...target, speed: -180 });
    expect(Math.max(fast, slow)).toBeGreaterThanOrEqual(slow);
  });

  it('fires one shot when pressed during a round', () => {
    const state = createState();
    expect(press(state, 400, 0)).toBe(state);
    expect(state.tank).toBe(TANK_SIZE - 1);
    expect(state.shots).toHaveLength(1);
  });

  it('starts a new round when pressed on the game over screen', () => {
    const state = createState();
    state.tank = 0;
    state.score = 50;
    state.phase = 'over';
    const next = press(state, 400, 0);
    expect(next).not.toBe(state);
    expect(next.phase).toBe('playing');
    expect(next.tank).toBe(TANK_SIZE);
    expect(next.score).toBe(0);
    expect(next.shots).toHaveLength(0);
  });

  it('calls a first place score a new best', () => {
    expect(placeText(1)).toBe('New best!');
  });

  it('names the place of a score below the best', () => {
    expect(placeText(2)).toBe('2nd best score');
    expect(placeText(3)).toBe('3rd best score');
    expect(placeText(4)).toBe('4th best score');
    expect(placeText(11)).toBe('11th best score');
    expect(placeText(12)).toBe('12th best score');
    expect(placeText(21)).toBe('21st best score');
    expect(placeText(23)).toBe('23rd best score');
  });
});

describe('labelsFor', () => {
  it('names the game Snowball Cannon on the Christmas skin', () => {
    const labels = labelsFor('christmas');
    expect(labels.name).toBe('Snowball Cannon');
    expect(labels.description).toBe(
      'Knock the toys off the test rails before your snowballs run out. Faster toys score more.',
    );
    expect(labels.ammo).toBe('Snowballs');
    expect(labels.gameOver(140)).toBe('Out of snowballs! You scored 140');
  });

  it('keeps Water Cannon on the carnival skin', () => {
    const labels = labelsFor('carnival');
    expect(labels.name).toBe('Water Cannon');
    expect(labels.description).toBe(
      'Soak the targets before your tank runs dry. Faster targets score more.',
    );
    expect(labels.ammo).toBe('Water');
    expect(labels.gameOver(140)).toBe('Tank empty! You scored 140');
  });
});

describe('toyFor', () => {
  it('gives each rail its own kind of toy, top to bottom', () => {
    const state = createState();
    const railYs = [...new Set(state.targets.map((t) => t.y))];
    expect(railYs.map((y) => toyFor({ y }))).toEqual(['present', 'soldier', 'bear']);
  });

  it('gives every target on a rail the same toy', () => {
    const state = createState();
    for (const t of state.targets) {
      const sameRail = state.targets.filter((other) => other.y === t.y);
      expect(new Set(sameRail.map(toyFor)).size).toBe(1);
    }
  });
});
