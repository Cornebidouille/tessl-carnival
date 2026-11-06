import { describe, expect, it } from 'vitest';
import { carnivalLink, shareLinks } from './share';

describe('carnivalLink', () => {
  it('shares the carnival page without the game route or query', () => {
    expect(carnivalLink('https://ada.github.io/tessl-carnival/?x=1#/play/water-cannon')).toBe(
      'https://ada.github.io/tessl-carnival/',
    );
  });

  it('has nothing to share on a local or preview server', () => {
    expect(carnivalLink('http://localhost:5173/')).toBeUndefined();
    expect(carnivalLink('https://127.0.0.1:5173/')).toBeUndefined();
    expect(carnivalLink('https://ada-carnival-5173.app.github.dev/')).toBeUndefined();
  });
});

describe('shareLinks', () => {
  it('puts the carnival link in the LinkedIn post', () => {
    const links = shareLinks('https://ada.github.io/tessl-carnival/');
    expect(Object.keys(links)).toEqual(['linkedIn']);
    const linkedIn = new URL(links.linkedIn);
    expect(linkedIn.hostname).toBe('www.linkedin.com');
    expect(linkedIn.searchParams.get('url')).toBe('https://ada.github.io/tessl-carnival/');
  });
});
