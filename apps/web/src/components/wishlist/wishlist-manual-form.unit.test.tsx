import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { WishlistManualForm } from './wishlist-manual-form';

afterEach(() => {
  cleanup();
});

describe('WishlistManualForm', () => {
  test('renders manual grail fields', () => {
    render(<WishlistManualForm submitLabel="Save grail" onSubmit={async () => {}} />);

    expect(screen.getByLabelText('Brand')).toBeTruthy();
    expect(screen.getByLabelText('Model')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save grail' })).toBeTruthy();
  });
});
