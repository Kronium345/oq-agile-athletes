import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { SERVER_URL } from '../api/axios';
import { useAuthContext } from '../app/AuthProvider';

const DEFAULT_AVATAR =
  'https://img.icons8.com/?size=100&id=FDI4JxAMODWm&format=png&color=000000';

function resolveAvatarUrl(avatarPath?: string | null): string {
  if (!avatarPath) return DEFAULT_AVATAR;
  if (avatarPath.startsWith('http')) return avatarPath;
  const cleanPath = avatarPath.replace(/^\/+/, '');
  return `${SERVER_URL}/${cleanPath}`;
}

export function useUserAvatar(): string {
  const { user } = useAuthContext();
  const [uri, setUri] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        const parsed = stored ? JSON.parse(stored) : null;
        const path =
          parsed?.avatar ?? (user as { avatar?: string } | null)?.avatar;
        if (!cancelled) {
          setUri(resolveAvatarUrl(path));
        }
      } catch {
        if (!cancelled) setUri(DEFAULT_AVATAR);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return uri;
}
