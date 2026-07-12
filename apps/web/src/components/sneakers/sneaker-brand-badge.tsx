import { Badge } from '@/components/ui/badge';
import { cn, getSneakerBrandStyles } from '@/lib/utils';

type SneakerBrandBadgeProps = {
  brand: string;
  className?: string;
};

export function SneakerBrandBadge({ brand, className }: SneakerBrandBadgeProps) {
  const { badgeClassName } = getSneakerBrandStyles(brand);

  return (
    <Badge variant="outline" className={cn(badgeClassName, className)}>
      {brand}
    </Badge>
  );
}
