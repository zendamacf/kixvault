import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, parseApiError } from '@/lib/api';

const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/verify-email')({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Verification link is invalid or missing.');
      return;
    }

    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    async function verify() {
      const response = await api.api.auth['verify-email'].$post({
        json: { token: token ?? '' },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to verify email'));
      }

      setStatus('success');
    }

    verify().catch((err: Error) => {
      setStatus('error');
      setError(err.message);
    });
  }, [token]);

  return (
    <div className="w-full max-w-md">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>
            {status === 'loading'
              ? 'Verifying your email'
              : status === 'success'
                ? 'Email verified'
                : 'Verification failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading'
              ? 'Please wait while we confirm your email address.'
              : status === 'success'
                ? 'Your account is ready. You can now sign in.'
                : 'We could not verify your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' ? (
            <p className="text-sm text-muted-foreground">This should only take a moment.</p>
          ) : null}

          {status === 'success' ? (
            <Button className="w-full" onClick={() => navigate({ to: '/login' })}>
              Continue to sign in
            </Button>
          ) : null}

          {status === 'error' ? (
            <>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
