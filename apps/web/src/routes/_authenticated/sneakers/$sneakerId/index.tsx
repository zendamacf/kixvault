import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, parseApiError } from "@/lib/api";
import { sneakerQueryOptions } from "@/lib/queries";
import { formatCondition, formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sneakers/$sneakerId/")({
  component: SneakerDetailPage,
});

function SneakerDetailPage() {
  const { sneakerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(sneakerQueryOptions(sneakerId));

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.api.sneakers[":id"].$delete({
        param: { id: sneakerId },
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, "Failed to delete sneaker"));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sneakers"] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await navigate({ to: "/" });
    },
    onError: (mutationError) => {
      setActionError(mutationError.message);
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading sneaker...</p>;
  }

  if (error || !data?.sneaker) {
    return <p className="text-sm text-destructive">{error?.message ?? "Sneaker not found"}</p>;
  }

  const sneaker = data.sneaker;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to collection
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl">
              {sneaker.brand} {sneaker.model}
            </CardTitle>
            <p className="text-muted-foreground">{sneaker.colorway || "No colorway listed"}</p>
            <Badge>{formatCondition(sneaker.condition)}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/sneakers/$sneakerId/edit", params: { sneakerId } })}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm("Delete this pair from your collection?")) {
                  setActionError(null);
                  deleteMutation.mutate();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Size" value={String(sneaker.size)} />
          <DetailItem label="Purchase price" value={formatCurrency(sneaker.purchasePrice)} />
          <DetailItem label="Purchase date" value={sneaker.purchaseDate ?? "—"} />
          <DetailItem label="Added" value={new Date(sneaker.createdAt).toLocaleDateString()} />
          <div className="sm:col-span-2">
            <DetailItem label="Notes" value={sneaker.notes || "—"} />
          </div>
        </CardContent>
      </Card>

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base">{value}</p>
    </div>
  );
}
