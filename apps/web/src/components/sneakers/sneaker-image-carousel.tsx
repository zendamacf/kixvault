import { useCallback, useState } from 'react';
import {
  Carousel,
  type CarouselApi,
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

const SLIDE_RENDER_BUFFER = 1;

function shouldRenderSlide(index: number, selectedIndex: number): boolean {
  return Math.abs(index - selectedIndex) <= SLIDE_RENDER_BUFFER;
}

/** Lazy-loaded image carousel for sneaker galleries. */
export function SneakerImageCarousel({ images, alt, className }: SneakerImageCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleCarouselApi = useCallback((api: CarouselApi) => {
    if (!api) {
      return;
    }

    const updateSelectedIndex = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    updateSelectedIndex();
    api.on('select', updateSelectedIndex);
    api.on('reInit', updateSelectedIndex);
  }, []);

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
    <Carousel
      key={images.map((image, index) => image.id ?? `${image.url}-${index}`).join('|')}
      className={cn('w-full', className)}
      setApi={handleCarouselApi}
    >
      <CarouselContent className="ml-0">
        {images.map((image, index) => (
          <CarouselItem key={image.id ?? `${image.url}-${index}`} className="pl-0">
            {shouldRenderSlide(index, selectedIndex) ? (
              <img
                src={image.url}
                alt={`${alt} (${index + 1} of ${images.length})`}
                className="h-full w-full rounded-md bg-transparent object-contain"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="h-full w-full rounded-md bg-transparent" aria-hidden />
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="bg-background/80" />
      <CarouselNext className="bg-background/80" />
    </Carousel>
  );
}
