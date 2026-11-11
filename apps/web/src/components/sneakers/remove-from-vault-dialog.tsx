import { Archive, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RetireForm } from '@/components/sneakers/retire-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Step = 'choose' | 'retire' | 'delete';

type RemoveFromVaultDialogProps = {
  sneakerId: string;
  /** Shown in the dialog text, for example "Nike Dunk Low". */
  name: string;
  onDelete: () => void;
  /** The button that opens the dialog. */
  children: ReactNode;
};

/**
 * Takes a pair out of the vault in one of two ways: retire it and keep its history, or delete it
 * for good. Delete asks for a second confirmation because it cannot be undone.
 */
export function RemoveFromVaultDialog({
  sneakerId,
  name,
  onDelete,
  children,
}: RemoveFromVaultDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('choose');

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (next) {
      setStep('choose');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-md">
        {step === 'choose' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('removeDialog.title')}</DialogTitle>
              <DialogDescription>{t('removeDialog.description', { name })}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setStep('retire')}
                className="flex items-start gap-3 rounded-xl border border-input bg-card p-4 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Archive className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span className="space-y-1">
                  <span className="block font-heading text-base font-semibold">
                    {t('removeDialog.retireTitle')}
                  </span>
                  <span className="block text-muted-foreground">
                    {t('removeDialog.retireDescription')}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStep('delete')}
                className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-card p-4 text-left transition-colors outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-destructive/30"
              >
                <Trash2 className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                <span className="space-y-1">
                  <span className="flex items-center gap-2 font-heading text-base font-semibold">
                    {t('removeDialog.deleteTitle')}
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-sans text-xs font-medium text-destructive">
                      {t('removeDialog.permanent')}
                    </span>
                  </span>
                  <span className="block text-muted-foreground">
                    {t('removeDialog.deleteDescription')}
                  </span>
                </span>
              </button>
            </div>
          </>
        ) : null}

        {step === 'retire' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('retire.title')}</DialogTitle>
              <DialogDescription>{t('retire.description', { name })}</DialogDescription>
            </DialogHeader>
            <RetireForm
              sneakerId={sneakerId}
              label={name}
              onBack={() => setStep('choose')}
              onRetired={() => setOpen(false)}
            />
          </>
        ) : null}

        {step === 'delete' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('removeDialog.confirmTitle')}</DialogTitle>
              <DialogDescription>
                {t('removeDialog.confirmDescription', { name })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep('choose')}>
                {t('removeDialog.back')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                {t('removeDialog.confirmAction')}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
