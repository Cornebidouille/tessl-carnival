import './style.css';
import {
  applyTheme,
  bestScore,
  currentCarnivalTime,
  currentSkin,
  setSkin,
  topScores,
  type CarnivalGame,
} from './carnival';
import { BOOTH_SCORE_COUNT, NO_SCORES, boothScores } from './booth-scores';
import { registry } from './games';
import { startMidway } from './midway/midway';
import type { BoothSlot } from './midway/world';
import { carnivalLink, REPO_URL, shareLinks } from './share';
import {
  boothHoursNote,
  canStartGame,
  clockLabel,
  closedMessage,
  openingState,
} from './opening-hours';
import { faviconHref, otherSkin, skinText } from './skin-text';

applyTheme();

/** The skin the page loaded with. The switch saves the other one and reloads. */
const skin = currentSkin();
const text = skinText[skin];

document.title = text.brand;
document.querySelector('.brand')!.textContent = text.brand;
document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = faviconHref(text.favicon);
const skinSwitch = document.querySelector<HTMLButtonElement>('.skin-switch')!;
skinSwitch.textContent = text.switchText;
skinSwitch.setAttribute('aria-label', text.switchLabel);
skinSwitch.addEventListener('click', () => {
  setSkin(otherSkin(skin));
  location.reload();
});

const app = document.querySelector<HTMLElement>('#app')!;
let stop: (() => void) | undefined;

/** How often the midway clock and the booth card check the carnival time. One carnival minute is about 0.2 real seconds. */
const CLOCK_TICK_MS = 200;
/** How long the closed message stays up. */
const NOTICE_MS = 4000;

function bestText(game: CarnivalGame): string {
  const best = bestScore(game.id);
  return best === undefined ? NO_SCORES : `Best: ${best}`;
}

