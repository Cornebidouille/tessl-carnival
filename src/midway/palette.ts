import { currentSkin, skins, type PartOfDay, type SkinId, type Theme } from '../carnival';

type Colors = Theme['colors'];

/**
 * The midway map's daytime palette under the carnival skin. Tent reds, creams
 * and golds come from the theme; the sky, grass, paths and other scenery shades
 * only the map uses live here.
 */
function carnivalPalette(colors: Colors) {
  return {
    sky: '#38b4e6',
    skyHigh: '#1f9bd6',
    cloud: '#bfeafc',
    cloudShade: '#94d8f4',
    haze: '#5fc3b8',

    grass: '#a5c43a',
    grassDark: '#8aab2a',
    grassEdge: '#7a9a22',
    grassLight: '#b6d24c',
    path: '#f3e28e',
    pathShade: '#e2cd70',
    hedge: '#6f9a2c',
    hedgeDark: '#5a8122',
    hedgeLight: '#86b236',
    shadow: 'rgba(60, 90, 10, 0.28)',

    red: colors.stripeA,
    redShade: '#b8283a',
    cream: colors.stripeB,
    creamShade: '#e3d9c2',
    gold: colors.accent,
    goldShade: '#e0a91c',
    blue: '#2b8ccc',
    blueShade: '#1f6aa0',
    sky2: colors.water,
    pink: '#f59ac0',
    pinkShade: '#e076a4',
    wood: colors.wood,
    woodDark: '#6b4429',
    woodLight: '#b7834f',
    board: '#c8955b',
    metal: '#e9e4f2',
    metalShade: '#b9b0cc',
    ink: colors.background,
    opening: '#4a2a28',
    closed: '#a99cc4',
    closedShade: '#8a7daa',
    white: '#ffffff',
    /** Booth, tent and ride lights after dark, and the edge of their glow. */
    glow: '#ffd27a',
    glowEdge: 'rgba(255, 210, 122, 0)',
    bulb: colors.accent,
    star: colors.text,

    skins: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'],
    hairs: ['#3b2219', '#1b1035', '#a55728', '#e6c35c', '#6b4429'],
    shirts: [colors.water, '#7bd389', '#b48ee0', colors.danger, '#2b8ccc', colors.stripeB],
    pants: ['#2d3a6b', '#3b2a4f', '#5a4a3a'],
    /** Elves' tunics and hats, shoes and belts, and Santa's boots and belt. */
    tunics: [colors.stripeA, '#2e8b57', colors.accent, '#1f6b3a', '#b8283a'],
    elfHats: ['#2e8b57', colors.stripeA, colors.accent, '#1f6b3a'],
    elfShoe: '#5a3620',
    belt: '#1a1414',
    /** Snow on roofs and the gingerbread and icing of the North Pole's houses. */
    snow: '#ffffff',
    snowShade: '#dfe8f0',
    gingerbread: '#b5713a',
    gingerbreadShade: '#8f5428',
    bunting: [colors.stripeA, colors.accent, '#2b8ccc', colors.stripeB],
    balloons: [colors.stripeA, colors.accent, '#2b8ccc', colors.water, '#f59ac0'],
  };
}

/** The scenery colours the map draws with. Every skin fills in the same keys. */
export type Palette = ReturnType<typeof carnivalPalette>;

/**
 * The North Pole under the Christmas skin: snow where the grass was, icy paths,
 * pine hedges and a crisp pale winter sky.
 */
function christmasPalette(colors: Colors): Palette {
  return {
    sky: '#cfe9f7',
    skyHigh: '#8cc4e8',
    cloud: '#ffffff',
    cloudShade: '#d8e8f4',
    haze: '#dceaf5',

    grass: '#eef5fb',
    grassDark: '#d6e5f1',
    grassEdge: '#b9cfe2',
    grassLight: '#ffffff',
    path: '#bcd9ea',
    pathShade: '#9cc1d9',
    hedge: '#1f5a3a',
    hedgeDark: '#15422a',
    hedgeLight: '#2d7348',
    shadow: 'rgba(40, 70, 120, 0.22)',

    red: colors.stripeA,
    redShade: '#9a0c24',
    cream: colors.stripeB,
    creamShade: '#d6e2ee',
    gold: colors.accent,
    goldShade: '#cf9f2e',
    blue: '#2b6cb0',
    blueShade: '#1d4f86',
    sky2: colors.water,
    pink: '#f59ac0',
    pinkShade: '#e076a4',
    wood: colors.wood,
    woodDark: '#5a3620',
    woodLight: '#a8724a',
    board: '#b8875a',
    metal: '#e9eef6',
    metalShade: '#b3c0d4',
    ink: colors.background,
    opening: '#4a2a28',
    closed: '#9fb0cc',
    closedShade: '#7f92b2',
    white: '#ffffff',
    /** Booth, tent and ride lights after dark, and the edge of their glow. */
    glow: '#ffd27a',
    glowEdge: 'rgba(255, 210, 122, 0)',
    bulb: colors.accent,
    star: colors.text,

    skins: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69', '#ffdbac'],
    hairs: ['#3b2219', '#1b1035', '#a55728', '#e6c35c', '#6b4429'],
    shirts: [colors.danger, '#1f7a4a', colors.water, colors.stripeB, '#2b6cb0', colors.accent],
    pants: ['#1e2a4a', '#3b2a4f', '#4a3a2e'],
    /** Elves' tunics and hats, shoes and belts, and Santa's boots and belt. */
    tunics: [colors.stripeA, '#1f7a4a', colors.accent, '#145c36', '#9a0c24'],
    elfHats: ['#1f7a4a', colors.stripeA, colors.accent, '#145c36'],
    elfShoe: '#5a3620',
    belt: '#141018',
    /** Snow on roofs and the gingerbread and icing of the North Pole's houses. */
    snow: '#ffffff',
    snowShade: '#d6e5f1',
    gingerbread: '#b5713a',
    gingerbreadShade: '#8f5428',
    bunting: [colors.stripeA, '#1f7a4a', colors.accent, colors.stripeB],
    balloons: [colors.stripeA, '#1f7a4a', colors.accent, colors.water, colors.stripeB],
  };
}

