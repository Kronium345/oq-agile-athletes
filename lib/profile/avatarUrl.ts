import { SERVER_URL } from '../../api/axios';

const DEFAULT_AVATAR =
  'https://img.icons8.com/?size=100&id=FDI4JxAMODWm&format=png&color=000000';

/** Resolve avatar paths for display (local file, remote preset, or API-relative path). */
export function resolveAvatarDisplayUrl(
  avatarPath?: string | null,
  serverUrl: string = SERVER_URL,
): string {
  if (!avatarPath) return DEFAULT_AVATAR;
  if (
    avatarPath.startsWith('http') ||
    avatarPath.startsWith('file://') ||
    avatarPath.startsWith('content://')
  ) {
    return avatarPath;
  }
  const cleanPath = avatarPath.replace(/^\/+/, '');
  return `${serverUrl}/${cleanPath}`;
}

export function getDefaultAvatarUrl(): string {
  return DEFAULT_AVATAR;
}
