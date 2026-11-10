import type { SneakerCondition } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, parseApiError } from '@/lib/api';
import { formatCondition } from '@/lib/utils';

type WearSuggestionProps = {
  sneakerId: string;
  wearCount: number;
  suggestedCondition: SneakerCondition;
};

function dismissalKey(sneakerId: string, condition: SneakerCondition): string {
  return `kixvault:wear-suggestion-dismissed:${sneakerId}:${condition}`;
}

function isDismissed(sneakerId: string, condition: SneakerCondition): boolean {
  try {
    return window.localStorage.getItem(dismissalKey(sneakerId, condition)) === '1';
  } catch {
    return false;
  }
}

function rememberDismissal(sneakerId: string, condition: SneakerCondition) {
  try {
    window.localStorage.setItem(dismissalKey(sneakerId, condition), '1');
  } catch {
    // Storage can be unavailable. The banner then returns on the next visit.
  }
}

/** Offers a condition change once a pair has enough wears. Dismissals are kept per device. */
export function WearSuggestion({ sneakerId, wearCount, suggestedCondition }: WearSuggestionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(() => isDismissed(sneakerId, suggestedCondition));

  const accept = useMutation({
    mutationFn: async () => {
      const response = await api.api.sneakers[':id'].$patch({
        param: { id: sneakerId },
        json: { condition: suggestedCondition },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, t('errors.updateCondition')));
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sneakers'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
        queryClient.invalidateQueries({ queryKey: ['audit'] }),
      ]);
      toast.success(
        t('wearSuggestion.marked', { target: formatCondition(suggestedCondition).toLowerCase() }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (dismissed) {
    return null;
  }

  const target = formatCondition(suggestedCondition).toLowerCase();

  return (
    <section
      aria-label={t('wearSuggestion.label')}
      className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-border"
    >
      <p className="text-sm">
        <Trans
          i18nKey="wearSuggestion.prompt"
          count={wearCount}
          values={{ target }}
          components={{ strong: <strong className="font-semibold" /> }}
        />
      </p>
      <div className="flex gap-2">
        <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate()}>
          {t('wearSuggestion.accept', { target })}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            rememberDismissal(sneakerId, suggestedCondition);
            setDismissed(true);
          }}
        >
          {t('wearSuggestion.notNow')}
        </Button>
      </div>
    </section>
  );
}
