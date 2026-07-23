import type { SneakerCondition } from '@kixvault/shared';
import { formatCondition } from '@/lib/utils';
import { Badge } from '../ui/badge';

type SneakerConditionBadgeProps = {
  condition: SneakerCondition;
};

/** Condition badge with formatted condition text. */
export function SneakerConditionBadge({ condition }: SneakerConditionBadgeProps) {
  return <Badge className="shrink-0">{formatCondition(condition)}</Badge>;
}
