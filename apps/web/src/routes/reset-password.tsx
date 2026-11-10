import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@kixvault/shared';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, toApiError } from '@/lib/api';

export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
});

const passwordOnlySchema = registerSchema.pick({ password: true });

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordOnlySchema),
    defaultValues: { password: '' },
  });

  const resetMutation = useMutation({
    mutationFn: async (values: { password: string }) => {
      const response = await api.api.auth['reset-password'].$post({
        json: { token: token ?? '', password: values.password },
      });

      if (!response.ok) {
        throw await toApiError(response, t('resetPassword.failed'));
      }
    },
  });

  if (resetMutation.isSuccess) {
    return (
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('resetPassword.successTitle')}
          </h1>
          <p className="text-muted-foreground">{t('resetPassword.successDescription')}</p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link to="/login">{t('resetPassword.successAction')}</Link>
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t('resetPassword.title')}
          </h1>
          <p className="text-muted-foreground" role="alert">
            {t('resetPassword.missingToken')}
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link to="/forgot-password">{t('resetPassword.requestNew')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        {t('resetPassword.title')}
      </h1>

      <form className="space-y-5" onSubmit={handleSubmit((values) => resetMutation.mutate(values))}>
        <div className="space-y-2">
          <Label htmlFor="password">{t('resetPassword.passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        {resetMutation.isError ? (
          <div className="space-y-2" role="alert">
            <p className="text-sm text-destructive">{resetMutation.error.message}</p>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              {t('resetPassword.requestNew')}
            </Link>
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? t('resetPassword.submitPending') : t('resetPassword.submit')}
        </Button>
      </form>
    </div>
  );
}
