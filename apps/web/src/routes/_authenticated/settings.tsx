import { SUPPORTED_CURRENCIES } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ExportCsvButton } from '@/components/collection/export-csv-button';
import { BackLink } from '@/components/layout/back-link';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, parseApiError } from '@/lib/api';
import { exchangeRatesQueryOptions, sessionQueryOptions, statsQueryOptions } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useQuery(sessionQueryOptions);
  const { data: rates } = useQuery(exchangeRatesQueryOptions);
  const { data: stats } = useQuery(statsQueryOptions);
  const currency = session?.user?.currency ?? 'USD';
  const available = SUPPORTED_CURRENCIES.filter((code) => code === 'USD' || rates?.rates[code]);
  const displayNames = new Intl.DisplayNames(i18n.language, { type: 'currency' });

  const mutation = useMutation({
    mutationFn: async (next: (typeof SUPPORTED_CURRENCIES)[number]) => {
      const response = await api.api.settings.$patch({ json: { currency: next } });

      if (!response.ok) {
        throw new Error(await parseApiError(response, t('settingsPage.saveError')));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success(t('settingsPage.saved'));
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <BackLink to="/">{t('settingsPage.back')}</BackLink>
        <div className="space-y-1">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('settingsPage.title')}
          </h1>
          <p className="text-muted-foreground">{t('settingsPage.description')}</p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {t('settingsPage.currencyTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('settingsPage.currencyDescription')}</p>
        </div>

        <div className="max-w-sm space-y-2">
          <Label htmlFor="currency">{t('settingsPage.currencyLabel')}</Label>
          <Select
            value={currency}
            onValueChange={(value) => mutation.mutate(value as (typeof available)[number])}
            disabled={mutation.isPending}
          >
            <SelectTrigger id="currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {available.map((code) => (
                <SelectItem key={code} value={code}>
                  {code} · {displayNames.of(code) ?? code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          {rates?.updatedAt
            ? t('settingsPage.ratesUpdated', { date: formatDate(rates.updatedAt) })
            : t('settingsPage.ratesUnavailable')}
        </p>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {t('settingsPage.exportTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('settingsPage.exportDescription')}</p>
        </div>

        <ExportCsvButton disabled={stats?.stats.count === 0} />
      </section>
    </div>
  );
}
