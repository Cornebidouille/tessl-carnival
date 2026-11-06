import { describe, expect, it } from 'vitest';
import { faviconHref, otherSkin, skinText } from './skin-text';

describe('skinText', () => {
  it('keeps the carnival wording as it was', () => {
    expect(skinText.carnival).toEqual({
      brand: 'Tessl Carnival',
      favicon: '🎪',
      boothsHeading: 'Booths',
      comingSoon: 'Coming soon',
      emptyBooth: 'This booth is waiting for a game. Build one and it opens here.',
      backLink: '← Back to the midway',
      mapLabel: 'The carnival midway. Walk up to a booth to play its game.',
      switchText: '🎄 Christmas',
      switchLabel: 'Switch to the Christmas skin',
    });
  });

  it("talks like Santa's workshop under Christmas", () => {
    const text = skinText.christmas;
    expect(text.brand).toBe('Tessl North Pole');
    expect(text.favicon).toBe('🎅');
    expect(text.boothsHeading).toBe('Workbenches');
    expect(text.comingSoon).toBe('Coming soon');
    expect(text.emptyBooth).toBe(
      'This workbench is waiting for a toy. Build one and it opens here.',
    );
    expect(text.backLink).toBe('← Back to the workshop');
    expect(text.mapLabel).toMatch(/^Santa's workshop\./);
    expect(text.switchText).toBe('🎪 Carnival');
  });
});

describe('otherSkin', () => {
  it('flips between the two skins', () => {
    expect(otherSkin('christmas')).toBe('carnival');
    expect(otherSkin('carnival')).toBe('christmas');
  });
});

describe('faviconHref', () => {
  it('draws the emoji in an SVG data URL', () => {
    const href = faviconHref('🎅');
    expect(href.startsWith('data:image/svg+xml,')).toBe(true);
    expect(href).toContain('>🎅</text>');
  });
});
