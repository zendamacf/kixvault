import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@kixvault/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, parseApiError } from '@/lib/api';
import { authConfigQueryOptions, sessionQueryOptions } from '@/lib/queries';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';

export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    const [session, config] = await Promise.all([
      context.queryClient.ensureQueryData(sessionQueryOptions),
      context.queryClient.ensureQueryData(authConfigQueryOptions),
    ]);

    if (session.user) {
      throw redirect({ to: '/' });
    }

    if (!config.signupsEnabled) {
      throw redirect({ to: '/login' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const response = await api.api.auth.register.$post({ json: values });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to create account'));
      }

      return response.json();
    },
    onSuccess: async () => {
      trackUmamiEvent(UmamiEvents.authRegister);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await navigate({ to: '/' });
    },
    onError: (error) => {
      trackUmamiEvent(UmamiEvents.authRegisterFailed);
      setFormError(error.message);
    },
  });

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Create your vault</h1>
        <p className="text-muted-foreground">Track every pair in one place.</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) => {
          setFormError(null);
          registerMutation.mutate(values);
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
