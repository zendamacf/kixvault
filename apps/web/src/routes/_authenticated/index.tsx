import { sneakerConditions } from "@kixvault/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/collection/empty-state";
import { SneakerGridSkeleton } from "@/components/collection/sneaker-grid-skeleton";
import { StatsCards } from "@/components/collection/stats-cards";
import { SneakerCard } from "@/components/sneakers/sneaker-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/lib/hooks";
import { type Sneaker, sneakersQueryOptions, statsQueryOptions } from "@/lib/queries";
import { formatCondition } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: CollectionPage,
});

function CollectionPage() {
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");

  const debouncedBrand = useDebouncedValue(brand.trim(), 300);

  const filters = useMemo(
    () => ({
      brand: debouncedBrand || undefined,
      condition: condition || undefined,
      sort,
      order,
    }),
    [debouncedBrand, condition, sort, order],
  );

  const hasActiveFilters = Boolean(debouncedBrand || condition);

  const {
    data: sneakersData,
    isLoading,
    isFetching,
    error,
  } = useQuery(sneakersQueryOptions(filters));
  const { data: statsData, isLoading: statsLoading } = useQuery(statsQueryOptions);

  const sneakers = (sneakersData?.sneakers ?? []) as Sneaker[];
  const totalCount = statsData?.stats.count ?? 0;

  function clearFilters() {
    setBrand("");
    setCondition("");
    setSort("created_at");
    setOrder("desc");
  }

  return (
    <div className="space-y-8">
      <StatsCards
        count={statsData?.stats.count}
        totalSpend={statsData?.stats.totalSpend}
        avgSpend={statsData?.stats.avgSpend}
        isLoading={statsLoading}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your collection</h1>
            <p className="text-sm text-muted-foreground">
              Search, filter, and manage every pair you own.
            </p>
          </div>
          <Link
            to="/sneakers/new"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Add pair
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">Filters</p>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                    {formatCondition(value)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort-filter">Sort by</Label>
              <Select
                id="sort-filter"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
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
        </div>

        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {isLoading || isFetching
              ? "Updating results..."
              : `${sneakers.length} ${sneakers.length === 1 ? "pair" : "pairs"} shown`}
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

        {isLoading ? <SneakerGridSkeleton /> : null}

        {!isLoading && sneakers.length === 0 && totalCount === 0 ? (
          <EmptyState
            title="Your vault is empty"
            description="Add your first pair to start tracking brands, sizes, and spend."
            actionLabel="Add your first pair"
            actionTo="/sneakers/new"
          />
        ) : null}

        {!isLoading && sneakers.length === 0 && totalCount > 0 ? (
          <EmptyState
            title="No matches found"
            description="Try a different brand or condition, or clear your filters."
            onClearFilters={clearFilters}
          />
        ) : null}

        {!isLoading && sneakers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sneakers.map((sneaker) => (
              <SneakerCard key={sneaker.id} sneaker={sneaker} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
