import { zodResolver } from '@hookform/resolvers/zod';
import { EMAIL_NOT_VERIFIED_CODE, loginSchema, loginSearchSchema } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, api, toApiError } from '@/lib/api';
import { authConfigQueryOptions, sessionQueryOptions } from '@/lib/queries';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (session.user) {
      throw redirect({ to: search.redirect || '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect: redirectTo } = Route.useSearch();
  const [formError, setFormError] = useState<string | null>(null);
  const { data: authConfig } = useQuery(authConfigQueryOptions);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const response = await api.api.auth.login.$post({ json: values });

      if (!response.ok) {
        throw await toApiError(response, 'Failed to log in');
      }

      return response.json();
    },
    onSuccess: async () => {
      trackUmamiEvent(UmamiEvents.authLogin);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await navigate({ to: redirectTo || '/' });
    },
    onError: async (error, values) => {
      trackUmamiEvent(UmamiEvents.authLoginFailed);

      if (error instanceof ApiError && error.code === EMAIL_NOT_VERIFIED_CODE) {
        await navigate({ to: '/verify-email-pending', search: { email: values.email.trim() } });
        return;
      }

      setFormError(error.message);
    },
  });

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">{t('login.title')}</h1>
        <p className="text-muted-foreground">{t('login.description')}</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) => {
          setFormError(null);
          loginMutation.mutate(values);
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t('login.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('login.passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? t('login.submitPending') : t('login.submit')}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {authConfig?.signupsEnabled ? (
          <>
            {t('login.signupPrompt')}{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary hover:decoration-2"
            >
              {t('login.signupLink')}
            </Link>
          </>
        ) : (
          t('login.signupsDisabled')
        )}
      </p>
    </div>
  );
}