/** The midway's scenery colours for a skin. */
export function paletteFor(skin: SkinId): Palette {
  const colors = skins[skin].colors;
  return skin === 'christmas' ? christmasPalette(colors) : carnivalPalette(colors);
}

/** The scenery colours for the skin the page loaded with. */
export const palette: Palette = paletteFor(currentSkin());

/** How the sky and the light look at one moment of the carnival day. */
export interface DayLook {
  /** The sky at the top of its gradient, partway down, and at the horizon. */
  skyTop: string;
  skyMiddle: string;
  skyHorizon: string;
  cloud: string;
  cloudShade: string;
  /** The strip of far field along the horizon. */
  haze: string;
  /** The colour the light washes the scenery with, and how strongly, from 0 to 1. */
  light: string;
  lightAmount: number;
  /** How bright the booth, tent and ride lights are, from 0 (off) to 1. */
  lights: number;
  /** How bright the stars are, from 0 to 1. */
  stars: number;
}

/** The night sky under the carnival skin. */
function carnivalNight(colors: Colors) {
  return {
    skyTop: '#05061a',
    skyMiddle: '#0e1442',
    skyHorizon: '#24306e',
    cloud: '#3a4374',
    cloudShade: '#2a3160',
    haze: '#26345e',
    light: colors.background,
    stars: 1,
  };
}

/**
 * The look of each part of the day under the carnival skin. Midday is the sunny
 * day the midway always had.
 */
function carnivalDayLooks(colors: Colors, palette: Palette): Record<PartOfDay, DayLook> {
  const nightSky = carnivalNight(colors);
  return {
    dawn: {
      skyTop: '#a6d6ef',
      skyMiddle: '#f5b5c9',
      skyHorizon: '#ffcf9e',
      cloud: '#ffe3d8',
      cloudShade: '#f2b8b4',
      haze: '#e3b496',
      light: '#ff9a76',
      lightAmount: 0.14,
      lights: 0,
      stars: 0,
    },
    midday: {
      skyTop: palette.skyHigh,
      skyMiddle: '#2da9df',
      skyHorizon: palette.sky,
      cloud: palette.cloud,
      cloudShade: palette.cloudShade,
      haze: palette.haze,
      light: colors.accent,
      lightAmount: 0,
      lights: 0,
      stars: 0,
    },
    afternoon: {
      skyTop: '#125fa3',
      skyMiddle: '#1f84c4',
      skyHorizon: '#5aa9d0',
      cloud: '#fff1c8',
      cloudShade: '#efd38c',
      haze: '#9fbf6e',
      light: colors.accent,
      lightAmount: 0.16,
      lights: 0,
      stars: 0,
    },
    evening: {
      skyTop: '#4a2a7c',
      skyMiddle: '#d8608f',
      skyHorizon: '#ff8a40',
      cloud: '#f7a88a',
      cloudShade: '#c76f8a',
      haze: '#c46a5a',
      light: '#e8603c',
      lightAmount: 0.2,
      lights: 0.8,
      stars: 0,
    },
    night: { ...nightSky, lightAmount: 0.38, lights: 1 },
    closed: { ...nightSky, lightAmount: 0.42, lights: 0 },
  };
}

/**
 * The look of each part of the day under the Christmas skin: a crisp pale
 * winter day, and the carnival's night sky with a faint aurora of green and
 * violet once it is dark.
 */
function christmasDayLooks(colors: Colors, palette: Palette): Record<PartOfDay, DayLook> {
  const carnival = carnivalDayLooks(colors, palette);
  const nightSky = {
    ...carnivalNight(colors),
    skyMiddle: '#0d3a40',
    skyHorizon: '#33296e',
    haze: '#2a2f62',
  };
  return {
    ...carnival,
    dawn: { ...carnival.dawn, haze: '#e6d3d8' },
    midday: { ...carnival.midday, skyMiddle: '#a9d6f1' },
    afternoon: { ...carnival.afternoon, haze: '#c9dcea' },
    evening: { ...carnival.evening, haze: '#b88aa6' },
    night: { ...carnival.night, ...nightSky },
    closed: { ...carnival.closed, ...nightSky },
  };
}

/** How the sky and the light look through the day under a skin. */
export function dayLooksFor(skin: SkinId): Record<PartOfDay, DayLook> {
  const colors = skins[skin].colors;
  const looks = skin === 'christmas' ? christmasDayLooks : carnivalDayLooks;
  return looks(colors, paletteFor(skin));
}

/** The look of each part of the day, for the skin the page loaded with. */
export const dayLooks: Record<PartOfDay, DayLook> = dayLooksFor(currentSkin());
