import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

const getInitials = (nameStr) => {
  if (!nameStr || typeof nameStr !== 'string') return '';
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColorClass = (nameStr) => {
  const colors = [
    'bg-gradient-to-br from-red-600 to-rose-700 text-white',
    'bg-gradient-to-br from-indigo-600 to-blue-700 text-white',
    'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
    'bg-gradient-to-br from-amber-600 to-orange-700 text-white',
    'bg-gradient-to-br from-purple-600 to-violet-700 text-white',
    'bg-gradient-to-br from-cyan-600 to-blue-600 text-white',
    'bg-gradient-to-br from-rose-600 to-pink-700 text-white',
  ];
  if (!nameStr) return colors[0];
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

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

  const initials = getInitials(name);
  const colorClass = getAvatarColorClass(name);

  if (initials) {
    return (
      <div
        className={`${className} rounded-full ${colorClass} border border-white/20 flex items-center justify-center shrink-0 font-bold select-none shadow-2xs text-center leading-none tracking-wider`}
        onClick={onClick}
        title={title || name}
      >
        <span className="text-[40%] font-extrabold uppercase">{initials}</span>
      </div>
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
