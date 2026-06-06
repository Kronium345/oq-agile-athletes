import * as Location from 'expo-location';

export type DeviceLocationResult = {
  postcode: string;
  latitude: number;
  longitude: number;
};

export async function getDevicePostcode(): Promise<DeviceLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to use this feature.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const places = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });

  const place = places[0];
  const postcode = place?.postalCode?.trim().toUpperCase();
  if (!postcode) {
    throw new Error(
      'Could not detect a postcode from your location. Enter it manually.',
    );
  }

  return {
    postcode,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
