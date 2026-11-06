import { describe, expect, it } from 'vitest';
import { applyTheme, canvasFont, skins, theme } from './theme';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? keysOf(child as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function fakeRoot() {
  const props = new Map<string, string>();
  return {
    props,
    root: { style: { setProperty: (name: string, value: string) => void props.set(name, value) } },
  };
}

describe('theme skins', () => {
  it('gives both skins exactly the same keys', () => {
    expect(keysOf(skins.christmas).sort()).toEqual(keysOf(skins.carnival).sort());
  });

  it('keeps the carnival skin as the original theme', () => {
    expect(skins.carnival.colors).toEqual({
      background: '#1b1035',
      surface: '#2a1a52',
      text: '#fff8e7',
      muted: '#b9a9d9',
      accent: '#ffcc33',
      danger: '#ff5a5f',
      stripeA: '#e63946',
      stripeB: '#fff8e7',
      water: '#5ec8f2',
      wood: '#8a5a3b',
    });
    expect(skins.carnival.font).toEqual({
      family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
      small: 14,
      body: 18,
      title: 32,
    });
    expect(skins.carnival.radius).toBe(12);
    expect(skins.carnival.canvas).toEqual({ width: 800, height: 500 });
  });

  it('resolves theme to the current skin, christmas by default', () => {
    expect(theme).toBe(skins.christmas);
  });

  it.each(['carnival', 'christmas'] as const)('builds canvas fonts for the %s skin', (id) => {
    const skin = skins[id];
    expect(canvasFont('title', 'bold', skin)).toBe(`bold ${skin.font.title}px ${skin.font.family}`);
    expect(canvasFont('small', 'normal', skin)).toBe(
      `normal ${skin.font.small}px ${skin.font.family}`,
    );
  });

  it.each(['carnival', 'christmas'] as const)('applies the %s skin as CSS properties', (id) => {
    const skin = skins[id];
    const { props, root } = fakeRoot();
    applyTheme(root, skin);
    for (const [name, value] of Object.entries(skin.colors)) {
      expect(props.get(`--color-${name}`)).toBe(value);
    }
    expect(props.get('--font-family')).toBe(skin.font.family);
    expect(props.get('--radius')).toBe(`${skin.radius}px`);
  });
});
