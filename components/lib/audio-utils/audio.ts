import { Audio } from 'expo-av';

export async function recordAudio(): Promise<Audio.Recording> {
  try {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    await recording.startAsync();

    return recording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}