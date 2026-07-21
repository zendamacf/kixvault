import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

type SneakerImageCarouselProps = {
  images: Array<{ id?: string; url: string }>;
  alt: string;
  className?: string;
};

/** Lazy-loaded image carousel for sneaker galleries. */
export function SneakerImageCarousel({ images, alt, className }: SneakerImageCarouselProps) {
  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-transparent text-xs text-muted-foreground',
          className,
        )}
      >
        No image
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]?.url}
        alt={alt}
        className={cn('rounded-md bg-transparent object-contain', className)}
        loading="lazy"
      />
    );
  }

  return (
    <Carousel className={cn('w-full', className)}>
      <CarouselContent className="ml-0">
        {images.map((image, index) => (
          <CarouselItem key={image.id ?? `${image.url}-${index}`} className="pl-0">
            <img
              src={image.url}
              alt={`${alt} (${index + 1} of ${images.length})`}
              className="h-full w-full rounded-md bg-transparent object-contain"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="bg-background/80" />
      <CarouselNext className="bg-background/80" />
    </Carousel>
  );
}
