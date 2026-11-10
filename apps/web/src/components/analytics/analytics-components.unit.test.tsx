import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { ChartCard } from './chart-card';
import { ConditionChart } from './condition-chart';
import { MostWornList } from './most-worn-list';

afterEach(() => {
  cleanup();
});

describe('ChartCard', () => {
  test('shows the empty message instead of the chart', () => {
    render(
      <ChartCard
        title="Wears"
        description="desc"
        emptyMessage="Nothing yet."
        isEmpty
        footnote="note"
      >
        <p>chart</p>
      </ChartCard>,
    );

    expect(screen.getByRole('heading', { name: 'Wears' })).toBeTruthy();
    expect(screen.getByText('Nothing yet.')).toBeTruthy();
    expect(screen.queryByText('chart')).toBeNull();
    expect(screen.queryByText('note')).toBeNull();
  });

  test('shows the chart and footnote when there is data', () => {
    render(
      <ChartCard
        title="Wears"
        description="desc"
        emptyMessage="Nothing yet."
        isEmpty={false}
        footnote="note"
      >
        <p>chart</p>
      </ChartCard>,
    );

    expect(screen.getByText('chart')).toBeTruthy();
    expect(screen.getByText('note')).toBeTruthy();
    expect(screen.queryByText('Nothing yet.')).toBeNull();
  });
});

describe('ConditionChart', () => {
  test('lists each condition with its count', () => {
    render(
      <ConditionChart
        data={[
          { condition: 'deadstock', count: 3 },
          { condition: 'lightly_worn', count: 1 },
        ]}
      />,
    );

    expect(screen.getByText('Deadstock')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Lightly worn')).toBeTruthy();
  });
});

describe('MostWornList', () => {
  test('ranks entries and pluralises wears', () => {
    render(
      <MostWornList
        entries={[
          { sneakerId: 'a', name: 'Chicago', count: 4 },
          { sneakerId: 'b', name: 'Mamba Fury', count: 1 },
        ]}
      />,
    );

    expect(screen.getByText('Chicago')).toBeTruthy();
    expect(screen.getByText('4 wears')).toBeTruthy();
    expect(screen.getByText('1 wear')).toBeTruthy();
  });
});