function renderMidway(notice?: string) {
  document.body.dataset.view = 'midway';
  app.innerHTML = `
    <section class="midway">
      <p class="midway-clock" aria-label="Carnival time"></p>
      <p class="midway-notice" role="status" hidden></p>
      <canvas class="midway-map"></canvas>
      <p class="midway-help">
        <kbd>WASD</kbd> or <kbd>arrows</kbd> to walk, or click where you want to go.
        <kbd>E</kbd> to play.
      </p>
      <p class="midway-credit">
        Built with
        <a href="https://tessl.io/?utm_source=carnival&amp;utm_medium=midway-credit&amp;utm_campaign=tessl-carnival" target="_blank" rel="noopener">Tessl</a>
        at
        <a href="https://luma.com/aidevcon-ldn2027?utm_source=carnival&amp;utm_medium=midway-credit&amp;utm_campaign=tessl-carnival" target="_blank" rel="noopener">AI DevCon London</a>
        <span class="midway-links">
          <a href="${REPO_URL}" target="_blank" rel="noopener">Build your own</a>
          <span class="midway-share" hidden>
            · Share on
            <a class="share-linkedin" target="_blank" rel="noopener">LinkedIn</a>
          </span>
        </span>
      </p>
      <nav class="midway-guide">
        <h2></h2>
        <ul></ul>
      </nav>
      <div class="booth-card" aria-live="polite" hidden>
        <h2></h2>
        <p class="description"></p>
        <p class="best"></p>
        <ol class="top-scores"></ol>
        <a class="play">Play</a>
        <p class="hours"></p>
      </div>
    </section>`;

  app.querySelector('.midway-map')!.setAttribute('aria-label', text.mapLabel);
  const guideNav = app.querySelector('.midway-guide')!;
  guideNav.setAttribute('aria-label', text.boothsHeading);
  guideNav.querySelector('h2')!.textContent = text.boothsHeading;

  const link = carnivalLink(location.href);
  if (link) {
    const share = shareLinks(link);
    app.querySelector<HTMLAnchorElement>('.share-linkedin')!.href = share.linkedIn;
    app.querySelector<HTMLElement>('.midway-share')!.hidden = false;
  }

  const guide = app.querySelector('.midway-guide ul')!;
  for (const game of registry.all()) {
    const item = document.createElement('li');
    item.innerHTML = `<a href="#/play/${game.id}"><span class="name"></span> <span class="best"></span></a>`;
    item.querySelector('.name')!.textContent = game.name;
    item.querySelector('.best')!.textContent = bestText(game);
    guide.append(item);
  }

  const noticeEl = app.querySelector<HTMLElement>('.midway-notice')!;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  const showNotice = (text: string) => {
    noticeEl.textContent = text;
    noticeEl.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (noticeEl.hidden = true), NOTICE_MS);
  };
  if (notice) showNotice(notice);

  // While closed, the booth links stay on the midway instead of starting a game.
  guide.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('a') || canStartGame(currentCarnivalTime())) return;
    event.preventDefault();
    showNotice(closedMessage(skin));
  });

  const card = app.querySelector<HTMLElement>('.booth-card')!;
  let reached: BoothSlot | undefined;
  let state = openingState(currentCarnivalTime());
  const showBooth = (booth: BoothSlot | undefined) => {
    reached = booth;
    const game = booth?.gameId ? registry.get(booth.gameId) : undefined;
    card.hidden = booth === undefined;
    card.classList.toggle('closed', booth !== undefined && !game);
    card.querySelector('h2')!.textContent = game?.name ?? text.comingSoon;
    card.querySelector('.description')!.textContent = game?.description ?? text.emptyBooth;
    const { heading, scores } = game
      ? boothScores(topScores(game.id, BOOTH_SCORE_COUNT))
      : { heading: '', scores: [] };
    card.querySelector('.best')!.textContent = heading;
    card.querySelector('.top-scores')!.replaceChildren(
      ...scores.map((score) => {
        const item = document.createElement('li');
        item.textContent = String(score);
        return item;
      }),
    );
    const link = card.querySelector<HTMLAnchorElement>('.play')!;
    link.hidden = !game || state === 'closed';
    if (game) link.href = `#/play/${game.id}`;
    card.querySelector('.hours')!.textContent = game ? boothHoursNote(state, skin) : '';
  };

  const clock = app.querySelector<HTMLElement>('.midway-clock')!;
  const tick = () => {
    const time = currentCarnivalTime();
    clock.textContent = clockLabel(time);
    const next = openingState(time);
    if (next !== state) {
      state = next;
      showBooth(reached);
    }
  };
  tick();
  const clockTimer = setInterval(tick, CLOCK_TICK_MS);

  const midway = startMidway(app.querySelector('canvas')!, {
    games: registry.all(),
    onPlay: (gameId) => {
      if (canStartGame(currentCarnivalTime())) location.hash = `#/play/${gameId}`;
    },
    onReach: showBooth,
  });
  stop = () => {
    midway.stop();
    clearInterval(clockTimer);
    clearTimeout(noticeTimer);
  };
}

function renderGame(game: CarnivalGame) {
  document.body.dataset.view = 'game';
  app.innerHTML = `
    <section class="game">
      <div class="game-header">
        <a href="#/"></a>
        <h1></h1>
      </div>
      <canvas></canvas>
    </section>`;
  app.querySelector('.game-header a')!.textContent = text.backLink;
  app.querySelector('h1')!.textContent = game.name;
  stop = game.start(app.querySelector('canvas')!);
}

function route() {
  stop?.();
  stop = undefined;

  const match = location.hash.match(/^#\/play\/([\w-]+)$/);
  const game = match ? registry.get(match[1]) : undefined;
  if (!game) renderMidway();
  else if (canStartGame(currentCarnivalTime())) renderGame(game);
  else {
    // A game's link opened while closed goes back to the midway. A round already running is left to finish.
    history.replaceState(null, '', '#/');
    renderMidway(closedMessage(skin));
  }
}

window.addEventListener('hashchange', route);
route();
