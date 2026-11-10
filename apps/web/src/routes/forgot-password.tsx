import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@kixvault/shared';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, toApiError } from '@/lib/api';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const forgotMutation = useMutation({
    mutationFn: async (values: { email: string }) => {
      const response = await api.api.auth['forgot-password'].$post({ json: values });

      if (!response.ok) {
        throw await toApiError(response, t('forgotPassword.failed'));
      }
    },
  });

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {t('forgotPassword.title')}
        </h1>
        <p className="text-muted-foreground">{t('forgotPassword.description')}</p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) => forgotMutation.mutate(values))}
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t('forgotPassword.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        {forgotMutation.isSuccess ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t('forgotPassword.done')}
          </p>
        ) : null}
        {forgotMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {forgotMutation.error.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={forgotMutation.isPending}>
          {forgotMutation.isPending
            ? t('forgotPassword.submitPending')
            : t('forgotPassword.submit')}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        <Link
          to="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:decoration-primary hover:decoration-2"
        >
          {t('forgotPassword.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}
