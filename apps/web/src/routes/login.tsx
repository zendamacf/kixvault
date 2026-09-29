import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, loginSearchSchema } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, parseApiError } from '@/lib/api';
import { authConfigQueryOptions, sessionQueryOptions } from '@/lib/queries';

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
        throw new Error(await parseApiError(response, 'Failed to log in'));
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await navigate({ to: redirectTo || '/' });
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  return (
    <div className="w-full max-w-md">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setFormError(null);
              loginMutation.mutate(values);
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
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

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t('login.submitPending') : t('login.submit')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {authConfig?.signupsEnabled ? (
              <>
                {t('login.signupPrompt')}{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  {t('login.signupLink')}
                </Link>
              </>
            ) : (
              t('login.signupsDisabled')
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
