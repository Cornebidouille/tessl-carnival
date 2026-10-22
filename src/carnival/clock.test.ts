import { describe, expect, it } from 'vitest';
import {
  carnivalTimeAt,
  currentCarnivalTime,
  formatCarnivalTime,
  isOpen,
  partOfDay,
  startHourFrom,
  type CarnivalTime,
  type PartOfDay,
} from './clock';

const FIVE_MINUTES = 5 * 60 * 1000;
const CARNIVAL_HOUR = 12_500;

function at(label: string): CarnivalTime {
  const [hours, minutes] = label.split(':').map(Number);
  return { hours, minutes };
}

describe('carnivalTimeAt', () => {
  it('starts at the start hour', () => {
    expect(carnivalTimeAt(0, 8)).toEqual(at('08:00'));
  });

  it('runs one carnival hour every 12.5 real seconds', () => {
    expect(carnivalTimeAt(CARNIVAL_HOUR, 8)).toEqual(at('09:00'));
    expect(carnivalTimeAt(CARNIVAL_HOUR * 0.75, 8)).toEqual(at('08:45'));
  });

  it('lasts exactly one carnival day in 5 real minutes and wraps back to the start hour', () => {
    expect(carnivalTimeAt(FIVE_MINUTES - 1, 8)).toEqual(at('07:59'));
    expect(carnivalTimeAt(FIVE_MINUTES, 8)).toEqual(at('08:00'));
    expect(carnivalTimeAt(FIVE_MINUTES * 3, 1)).toEqual(at('01:00'));
  });

  it('wraps past midnight', () => {
    expect(carnivalTimeAt(CARNIVAL_HOUR, 23)).toEqual(at('00:00'));
  });
});

describe('partOfDay', () => {
  const boundaries: [string, PartOfDay][] = [
    ['01:59', 'night'],
    ['02:00', 'closed'],
    ['05:59', 'closed'],
    ['06:00', 'dawn'],
    ['07:59', 'dawn'],
    ['08:00', 'midday'],
    ['11:59', 'midday'],
    ['12:00', 'afternoon'],
    ['15:59', 'afternoon'],
    ['16:00', 'evening'],
    ['18:59', 'evening'],
    ['19:00', 'night'],
    ['23:59', 'night'],
    ['00:00', 'night'],
  ];

  it.each(boundaries)('puts %s in %s', (label, part) => {
    expect(partOfDay(at(label))).toBe(part);
  });
});

describe('isOpen', () => {
  it.each([
    ['03:00', false],
    ['07:00', true],
    ['10:00', true],
    ['14:00', true],
    ['17:00', true],
    ['22:00', true],
  ])('at %s is %s', (label, open) => {
    expect(isOpen(at(label))).toBe(open);
  });
});

describe('formatCarnivalTime', () => {
  it('pads hours and minutes to two digits', () => {
    expect(formatCarnivalTime(at('08:45'))).toBe('08:45');
    expect(formatCarnivalTime({ hours: 0, minutes: 5 })).toBe('00:05');
    expect(formatCarnivalTime({ hours: 23, minutes: 59 })).toBe('23:59');
  });
});

describe('startHourFrom', () => {
  it('starts at 08:00 without the option', () => {
    expect(startHourFrom('')).toBe(8);
    expect(startHourFrom('?other=3')).toBe(8);
  });

  it('starts at a whole hour from 0 to 23', () => {
    expect(startHourFrom('?hour=0')).toBe(0);
    expect(startHourFrom('?hour=1')).toBe(1);
    expect(startHourFrom('?hour=23')).toBe(23);
  });

  it.each(['?hour=24', '?hour=-1', '?hour=1.5', '?hour=abc', '?hour=', '?hour=100'])(
    'ignores %s',
    (search) => {
      expect(startHourFrom(search)).toBe(8);
    },
  );
});

describe('currentCarnivalTime', () => {
  it('reads the time from the page load and the ?hour= option', () => {
    expect(currentCarnivalTime(0, '')).toEqual(at('08:00'));
    expect(currentCarnivalTime(60_000, '?hour=1')).toEqual(at('05:48'));
  });
});
