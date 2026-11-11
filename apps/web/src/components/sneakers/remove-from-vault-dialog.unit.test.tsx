import { afterEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { RemoveFromVaultDialog } from './remove-from-vault-dialog';

afterEach(() => {
  cleanup();
});

function renderDialog(onDelete = mock(() => {})) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <RemoveFromVaultDialog
        sneakerId="11111111-1111-4111-8111-111111111111"
        name="Nike Dunk Low"
        onDelete={onDelete}
      >
        <Button>Remove from vault</Button>
      </RemoveFromVaultDialog>
    </QueryClientProvider>,
  );

  return onDelete;
}

function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Remove from vault' }));
}

describe('RemoveFromVaultDialog', () => {
  test('offers retire and delete, and marks delete as permanent', async () => {
    renderDialog();
    open();

    const dialog = await screen.findByRole('dialog');

    expect(dialog.textContent).toContain('Choose how Nike Dunk Low leaves your collection.');
    expect(screen.getByRole('button', { name: /^Retire/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Delete\s*Permanent/ })).toBeTruthy();
  });

  test('retire opens the retire form and back returns to the choice', async () => {
    renderDialog();
    open();

    fireEvent.click(await screen.findByRole('button', { name: /^Retire/ }));

    expect(await screen.findByText('Retire this pair')).toBeTruthy();
    expect(screen.getByLabelText('Sale price')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('button', { name: /^Retire/ })).toBeTruthy();
  });

  test('delete asks for confirmation before deleting', async () => {
    const onDelete = renderDialog();
    open();

    fireEvent.click(await screen.findByRole('button', { name: /^Delete\s*Permanent/ }));

    expect(await screen.findByText('Delete this pair permanently?')).toBeTruthy();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('reopens on the choice step', async () => {
    renderDialog();
    open();
    fireEvent.click(await screen.findByRole('button', { name: /^Retire/ }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    open();

    expect(await screen.findByRole('button', { name: /^Retire/ })).toBeTruthy();
  });
});
