import { currentSkin, type SkinId } from './skin';

/** The shape every skin fills in: the same keys, each skin's own values. */
export interface Theme {
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    danger: string;
    stripeA: string;
    stripeB: string;
    water: string;
    wood: string;
  };
  font: {
    family: string;
    small: number;
    body: number;
    title: number;
  };
  radius: number;
  canvas: {
    width: number;
    height: number;
  };
}

/** The original carnival look: a purple night, tent stripes and gold. */
const carnival: Theme = {
  colors: {
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
  },
  font: {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    small: 14,
    body: 18,
    title: 32,
  },
  radius: 12,
  canvas: {
    width: 800,
    height: 500,
  },
};

/** The North Pole workshop: a deep night blue, snow, Santa red, pine and gold. */
const christmas: Theme = {
  colors: {
    background: '#0b1a3a',
    surface: '#15295a',
    text: '#f7fbff',
    muted: '#a9bfdc',
    accent: '#f2c14e',
    danger: '#d62839',
    stripeA: '#c8102e',
    stripeB: '#f7fbff',
    water: '#a8dcf0',
    wood: '#7a4a2a',
  },
  font: {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    small: 14,
    body: 18,
    title: 32,
  },
  radius: 12,
  canvas: {
    width: 800,
    height: 500,
  },
};

export const skins: Readonly<Record<SkinId, Theme>> = { carnival, christmas };

/**
 * The carnival's colours, fonts and sizes, for the skin the page loaded with.
 * Games draw with these rather than their own values, so every booth on the
 * midway looks like it belongs.
 */
export const theme: Theme = skins[currentSkin()];

/** Canvas font string, e.g. canvasFont('title') → 'bold 32px "Trebuchet MS", …'. */
export function canvasFont(
  size: 'small' | 'body' | 'title',
  weight: 'normal' | 'bold' = 'normal',
  skin: Theme = theme,
) {
  return `${weight} ${skin.font[size]}px ${skin.font.family}`;
}

/** Exposes the theme to CSS as custom properties, e.g. --color-accent. */
export function applyTheme(
  root: { style: Pick<CSSStyleDeclaration, 'setProperty'> } = document.documentElement,
  skin: Theme = theme,
) {
  for (const [name, value] of Object.entries(skin.colors)) {
    root.style.setProperty(`--color-${name}`, value);
  }
  root.style.setProperty('--font-family', skin.font.family);
  root.style.setProperty('--radius', `${skin.radius}px`);
}
