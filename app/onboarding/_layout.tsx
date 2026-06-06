import { Stack } from 'expo-router';
import { useMarkAppInteractive } from '../../hooks/useMarkAppInteractive';

export default function OnboardingLayout() {
  useMarkAppInteractive();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
