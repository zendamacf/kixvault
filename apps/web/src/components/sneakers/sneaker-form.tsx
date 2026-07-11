import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateSneakerInput, createSneakerSchema, sneakerConditions } from "@kixvault/shared";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCondition } from "@/lib/utils";

type SneakerFormProps = {
  defaultValues?: Partial<CreateSneakerInput>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateSneakerInput) => Promise<void>;
};

export function SneakerForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: SneakerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSneakerInput>({
    resolver: zodResolver(createSneakerSchema),
    defaultValues: {
      brand: "",
      model: "",
      colorway: "",
      size: undefined,
      condition: "deadstock",
      purchasePrice: undefined,
      purchaseDate: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          colorway: values.colorway || null,
          purchasePrice: values.purchasePrice ?? null,
          purchaseDate: values.purchaseDate || null,
          notes: values.notes || null,
        });
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" placeholder="Nike" {...register("brand")} />
          {errors.brand ? <p className="text-sm text-destructive">{errors.brand.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" placeholder="Air Jordan 1" {...register("model")} />
          {errors.model ? <p className="text-sm text-destructive">{errors.model.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="colorway">Colorway</Label>
          <Input id="colorway" placeholder="Chicago" {...register("colorway")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input id="size" type="number" step="0.5" placeholder="10" {...register("size")} />
          {errors.size ? <p className="text-sm text-destructive">{errors.size.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Select id="condition" {...register("condition")}>
            {sneakerConditions.map((condition) => (
              <option key={condition} value={condition}>
                {formatCondition(condition)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase price</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="1"
            placeholder="180"
            {...register("purchasePrice")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase date</Label>
          <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Where you bought them, lace swap, etc."
          {...register("notes")}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
