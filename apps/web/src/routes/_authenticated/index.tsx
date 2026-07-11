import { sneakerConditions } from "@kixvault/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SneakerCard } from "@/components/sneakers/sneaker-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { type Sneaker, sneakersQueryOptions, statsQueryOptions } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: CollectionPage,
});

function CollectionPage() {
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");

  const filters = useMemo(
    () => ({
      brand: brand.trim() || undefined,
      condition: condition || undefined,
      sort,
      order,
    }),
    [brand, condition, sort, order],
  );

  const { data: sneakersData, isLoading, error } = useQuery(sneakersQueryOptions(filters));
  const { data: statsData } = useQuery(statsQueryOptions);

  const sneakers = (sneakersData?.sneakers ?? []) as Sneaker[];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total pairs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{statsData?.stats.count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {formatCurrency(statsData?.stats.totalSpend ?? 0)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your collection</h1>
            <p className="text-sm text-muted-foreground">
              Search, filter, and manage every pair you own.
            </p>
          </div>
          <Link
            to="/sneakers/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add pair
          </Link>
        </div>

        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="brand-filter">Brand</Label>
            <Input
              id="brand-filter"
              placeholder="Nike"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition-filter">Condition</Label>
            <Select
              id="condition-filter"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
            >
              <option value="">All conditions</option>
              {sneakerConditions.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort-filter">Sort by</Label>
            <Select id="sort-filter" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="created_at">Date added</option>
              <option value="purchase_date">Purchase date</option>
              <option value="purchase_price">Purchase price</option>
              <option value="brand">Brand</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-filter">Order</Label>
            <Select
              id="order-filter"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Select>
          </div>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading collection...</p> : null}
        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

        {!isLoading && sneakers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                No sneakers yet. Add your first pair to get started.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sneakers.map((sneaker) => (
            <SneakerCard key={sneaker.id} sneaker={sneaker} />
          ))}
        </div>
      </section>
    </div>
  );
}
