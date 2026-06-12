import { useEffect } from 'react';
import { recordAppActivity } from '../lib/appActivity';

/** Records today's app usage once per session when the user is authenticated. */
export function useRecordAppActivity(userId: string | undefined | null) {
  useEffect(() => {
    if (!userId) return;
    void recordAppActivity(String(userId));
  }, [userId]);
}
