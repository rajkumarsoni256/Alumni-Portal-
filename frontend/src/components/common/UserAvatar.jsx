import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export const UserAvatar = ({ 
  src, 
  name = '', 
  className = 'w-10 h-10', 
  iconClassName = 'w-5 h-5', 
  alt = '',
  onClick,
  title
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  // Filter out stock mock URLs and stale browser blob URLs before rendering img element
  const isInvalidOrBlob = Boolean(
    src &&
    typeof src === 'string' &&
    (
      src.startsWith('blob:') ||
      src.includes('unsplash.com') ||
      src.includes('randomuser.me') ||
      src.includes('via.placeholder.com')
    )
  );

  const hasRealImage = Boolean(
    src && 
    typeof src === 'string' && 
    src.trim() !== '' && 
    !isInvalidOrBlob && 
    !imgError
  );

  if (hasRealImage) {
    return (
      <img
        src={src}
        alt={alt || name || 'User avatar'}
        className={`${className} rounded-full object-cover border border-slate-200 shrink-0`}
        onClick={onClick}
        title={title || name}
        onError={() => setImgError(true)}
      />
    );
  }

  // Default User Icon fallback
  return (
    <div
      className={`${className} rounded-full bg-slate-100 border border-slate-300/90 text-slate-500 flex items-center justify-center shrink-0 font-bold select-none shadow-2xs`}
      onClick={onClick}
      title={title || name}
    >
      <User className={iconClassName || 'w-1/2 h-1/2 text-slate-500'} />
    </div>
  );
};
