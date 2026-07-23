import { verifyEmailPendingSearchSchema } from '@kixvault/shared';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, parseApiError } from '@/lib/api';

export const Route = createFileRoute('/verify-email-pending')({
  validateSearch: verifyEmailPendingSearchSchema,
  component: VerifyEmailPendingPage,
});

function VerifyEmailPendingPage() {
  const { email } = Route.useSearch();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (!email) {
        throw new Error('Email address is missing. Please register again.');
      }

      const response = await api.api.auth['resend-verification'].$post({
        json: { email },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to resend verification email'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      setMessage(data.message);
    },
    onError: (err) => {
      setMessage(null);
      setError(err.message);
    },
  });

  return (
    <div className="w-full max-w-md">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a verification link{email ? ` to ${email}` : ''}. Click the link to activate
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The link expires in 48 hours. Once verified, you can sign in.
          </p>

          {message ? <p className="text-sm text-primary">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!email || resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
