import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType } from 'embla-carousel';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Carousel3DProps {
    images: { src: string; alt: string; title: string; description: string }[];
    onImageClick: (index: number) => void;
}

export function Carousel3D({ images, onImageClick }: Carousel3DProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'center',
        skipSnaps: false,
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const onSelect = useCallback((api: EmblaCarouselType) => {
        setSelectedIndex(api.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect(emblaApi);
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    useCarousel3dOffsets(emblaApi, cardRefs, images.length);

    return (
        <div className="relative max-w-5xl mx-auto py-12 perspective-1000">
            <div className="overflow-visible" ref={emblaRef}>
                <div className="flex touch-pan-y -ml-4">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="flex-[0_0_60%] min-w-0 pl-4 relative"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            <div
                                ref={(el) => (cardRefs.current[index] = el)}
                                className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl aspect-[16/10] bg-zinc-900 origin-center cursor-pointer group"
                                onClick={() => onImageClick(index)}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <ZoomIn className="w-10 h-10 text-white drop-shadow-lg" />
                                </div>
                            </div>

                            {/* Caption Below */}
                            <div className="mt-6 text-center transition-opacity duration-300">
                                <h4 className="text-white font-bold text-xl tracking-wide">{image.title}</h4>
                                <p className="text-zinc-400 text-sm mt-1">{image.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
                <button
                    onClick={scrollPrev}
                    className="p-3 rounded-full bg-zinc-800/50 hover:bg-amber-500 hover:text-zinc-950 border border-white/10 transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={scrollNext}
                    className="p-3 rounded-full bg-zinc-800/50 hover:bg-amber-500 hover:text-zinc-950 border border-white/10 transition-all"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}

function useCarousel3dOffsets(
    api: EmblaCarouselType | undefined,
    cardRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>,
    cardCount: number
) {
    const rafIdRef = useRef<number>();

    useEffect(() => {
        if (!api || cardCount === 0) return;

        const updateOffsets = () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }

            rafIdRef.current = requestAnimationFrame(() => {
                const engine = api.internalEngine();
                const scrollProgress = api.scrollProgress();
                const scrollSnapList = api.scrollSnapList();

                for (let i = 0; i < cardCount; i++) {
                    const element = cardRefs.current[i];
                    if (!element) continue;

                    // Calculate distance from center in "slide units"
                    let diff = scrollSnapList[i] - scrollProgress;

                    // Handle wrapping for loop
                    if (engine.options.loop) {
                        if (diff > 0.5) diff -= 1;
                        if (diff < -0.5) diff += 1;
                    }

                    // Convert normalized diff (0..1) to slide index diff (e.g., -1, 0, 1)
                    const slideDiff = diff * cardCount;
                    const absSlideDiff = Math.abs(slideDiff);

                    // Visibility threshold (show 2 neighbors on each side)
                    const isVisible = absSlideDiff < 2.5;

                    if (isVisible) {
                        const scale = 1 - Math.min(absSlideDiff * 0.2, 0.5);
                        const opacity = 1 - Math.min(absSlideDiff * 0.3, 0.8);
                        const rotateY = slideDiff * -25; // Rotate to face center
                        const translateX = slideDiff * -45; // Pull neighbors IN towards center (negative value for positive diff)

                        const zIndex = 50 - Math.round(absSlideDiff * 10);
                        const blur = absSlideDiff > 0.5 ? Math.min((absSlideDiff - 0.5) * 5, 8) : 0;

                        element.style.transform = `perspective(1000px) translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`;
                        element.style.opacity = String(opacity);
                        element.style.filter = `blur(${blur}px)`;

                        // Apply zIndex to parent (slide) to handle stacking correctly without breaking Embla loop
                        if (element.parentElement) {
                            element.parentElement.style.zIndex = String(zIndex);
                        }

                        element.style.pointerEvents = absSlideDiff < 0.5 ? 'auto' : 'none';

                        // Control caption visibility (only show for active card)
                        const caption = element.nextElementSibling as HTMLElement;
                        if (caption) {
                            caption.style.opacity = absSlideDiff < 0.3 ? '1' : '0';
                            caption.style.transition = 'opacity 0.3s ease-in-out';
                        }
                    } else {
                        element.style.opacity = '0';
                        element.style.pointerEvents = 'none';

                        // Hide caption for non-visible items too
                        const caption = element.nextElementSibling as HTMLElement;
                        if (caption) {
                            caption.style.opacity = '0';
                        }
                    }
                }
            });
        };

        api.on('select', updateOffsets);
        api.on('scroll', updateOffsets);
        api.on('reInit', updateOffsets);

        updateOffsets();

        return () => {
            api.off('select', updateOffsets);
            api.off('scroll', updateOffsets);
            api.off('reInit', updateOffsets);
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [api, cardRefs, cardCount]);
}
