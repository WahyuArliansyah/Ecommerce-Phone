import { useState } from 'react';
import { useAuth, type User } from '../context/AuthContext';
import { avatarUrl, initialOf } from '../utils/profile';

interface Props {
  user: Pick<User, 'name' | 'avatar'>;
  className?: string; // ukuran, mis. "h-9 w-9"
}

export default function UserAvatar({ user, className = 'h-9 w-9' }: Props) {
  const { syncing } = useAuth();
  const src = avatarUrl(user.avatar);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasPhoto = !!src && src !== failedSrc;

  // Data belum selesai disinkronkan dan belum ada foto: tampilkan placeholder netral, bukan huruf,
  // supaya tidak "berkedip" huruf → foto
  if (!hasPhoto && syncing) {
    return <span aria-hidden="true" className={`${className} rounded-full bg-slate-200 motion-safe:animate-pulse`} />;
  }

  if (!hasPhoto) {
    return (
      <span
        aria-hidden="true"
        className={`${className} flex items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white`}
      >
        {initialOf(user.name)}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={`${className} relative block overflow-hidden rounded-full bg-slate-200`}>
      <img
        src={src}
        alt=""
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        className={`h-full w-full object-cover transition-opacity duration-200 ${loadedSrc === src ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  );
}