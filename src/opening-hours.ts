import {
  currentSkin,
  formatCarnivalTime,
  isOpen,
  partOfDay,
  type CarnivalTime,
  type SkinId,
} from './carnival';

/** Where the carnival is in its day, as far as starting a game goes. */
export type OpeningState = 'open' | 'closing-soon' | 'closed';

export const OPENS_AT = '06:00';
export const CLOSES_AT = '02:00';

/** The last carnival hour before closing: 01:00 to 02:00. */
const CLOSING_SOON_HOUR = 1;

/** Open, in the last hour before closing, or closed (02:00 to 06:00). */
export function openingState(time: CarnivalTime): OpeningState {
  if (!isOpen(time)) return 'closed';
  return time.hours === CLOSING_SOON_HOUR ? 'closing-soon' : 'open';
}

/** A new game can start whenever the carnival is open. A round already running is never stopped. */
export function canStartGame(time: CarnivalTime): boolean {
  return openingState(time) !== 'closed';
}

/** The midway clock's label, like `08:45 · Midday` or `03:10 · Closed`. */
export function clockLabel(time: CarnivalTime): string {
  const part = partOfDay(time);
  return `${formatCarnivalTime(time)} · ${part[0].toUpperCase()}${part.slice(1)}`;
}

/** The message shown when someone tries to start a game while closed, in the skin's words. */
export function closedMessage(skin: SkinId = currentSkin()): string {
  return skin === 'christmas'
    ? `The workshop is closed. The elves are asleep until ${OPENS_AT}.`
    : `The carnival is closed. It opens at ${OPENS_AT}.`;
}

/** The line a booth card shows about opening hours, or nothing while the carnival is simply open. */
export function boothHoursNote(state: OpeningState, skin: SkinId = currentSkin()): string {
  const christmas = skin === 'christmas';
  if (state === 'closed') {
    return christmas ? `Closed · the elves wake at ${OPENS_AT}` : `Closed · opens at ${OPENS_AT}`;
  }
  if (state === 'closing-soon') {
    return christmas ? `The elves stop at ${CLOSES_AT}` : `Closing at ${CLOSES_AT}`;
  }
  return '';
}
