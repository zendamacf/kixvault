import { describe, expect, test } from 'bun:test';
import {
  buildMonthGrid,
  type CalendarWear,
  getMonthRange,
  groupWearsByDay,
  matchesSneakerSearch,
  parseIsoDate,
  sortSneakersForQuickLog,
  toIsoDate,
} from './wears';

describe('toIsoDate / parseIsoDate', () => {
  test('round-trips a local date', () => {
    expect(toIsoDate(parseIsoDate('2026-03-05'))).toBe('2026-03-05');
  });

  test('pads month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 2))).toBe('2026-01-02');
  });
});

describe('buildMonthGrid', () => {
  test('starts on a Monday and has full weeks', () => {
    const weeks = buildMonthGrid(2026, 10);

    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks.every((week) => week[0].getDay() === 1)).toBe(true);
  });

  test('November 2026 spans Mon 26 Oct to Sun 6 Dec', () => {
    const weeks = buildMonthGrid(2026, 10);

    expect(toIsoDate(weeks[0][0])).toBe('2026-10-26');
    expect(toIsoDate(weeks[weeks.length - 1][6])).toBe('2026-12-06');
    expect(weeks).toHaveLength(6);
  });

  test('uses five rows when the month fits', () => {
    // February 2027 starts on a Monday and has 28 days.
    expect(buildMonthGrid(2027, 1)).toHaveLength(4);
  });

  test('handles a month starting on Sunday', () => {
    // November 2026: 1 Nov is a Sunday, so the first row has six leading days.
    expect(toIsoDate(buildMonthGrid(2026, 10)[0][6])).toBe('2026-11-01');
  });
});

describe('getMonthRange', () => {
  test('returns the first and last visible day', () => {
    expect(getMonthRange(2026, 10)).toEqual({ from: '2026-10-26', to: '2026-12-06' });
  });

  test('fits inside the API range limit', () => {
    const { from, to } = getMonthRange(2026, 10);
    const days = (parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / 86_400_000;

    expect(days).toBeLessThanOrEqual(100);
  });
});

describe('groupWearsByDay', () => {
  const wear = (id: string, wornOn: string): CalendarWear => ({
    id,
    sneakerId: id,
    wornOn,
    brand: 'Nike',
    model: 'Dunk',
    nickname: null,
    colorway: null,
    primaryImage: null,
  });

  test('groups wears by date', () => {
    const groups = groupWearsByDay([
      wear('a', '2026-11-01'),
      wear('b', '2026-11-01'),
      wear('c', '2026-11-02'),
    ]);

    expect(groups.get('2026-11-01')?.map((item) => item.id)).toEqual(['a', 'b']);
    expect(groups.get('2026-11-02')).toHaveLength(1);
  });
});

describe('matchesSneakerSearch', () => {
  const sneaker = {
    brand: 'Nike',
    model: 'Air Jordan 1',
    nickname: 'Chicago',
    colorway: 'White/Red',
  };

  test('matches everything for an empty search', () => {
    expect(matchesSneakerSearch(sneaker, '  ')).toBe(true);
  });

  test('matches across fields in any order', () => {
    expect(matchesSneakerSearch(sneaker, 'jordan chicago')).toBe(true);
  });

  test('is case-insensitive', () => {
    expect(matchesSneakerSearch(sneaker, 'NIKE')).toBe(true);
  });

  test('rejects when a term is missing', () => {
    expect(matchesSneakerSearch(sneaker, 'jordan yeezy')).toBe(false);
  });
});

describe('sortSneakersForQuickLog', () => {
  test('puts recently worn pairs first, then never-worn by name', () => {
    const sorted = sortSneakersForQuickLog([
      { brand: 'Zed', model: 'One', lastWornOn: null },
      { brand: 'Adidas', model: 'Samba', lastWornOn: null },
      { brand: 'Nike', model: 'Dunk', lastWornOn: '2026-11-01' },
      { brand: 'New Balance', model: '550', lastWornOn: '2026-11-05' },
    ]);

    expect(sorted.map((item) => item.brand)).toEqual(['New Balance', 'Nike', 'Adidas', 'Zed']);
  });
});
