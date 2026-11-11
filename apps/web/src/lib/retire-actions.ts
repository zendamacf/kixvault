import type { RetireSneakerInput } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { i18n } from '@/i18n';
import { api, parseApiError } from '@/lib/api';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';

type RetireVariables = {
  sneakerId: string;
  /** Used in the confirmation message. */
  label: string;
  input: RetireSneakerInput;
};

type RestoreVariables = {
  sneakerId: string;
  /** Used in the confirmation message. */
  label: string;
  /** Skips the confirmation toast, for example when the toast offers Undo. */
  quiet?: boolean;
};

function useInvalidateVaultData() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sneakers'] }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
      queryClient.invalidateQueries({ queryKey: ['audit'] }),
    ]);
  };
}

export function useRestoreSneaker() {
  const invalidate = useInvalidateVaultData();

  return useMutation({
    mutationFn: async ({ sneakerId }: RestoreVariables) => {
      const response = await api.api.sneakers[':id'].restore.$post({ param: { id: sneakerId } });

      if (!response.ok) {
        throw new Error(await parseApiError(response, i18n.t('errors.restoreSneaker')));
      }

      return response.json();
    },
    onSuccess: async (_result, variables) => {
      trackUmamiEvent(UmamiEvents.sneakerRestore);
      await invalidate();

      if (!variables.quiet) {
        toast.success(i18n.t('retire.toast.restored', { label: variables.label }));
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/** Retires a pair and shows a toast with Undo, which restores it. */
export function useRetireSneaker(options: { onRetired?: () => void } = {}) {
  const invalidate = useInvalidateVaultData();
  const restore = useRestoreSneaker();

  return useMutation({
    mutationFn: async ({ sneakerId, input }: RetireVariables) => {
      const response = await api.api.sneakers[':id'].retire.$post({
        param: { id: sneakerId },
        json: input,
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, i18n.t('errors.retireSneaker')));
      }

      return response.json();
    },
    onSuccess: async (_result, variables) => {
      trackUmamiEvent(UmamiEvents.sneakerRetire, { type: variables.input.departureType });
      await invalidate();
      options.onRetired?.();

      toast.success(i18n.t('retire.toast.retired', { label: variables.label }), {
        action: {
          label: i18n.t('retire.toast.undo'),
          onClick: () =>
            restore.mutate({ sneakerId: variables.sneakerId, label: variables.label, quiet: true }),
        },
      });
    },
  });
}
