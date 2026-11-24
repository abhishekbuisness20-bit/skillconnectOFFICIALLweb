import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface CorporateMediaFrameProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  aspectClassName?: string;
}

export function CorporateMediaFrame({
  src,
  alt,
  caption,
  className = '',
  aspectClassName = 'aspect-video',
}: CorporateMediaFrameProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#090F22] ${className}`}
    >
      {failed ? (
        <div
          className={`w-full ${aspectClassName} flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#090F22] via-[#070B1E] to-[#050814] p-6 text-center`}
        >
          <Building2 className="w-8 h-8 text-cyan-400" />
          <p className="text-xs font-medium text-slate-300 max-w-xs">{alt}</p>
        </div>
      ) : (
        <div className={`relative w-full ${aspectClassName}`}>
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#050814]/85 via-[#050814]/20 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </div>
      )}
      {caption && (
        <figcaption className="px-5 py-3 border-t border-white/10 bg-[#070B1E] text-xs text-slate-300">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
