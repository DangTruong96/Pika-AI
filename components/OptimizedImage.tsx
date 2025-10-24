import React, { useState, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  highResSrc: string;
  lowResSrc?: string;
}

const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ highResSrc, lowResSrc, className, alt, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const hasLowRes = lowResSrc && lowResSrc !== highResSrc;

    useEffect(() => {
      // This effect preloads the image and sets the loaded state.
      // This is more reliable than onLoad for cached images.
      if (!highResSrc) {
        setIsLoaded(false);
        return;
      }
      let isCancelled = false;
      const img = new Image();
      img.src = highResSrc;
      img.onload = () => {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      };
      // Handle cases where the image is already in the browser cache
      if (img.complete) {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
      return () => {
        isCancelled = true;
      };
    }, [highResSrc]);

    return (
      <>
        {hasLowRes && (
          <img
            src={lowResSrc}
            alt="" // Decorative, alt is on the main image
            className={`${className} absolute filter blur-sm scale-105 transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
            aria-hidden="true"
          />
        )}
        <img
          ref={ref}
          src={highResSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ease-in-out ${isLoaded || !hasLowRes ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      </>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
export default OptimizedImage;
