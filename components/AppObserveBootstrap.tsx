import { useAuthContext } from '../app/AuthProvider';
import { useMarkAppInteractive } from '../hooks/useMarkAppInteractive';

/** Marks the app interactive once session bootstrap finishes. */
export function AppObserveBootstrap() {
  const { isLoading } = useAuthContext();
  useMarkAppInteractive(!isLoading);
  return null;
}
