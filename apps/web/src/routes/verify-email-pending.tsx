import { zodResolver } from '@hookform/resolvers/zod';
import { resendVerificationSchema } from '@kixvault/shared';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, toApiError } from '@/lib/api';

export const Route = createFileRoute('/verify-email-pending')({
  validateSearch: z.object({ email: z.string().optional() }),
  component: VerifyEmailPendingPage,
});

function VerifyEmailPendingPage() {
  const { t } = useTranslation();
  const { email } = Route.useSearch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: email ?? '' },
  });

  const resendMutation = useMutation({
    mutationFn: async (values: { email: string }) => {
      const response = await api.api.auth['resend-verification'].$post({ json: values });

      if (!response.ok) {
        throw await toApiError(response, t('verifyEmailPending.resendFailed'));
      }
    },
  });

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {t('verifyEmailPending.title')}
        </h1>
        <p className="text-muted-foreground">
          {email
            ? t('verifyEmailPending.description', { email })
            : t('verifyEmailPending.descriptionNoEmail')}
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) => resendMutation.mutate(values))}
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t('verifyEmailPending.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        {resendMutation.isSuccess ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t('verifyEmailPending.resendDone')}
          </p>
        ) : null}
        {resendMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {resendMutation.error.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          variant="outline"
          className="w-full"
          disabled={resendMutation.isPending}
        >
          {resendMutation.isPending
            ? t('verifyEmailPending.resendPending')
            : t('verifyEmailPending.resend')}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        <Link
          to="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary hover:decoration-2"
        >
          {t('verifyEmailPending.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}
