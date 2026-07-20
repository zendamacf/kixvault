import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, loginSearchSchema, resendVerificationSchema } from '@kixvault/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect: redirectTo } = Route.useSearch();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
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

      if (response.status === 403) {
        const data = (await response.json()) as { error?: string };
        setUnverifiedEmail(values.email);
        throw new Error(data.error ?? 'Email not verified');
      }

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to log in'));
      }

      return response.json();
    },
    onSuccess: async () => {
      setUnverifiedEmail(null);
      setResendMessage(null);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await navigate({ to: redirectTo || '/' });
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const parsed = resendVerificationSchema.parse({ email });
      const response = await api.api.auth['resend-verification'].$post({ json: parsed });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to resend verification email'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResendMessage(data.message);
      setFormError(null);
    },
    onError: (error) => {
      setResendMessage(null);
      setFormError(error.message);
    },
  });

  return (
    <div className="w-full max-w-md">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to manage your sneaker collection.</CardDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            {unverifiedEmail ? (
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="text-sm text-muted-foreground">
                  Need a new link? We can send another verification email.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate(unverifiedEmail)}
                >
                  {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
                </Button>
                {resendMessage ? <p className="text-sm text-primary">{resendMessage}</p> : null}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {authConfig?.signupsEnabled ? (
              <>
                New here?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              'Contact an administrator to create an account.'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
