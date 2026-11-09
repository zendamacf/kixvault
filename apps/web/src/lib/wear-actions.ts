import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
        throw new Error(await parseApiError(response, 'Failed to remove wear'));
      }

      return response.json();
    },
    onSuccess: async (result) => {
      await invalidate();

      if (!options.quiet) {
        toast.success(
          result.conditionReverted ? 'Wear removed. Marked as deadstock again.' : 'Wear removed.',
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
        throw new Error(await parseApiError(response, 'Failed to log wear'));
      }

      return { ...(await response.json()), date };
    },
    onSuccess: async (result, variables) => {
      await invalidate();

      if (!result.created) {
        toast.info(`${variables.label} is already logged for that day.`);
        return;
      }

      const conditionNote = result.conditionChanged
        ? ` Marked as ${formatCondition(result.sneaker.condition).toLowerCase()}.`
        : '';

      toast.success(`Logged ${variables.label}.${conditionNote}`, {
        action: {
          label: 'Undo',
          onClick: () => removeWear.mutate({ sneakerId: variables.sneakerId, wornOn: result.date }),
        },
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
