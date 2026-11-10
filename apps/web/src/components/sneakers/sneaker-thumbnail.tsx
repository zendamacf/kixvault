import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type SneakerThumbnailProps = {
  imageUrl: string | null;
  alt: string;
  className?: string;
};

/** Product image with a fallback placeholder when no URL is available. */
export function SneakerThumbnail({ imageUrl, alt, className }: SneakerThumbnailProps) {
  const { t } = useTranslation();

  if (!imageUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-transparent text-xs text-muted-foreground',
          className,
        )}
      >
        {t('common.noImage')}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={cn('rounded-md bg-transparent object-contain', className)}
      loading="lazy"
    />
  );
}
