import { describe, expect, it } from 'vitest';
import type { CarnivalTime } from '../carnival';
import { blendLooks, dayLookAt, mixColor } from './daylight';
import { dayLooks, palette } from './palette';

function at(label: string): CarnivalTime {
  const [hours, minutes] = label.split(':').map(Number);
  return { hours, minutes };
}

/** How bright a `#rrggbb` colour is, from 0 to 255. */
function brightness(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

describe('mixColor', () => {
  it('gives either end at 0 and 1, and the halfway colour between', () => {
    expect(mixColor('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColor('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixColor('#102030', '#305070', 0.5)).toBe('#203850');
  });
});

describe('dayLookAt', () => {
  it('keeps the sunny day the midway always had at midday', () => {
    const look = dayLookAt(at('10:00'));
    expect(look.skyTop).toBe(palette.skyHigh);
    expect(look.skyHorizon).toBe(palette.sky);
    expect(look.cloud).toBe(palette.cloud);
    expect(look.lightAmount).toBe(0);
    expect(look.lights).toBe(0);
  });

  it('gives dawn a pink and peach horizon under a pale blue top, with a warm light', () => {
    const look = dayLookAt(at('06:00'));
    expect(look).toEqual(dayLooks.dawn);
    expect(look.skyHorizon).not.toBe(dayLooks.midday.skyHorizon);
    expect(brightness(look.skyTop)).toBeGreaterThan(brightness(dayLooks.midday.skyTop));
    expect(look.lightAmount).toBeGreaterThan(0);
    expect(look.lights).toBe(0);
  });

  it('gives the afternoon a deeper blue and a golden light', () => {
    const look = dayLookAt(at('13:00'));
    expect(look).toEqual(dayLooks.afternoon);
    expect(brightness(look.skyTop)).toBeLessThan(brightness(dayLooks.midday.skyTop));
    expect(look.light).toBe(palette.gold);
    expect(look.lightAmount).toBeGreaterThan(0);
  });

  it('gives the evening a sunset sky and turns the lights on', () => {
    const look = dayLookAt(at('17:00'));
    expect(look).toEqual(dayLooks.evening);
    expect(brightness(look.skyHorizon)).toBeGreaterThan(brightness(look.skyTop));
    expect(look.lights).toBeGreaterThan(0);
    expect(look.stars).toBe(0);
  });

  it('gives the night a dark starry sky with every light on', () => {
    const look = dayLookAt(at('21:00'));
    expect(look).toEqual(dayLooks.night);
    expect(brightness(look.skyTop)).toBeLessThan(30);
    expect(look.stars).toBe(1);
    expect(look.lights).toBe(1);
  });

  it('keeps the night sky while closed, with the lights off', () => {
    const look = dayLookAt(at('03:00'));
    expect(look).toEqual(dayLooks.closed);
    expect(look.skyTop).toBe(dayLooks.night.skyTop);
    expect(look.lights).toBe(0);
  });

  it('gives each of the six parts of the day its own look', () => {
    const looks = ['06:00', '10:00', '13:00', '17:00', '21:00', '03:00'].map((t) =>
      JSON.stringify(dayLookAt(at(t))),
    );
    expect(new Set(looks).size).toBe(6);
  });

  it('never darkens the scenery so far that people and paths get lost', () => {
    for (const look of Object.values(dayLooks)) expect(look.lightAmount).toBeLessThanOrEqual(0.5);
  });

  it('blends into the next part over the hour before it starts', () => {
    expect(dayLookAt(at('15:00'))).toEqual(dayLooks.afternoon);
    expect(dayLookAt(at('15:30'))).toEqual(blendLooks(dayLooks.afternoon, dayLooks.evening, 0.5));
    expect(dayLookAt(at('16:00'))).toEqual(dayLooks.evening);
  });

  it('moves a little every carnival minute while it blends', () => {
    const halfway = dayLookAt(at('18:30'));
    expect(halfway.skyTop).toBe(mixColor(dayLooks.evening.skyTop, dayLooks.night.skyTop, 0.5));
    expect(halfway.lights).toBeCloseTo(0.9);
    const steps = [0, 15, 30, 45].map((m) =>
      brightness(dayLookAt({ hours: 18, minutes: m }).skyTop),
    );
    expect(steps).toEqual([...steps].sort((a, b) => b - a));
    expect(new Set(steps).size).toBe(4);
  });

  it('fades the lights off in the hour before the carnival closes', () => {
    expect(dayLookAt(at('00:30')).lights).toBe(1);
    expect(dayLookAt(at('01:30')).lights).toBeCloseTo(0.5);
    expect(dayLookAt(at('02:00')).lights).toBe(0);
  });
});
