import { useState } from 'react';
import type { User } from '../context/AuthContext';
import { avatarUrl, initialOf } from '../utils/profile';

interface Props {
  user: Pick<User, 'name' | 'avatar'>;
  className?: string; // ukuran, mis. "h-9 w-9"
}

export default function UserAvatar({ user, className = 'h-9 w-9' }: Props) {
  const src = avatarUrl(user.avatar);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && src !== failedSrc) {
    return <img src={src} alt="" onError={() => setFailedSrc(src)} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white`}
    >
      {initialOf(user.name)}
    </span>
  );
}