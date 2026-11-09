export type CalendarWear = {
  id: string;
  sneakerId: string;
  wornOn: string;
  brand: string;
  model: string;
  nickname: string | null;
  colorway: string | null;
  primaryImage: { id: string; url: string } | null;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local calendar day as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses YYYY-MM-DD as a local date at midnight. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Weeks (Monday first) covering the given month, padded with days from the
 * neighbouring months so every row has seven days.
 */
export function buildMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((offset + daysInMonth) / 7);
  const weeks: Date[][] = [];

  for (let week = 0; week < weekCount; week++) {
    const days: Date[] = [];

    for (let day = 0; day < 7; day++) {
      days.push(new Date(year, month, 1 - offset + week * 7 + day));
    }

    weeks.push(days);
  }

  return weeks;
}

/** First and last visible day of the month grid, as YYYY-MM-DD. */
export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const weeks = buildMonthGrid(year, month);
  const lastWeek = weeks[weeks.length - 1];

  return { from: toIsoDate(weeks[0][0]), to: toIsoDate(lastWeek[6]) };
}

export function groupWearsByDay(wears: CalendarWear[]): Map<string, CalendarWear[]> {
  const groups = new Map<string, CalendarWear[]>();

  for (const wear of wears) {
    const group = groups.get(wear.wornOn);

    if (group) {
      group.push(wear);
    } else {
      groups.set(wear.wornOn, [wear]);
    }
  }

  return groups;
}

/** Case-insensitive match on brand, model, nickname, and colorway. */
export function matchesSneakerSearch(
  sneaker: { brand: string; model: string; nickname: string | null; colorway: string | null },
  search: string,
): boolean {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const haystack = [sneaker.brand, sneaker.model, sneaker.nickname, sneaker.colorway]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

/** Most recently worn first, then never-worn pairs by brand and model. */
export function sortSneakersForQuickLog<
  T extends { brand: string; model: string; lastWornOn: string | null },
>(sneakers: T[]): T[] {
  return [...sneakers].sort((a, b) => {
    if (a.lastWornOn && b.lastWornOn && a.lastWornOn !== b.lastWornOn) {
      return a.lastWornOn < b.lastWornOn ? 1 : -1;
    }

    if (a.lastWornOn && !b.lastWornOn) {
      return -1;
    }

    if (!a.lastWornOn && b.lastWornOn) {
      return 1;
    }

    return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
  });
}
