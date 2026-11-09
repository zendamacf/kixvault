import { afterEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { CalendarWear } from '@/lib/wears';
import { WearCalendar } from './wear-calendar';

mock.module('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/sneakers/test-id" className={className}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

const wear = (id: string, wornOn: string, model: string): CalendarWear => ({
  id,
  sneakerId: id,
  wornOn,
  brand: 'Nike',
  model,
  nickname: null,
  colorway: null,
  primaryImage: null,
});

function renderCalendar(
  wears: CalendarWear[],
  overrides: Partial<{ year: number; month: number }> = {},
) {
  const onMonthChange = mock(() => {});
  const onAddWear = mock(() => {});
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <WearCalendar
        year={overrides.year ?? 2020}
        month={overrides.month ?? 10}
        wears={wears}
        onMonthChange={onMonthChange}
        onAddWear={onAddWear}
      />
    </QueryClientProvider>,
  );

  return { onMonthChange, onAddWear };
}

describe('WearCalendar', () => {
  test('shows the month and weekday headings', () => {
    renderCalendar([]);

    expect(screen.getByText(/November 2020/)).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
  });

  test('collapses extra wears on a busy day', () => {
    renderCalendar([
      wear('a', '2020-11-05', 'Dunk'),
      wear('b', '2020-11-05', 'AF1'),
      wear('c', '2020-11-05', 'Samba'),
      wear('d', '2020-11-05', 'Gazelle'),
    ]);

    expect(screen.getByText('+1')).toBeTruthy();
  });

  test('opens a day dialog listing the pairs worn', () => {
    renderCalendar([wear('a', '2020-11-05', 'Dunk Low')]);

    fireEvent.click(screen.getByRole('button', { name: /November 5, 1 wear/ }));

    expect(screen.getByText('1 pair worn.')).toBeTruthy();
    expect(screen.getByText('Dunk Low')).toBeTruthy();
  });

  test('asks to add a pair for the selected day', () => {
    const { onAddWear } = renderCalendar([]);

    fireEvent.click(screen.getByRole('button', { name: /November 7, 0 wears/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a pair' }));

    expect(onAddWear).toHaveBeenCalledWith('2020-11-07');
  });

  test('moves between months', () => {
    const { onMonthChange } = renderCalendar([]);

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(onMonthChange).toHaveBeenNthCalledWith(1, 2020, 11);
    expect(onMonthChange).toHaveBeenNthCalledWith(2, 2020, 9);
  });

  test('disables days in the future', () => {
    renderCalendar([], { year: 2999, month: 0 });

    const day = screen.getByRole('button', { name: /January 15, 0 wears/ }) as HTMLButtonElement;
    expect(day.disabled).toBe(true);
  });
});
