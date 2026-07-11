import { cn } from "@/lib/utils";

type SneakerThumbnailProps = {
  imageUrl: string | null;
  alt: string;
  className?: string;
};

export function SneakerThumbnail({ imageUrl, alt, className }: SneakerThumbnailProps) {
  if (!imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-transparent text-xs text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={cn("rounded-md bg-transparent object-contain", className)}
      loading="lazy"
    />
  );
}
