import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Sneaker } from "@/lib/queries";
import { formatCondition, formatCurrency } from "@/lib/utils";

type SneakerCardProps = {
  sneaker: Sneaker;
};

export function SneakerCard({ sneaker }: SneakerCardProps) {
  return (
    <Link to="/sneakers/$sneakerId" params={{ sneakerId: sneaker.id }} className="block">
      <Card className="transition-colors hover:border-primary/40 hover:bg-accent/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {sneaker.brand} {sneaker.model}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {sneaker.colorway || "No colorway"} · Size {sneaker.size}
              </p>
            </div>
            <Badge>{formatCondition(sneaker.condition)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Paid {formatCurrency(sneaker.purchasePrice)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
