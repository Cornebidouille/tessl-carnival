import { theme, type PartOfDay } from '../carnival';

const { colors } = theme;

/**
 * The midway map's daytime palette. Tent reds, creams and golds come from the
 * carnival theme; the sky, grass, paths and other scenery shades only the map
 * uses live here.
 */
export const palette = {
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
  bunting: [colors.stripeA, colors.accent, '#2b8ccc', colors.stripeB],
  balloons: [colors.stripeA, colors.accent, '#2b8ccc', colors.water, '#f59ac0'],
} as const;

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

const NIGHT_SKY = {
  skyTop: '#05061a',
  skyMiddle: '#0e1442',
  skyHorizon: '#24306e',
  cloud: '#3a4374',
  cloudShade: '#2a3160',
  haze: '#26345e',
  light: colors.background,
  stars: 1,
} as const;

/** The look of each part of the day. Midday is the sunny day the midway always had. */
export const dayLooks: Record<PartOfDay, DayLook> = {
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
  night: { ...NIGHT_SKY, lightAmount: 0.38, lights: 1 },
  closed: { ...NIGHT_SKY, lightAmount: 0.42, lights: 0 },
};
