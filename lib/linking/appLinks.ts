/** HTTPS host used in connection emails and Universal / App Links. */
export const APP_LINK_HOST = 'agile-athletes.expo.app';

export const APP_LINK_SCHEME = 'oqagileathletes';

/** Public entry route (web + universal link + custom scheme). */
export const CONNECTIONS_ENTRY_PATH = '/connections';

export function buildConnectionsReturnPath(requestId?: string): string {
  if (!requestId) return CONNECTIONS_ENTRY_PATH;
  return `${CONNECTIONS_ENTRY_PATH}?requestId=${encodeURIComponent(String(requestId))}`;
}

/** In-app destination after auth (drawer community screen). */
export function buildConnectionsDestination(requestId?: string): string {
  const query = requestId
    ? `?requestId=${encodeURIComponent(String(requestId))}`
    : '';
  return `/(drawer)/community/connections${query}`;
}
