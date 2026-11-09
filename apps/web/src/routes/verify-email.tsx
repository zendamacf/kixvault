import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { api, toApiError } from '@/lib/api';

export const Route = createFileRoute('/verify-email')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  // The token works once and React may run the effect twice in development.
  const started = useRef(false);

  const verifyMutation = useMutation({
    mutationFn: async (value: string) => {
      const response = await api.api.auth['verify-email'].$post({ json: { token: value } });

      if (!response.ok) {
        throw await toApiError(response, t('verifyEmail.errorDescription'));
      }
    },
  });
  const { mutate } = verifyMutation;

  useEffect(() => {
    if (!token || started.current) {
      return;
    }

    started.current = true;
    mutate(token);
  }, [token, mutate]);

  const failed = !token || verifyMutation.isError;

  if (verifyMutation.isSuccess) {
    return (
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('verifyEmail.successTitle')}
          </h1>
          <p className="text-muted-foreground">{t('verifyEmail.successDescription')}</p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link to="/login">{t('verifyEmail.successAction')}</Link>
        </Button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('verifyEmail.errorTitle')}
          </h1>
          <p className="text-muted-foreground" role="alert">
            {token ? t('verifyEmail.errorDescription') : t('verifyEmail.missingToken')}
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/verify-email-pending">{t('verifyEmail.errorAction')}</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link to="/login">{t('verifyEmail.backToSignIn')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        {t('verifyEmail.verifyingTitle')}
      </h1>
      <p className="text-muted-foreground" role="status">
        {t('verifyEmail.verifyingDescription')}
      </p>
    </div>
  );
}
