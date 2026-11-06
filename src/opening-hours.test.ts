import { describe, expect, it } from 'vitest';
import type { CarnivalTime } from './carnival';
import {
  boothHoursNote,
  canStartGame,
  clockLabel,
  closedMessage,
  openingState,
} from './opening-hours';

function at(label: string): CarnivalTime {
  const [hours, minutes] = label.split(':').map(Number);
  return { hours, minutes };
}

describe('openingState', () => {
  it('is open through the day and the evening', () => {
    for (const label of ['06:00', '08:45', '12:00', '19:30', '23:59', '00:59']) {
      expect(openingState(at(label))).toBe('open');
    }
  });

  it('is closing soon in the last hour before 02:00', () => {
    expect(openingState(at('01:00'))).toBe('closing-soon');
    expect(openingState(at('01:59'))).toBe('closing-soon');
  });

  it('is closed from 02:00 until 06:00', () => {
    for (const label of ['02:00', '03:10', '05:59']) {
      expect(openingState(at(label))).toBe('closed');
    }
  });
});

describe('canStartGame', () => {
  it('lets games start while open and in the last hour', () => {
    expect(canStartGame(at('08:00'))).toBe(true);
    expect(canStartGame(at('01:59'))).toBe(true);
  });

  it('stops games starting from 02:00', () => {
    expect(canStartGame(at('02:00'))).toBe(false);
    expect(canStartGame(at('05:59'))).toBe(false);
  });

  it('lets games start again at 06:00', () => {
    expect(canStartGame(at('06:00'))).toBe(true);
  });
});

describe('clockLabel', () => {
  it('shows the time and the part of the day', () => {
    expect(clockLabel(at('08:45'))).toBe('08:45 · Midday');
    expect(clockLabel(at('03:10'))).toBe('03:10 · Closed');
    expect(clockLabel(at('00:05'))).toBe('00:05 · Night');
  });
});

describe('boothHoursNote', () => {
  it.each(['carnival', 'christmas'] as const)(
    'says nothing while open, with the %s skin',
    (skin) => {
      expect(boothHoursNote('open', skin)).toBe('');
    },
  );

  it('warns of closing in the last hour', () => {
    expect(boothHoursNote('closing-soon', 'carnival')).toBe('Closing at 02:00');
    expect(boothHoursNote('closing-soon', 'christmas')).toBe('The elves stop at 02:00');
  });

  it('says when it opens while closed', () => {
    expect(boothHoursNote('closed', 'carnival')).toBe('Closed · opens at 06:00');
    expect(boothHoursNote('closed', 'christmas')).toBe('Closed · the elves wake at 06:00');
  });

  it('follows the saved skin, Christmas by default', () => {
    expect(boothHoursNote('closed')).toBe('Closed · the elves wake at 06:00');
  });
});

describe('closedMessage', () => {
  it('names the opening time with the carnival skin', () => {
    expect(closedMessage('carnival')).toBe('The carnival is closed. It opens at 06:00.');
  });

  it('puts the elves to bed with the Christmas skin', () => {
    expect(closedMessage('christmas')).toBe(
      'The workshop is closed. The elves are asleep until 06:00.',
    );
  });

  it('follows the saved skin, Christmas by default', () => {
    expect(closedMessage()).toBe(closedMessage('christmas'));
  });
});
