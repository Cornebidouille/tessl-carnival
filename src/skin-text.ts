import type { SkinId } from './carnival';

/** The words on the page around the map, for one skin. */
export interface SkinText {
  /** The header brand and the document title. */
  brand: string;
  /** The page's favicon, a single emoji. */
  favicon: string;
  /** The heading of the list of booths in the corner. */
  boothsHeading: string;
  /** The booth card's heading for a booth with no game yet. */
  comingSoon: string;
  /** The booth card's line for a booth with no game yet. */
  emptyBooth: string;
  /** The link from a game back to the map. */
  backLink: string;
  /** What the map's canvas is called for screen readers. */
  mapLabel: string;
  /** The skin switch's text while this skin shows: it names the other skin. */
  switchText: string;
  /** The skin switch's accessible label while this skin shows. */
  switchLabel: string;
}

export const skinText: Readonly<Record<SkinId, SkinText>> = {
  carnival: {
    brand: 'Tessl Carnival',
    favicon: '🎪',
    boothsHeading: 'Booths',
    comingSoon: 'Coming soon',
    emptyBooth: 'This booth is waiting for a game. Build one and it opens here.',
    backLink: '← Back to the midway',
    mapLabel: 'The carnival midway. Walk up to a booth to play its game.',
    switchText: '🎄 Christmas',
    switchLabel: 'Switch to the Christmas skin',
  },
  christmas: {
    brand: 'Tessl North Pole',
    favicon: '🎅',
    boothsHeading: 'Workbenches',
    comingSoon: 'Coming soon',
    emptyBooth: 'This workbench is waiting for a toy. Build one and it opens here.',
    backLink: '← Back to the workshop',
    mapLabel: "Santa's workshop. Walk up to a booth to play its game.",
    switchText: '🎪 Carnival',
    switchLabel: 'Switch to the carnival skin',
  },
};

/** The skin the switch changes to from `skin`. */
export function otherSkin(skin: SkinId): SkinId {
  return skin === 'christmas' ? 'carnival' : 'christmas';
}

/** An SVG data URL that shows `emoji` as a favicon, the way `index.html` does. */
export function faviconHref(emoji: string): string {
  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}
