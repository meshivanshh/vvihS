import { useState } from 'react';
import { Compass } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
}

export function ResilientImage({ src, alt, fallbackTitle, className = '' }: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EAE6DF] via-[#DFDBD2] to-[#D1CCC0] text-[#3F3E3B] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Compass className="w-7 h-7 text-[#0F4C5C] mb-2 opacity-80" strokeWidth={1.5} />
        <span className="font-editorial text-lg font-medium tracking-tight">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
