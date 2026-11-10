import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { i18n } from '@/i18n';
import { api, parseApiError } from '@/lib/api';
import { formatCondition } from '@/lib/utils';
import { toIsoDate } from '@/lib/wears';

type LogWearVariables = {
  sneakerId: string;
  /** YYYY-MM-DD. Defaults to today. */
  wornOn?: string;
  /** Used in the confirmation message. */
  label: string;
};

type RemoveWearVariables = {
  sneakerId: string;
  wornOn: string;
};

function useInvalidateWearData() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sneakers'] }),
      queryClient.invalidateQueries({ queryKey: ['wears'] }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
      queryClient.invalidateQueries({ queryKey: ['audit'] }),
    ]);
  };
}

export function useRemoveWear(options: { quiet?: boolean } = {}) {
  const invalidate = useInvalidateWearData();

  return useMutation({
    mutationFn: async ({ sneakerId, wornOn }: RemoveWearVariables) => {
      const response = await api.api.wears[':sneakerId'][':date'].$delete({
        param: { sneakerId, date: wornOn },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, i18n.t('errors.removeWear')));
      }

      return response.json();
    },
    onSuccess: async (result) => {
      await invalidate();

      if (!options.quiet) {
        toast.success(
          result.conditionReverted
            ? i18n.t('wears.toast.removedReverted')
            : i18n.t('wears.toast.removed'),
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

/** Logs a wear and shows a toast with Undo. A pair's first wear can change its condition. */
export function useLogWear() {
  const invalidate = useInvalidateWearData();
  const removeWear = useRemoveWear({ quiet: true });

  return useMutation({
    mutationFn: async ({ sneakerId, wornOn }: LogWearVariables) => {
      const date = wornOn ?? toIsoDate(new Date());
      const response = await api.api.wears[':sneakerId'].$post({
        param: { sneakerId },
        json: { wornOn: date },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, i18n.t('errors.logWear')));
      }

      return { ...(await response.json()), date };
    },
    onSuccess: async (result, variables) => {
      await invalidate();

      if (!result.created) {
        toast.info(i18n.t('wears.toast.alreadyLogged', { label: variables.label }));
        return;
      }

      const message = result.conditionChanged
        ? i18n.t('wears.toast.loggedWithCondition', {
            label: variables.label,
            condition: formatCondition(result.sneaker.condition).toLowerCase(),
          })
        : i18n.t('wears.toast.logged', { label: variables.label });

      toast.success(message, {
        action: {
          label: i18n.t('wears.toast.undo'),
          onClick: () => removeWear.mutate({ sneakerId: variables.sneakerId, wornOn: result.date }),
        },
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
