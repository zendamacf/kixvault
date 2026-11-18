import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { downloadCollectionCsv } from '@/lib/export';

export function ExportCsvButton({ disabled = false }: { disabled?: boolean }) {
  const { t } = useTranslation();
  const exportCsv = useMutation({
    mutationFn: downloadCollectionCsv,
    onError: () => toast.error(t('collection.exportFailed')),
  });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || exportCsv.isPending}
      onClick={() => exportCsv.mutate()}
    >
      <Download aria-hidden />
      {exportCsv.isPending ? t('collection.exporting') : t('collection.exportCsv')}
    </Button>
  );
}
