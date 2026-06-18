import { Stack } from 'expo-router';
import { useMarkAppInteractive } from '../../hooks/useMarkAppInteractive';
import { useOnboardingGuard } from '../../hooks/useOnboardingGuard';

export default function OnboardingLayout() {
  useMarkAppInteractive();
  useOnboardingGuard();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
