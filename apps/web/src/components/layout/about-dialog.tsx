import { APP_NAME } from '@kixvault/shared';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/** Footer button that opens the About dialog, with the StockX disclaimer. */
export function AboutDialog() {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
        >
          {t('layout.footer.about')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('layout.about.title', { appName: APP_NAME })}</DialogTitle>
          <DialogDescription>{t('layout.about.description')}</DialogDescription>
        </DialogHeader>
        <section className="grid gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('layout.about.disclaimerHeading')}
          </h3>
          <p>{t('layout.about.stockx', { appName: APP_NAME })}</p>
          <p className="text-muted-foreground">{t('layout.about.trademarks')}</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
