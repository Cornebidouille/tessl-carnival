import { partOfDay, type CarnivalTime } from '../carnival';
import { dayLooks, type DayLook } from './palette';

/** Mixes two `#rrggbb` colours: `s` of 0 gives `a`, 1 gives `b`. */
export function mixColor(a: string, b: string, s: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) {
    const value = Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * s);
    out += value.toString(16).padStart(2, '0');
  }
  return out;
}

/** Blends one look into another: `s` of 0 gives `a`, 1 gives `b`. */
export function blendLooks(a: DayLook, b: DayLook, s: number): DayLook {
  const mix = (x: number, y: number) => x + (y - x) * s;
  return {
    skyTop: mixColor(a.skyTop, b.skyTop, s),
    skyMiddle: mixColor(a.skyMiddle, b.skyMiddle, s),
    skyHorizon: mixColor(a.skyHorizon, b.skyHorizon, s),
    cloud: mixColor(a.cloud, b.cloud, s),
    cloudShade: mixColor(a.cloudShade, b.cloudShade, s),
    haze: mixColor(a.haze, b.haze, s),
    light: mixColor(a.light, b.light, s),
    lightAmount: mix(a.lightAmount, b.lightAmount),
    lights: mix(a.lights, b.lights),
    stars: mix(a.stars, b.stars),
  };
}

/**
 * How the midway looks at a carnival time. Each part of the day has its own
 * look, and the last hour of a part blends into the next one, so a part looks
 * like itself from the hour it starts.
 */
export function dayLookAt(time: CarnivalTime): DayLook {
  const now = partOfDay(time);
  const next = partOfDay({ hours: (time.hours + 1) % 24, minutes: 0 });
  if (now === next) return dayLooks[now];
  return blendLooks(dayLooks[now], dayLooks[next], time.minutes / 60);
}
