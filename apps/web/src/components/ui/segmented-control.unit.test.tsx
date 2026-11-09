import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './segmented-control';

afterEach(() => {
  cleanup();
});

const options = [
  { value: 'catalog', label: 'Search catalog' },
  { value: 'manual', label: 'Enter manually' },
] as const;

describe('SegmentedControl', () => {
  test('marks the current option as checked and names the group', () => {
    render(
      <SegmentedControl
        label="How to add this pair"
        value="catalog"
        options={[...options]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'How to add this pair' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Search catalog' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Enter manually' }).getAttribute('aria-checked')).toBe(
      'false',
    );
  });

  test('reports the newly chosen option', () => {
    const onChange = mock(() => {});

    render(
      <SegmentedControl label="Mode" value="catalog" options={[...options]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Enter manually' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('manual');
  });

  test('keeps the mode when the active option is pressed again', () => {
    const onChange = mock(() => {});

    render(
      <SegmentedControl label="Mode" value="catalog" options={[...options]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Search catalog' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
