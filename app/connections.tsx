import { Redirect, useLocalSearchParams } from 'expo-router';

/** Deep link entry: oqagileathletes://connections?requestId=... */
export default function ConnectionsDeepLinkScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const href = requestId
    ? (`/(drawer)/community/connections?requestId=${encodeURIComponent(String(requestId))}` as const)
    : '/(drawer)/community/connections';

  return <Redirect href={href} />;
}
