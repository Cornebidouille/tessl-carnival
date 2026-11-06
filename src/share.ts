/** The original carnival, where anyone can fork their own. */
export const REPO_URL = 'https://github.com/tesslio/tessl-carnival';

/**
 * The address to share for the carnival at `href`: the page itself, without
 * the game route or query. Returns undefined where a link would be no use to
 * anyone else, such as a local dev server or a Codespaces preview.
 */
export function carnivalLink(href: string): string | undefined {
  const url = new URL(href);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const preview = url.hostname.endsWith('.app.github.dev');
  if (url.protocol !== 'https:' || local || preview) return undefined;
  return `${url.origin}${url.pathname}`;
}

/** A prefilled post that shares a carnival's link on LinkedIn. */
export function shareLinks(link: string) {
  return {
    linkedIn: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: link })}`,
  };
}
