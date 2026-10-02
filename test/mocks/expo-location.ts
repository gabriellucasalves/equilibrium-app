export const Accuracy = { Balanced: 3 };

export async function getForegroundPermissionsAsync() {
  return { granted: false, status: 'undetermined' };
}

export async function requestForegroundPermissionsAsync() {
  return { granted: false, status: 'denied' };
}

export async function getCurrentPositionAsync() {
  return {
    coords: { latitude: -16.066, longitude: -47.976 },
  };
}

export async function reverseGeocodeAsync() {
  return [
    {
      city: 'Valparaíso de Goiás',
      region: 'GO',
      isoCountryCode: 'BR',
    },
  ];
}
