// Coordinates are never inferred from an address: a guessed point could mislead dispatch.
export function validCoordinates(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85.0511
    && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
}

function checked(latValue, lonValue) {
  if (latValue === null || latValue === undefined || latValue === '' ||
      lonValue === null || lonValue === undefined || lonValue === '') return null;
  const lat = Number(latValue);
  const lon = Number(lonValue);
  return validCoordinates(lat, lon) ? { lat, lon } : null;
}

export function extractPoint(input) {
  if (!input) return null;
  if (Array.isArray(input)) {
    // GeoJSON uses [longitude, latitude].
    return input.length >= 2 ? checked(input[1], input[0]) : null;
  }
  if (typeof input === 'string') {
    // Only parse explicit 'lat, lon'. Do not geocode free text or guess.
    const match = input.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    return match ? checked(match[1], match[2]) : null;
  }
  if (typeof input !== 'object') return null;
  const direct = checked(input.latitude ?? input.lat, input.longitude ?? input.lng ?? input.lon);
  if (direct) return direct;
  for (const variant of [input.location?.coordinates, input.coordinates, input.geo?.coordinates,
    input.geometry?.coordinates, input.location, input.geo, input.geometry,
    input.point, input.coordinate, input.coords]) {
    if (!variant || variant === input) continue;
    const candidate = extractPoint(variant);
    if (candidate) return candidate;
  }
  return null;
}

export function extractTripEndpoints(trip) {
  const pickup = extractPoint(trip?.pickup) || extractPoint(trip?.pickupLocation) ||
    extractPoint(trip?.origin) || extractPoint(trip?.startLocation) ||
    extractPoint(trip?.pickupPoint) || extractPoint(trip?.pickupCoordinates) ||
    checked(trip?.pickupLatitude ?? trip?.pickupLat, trip?.pickupLongitude ?? trip?.pickupLng);
  const destination = extractPoint(trip?.destination) || extractPoint(trip?.destinationLocation) ||
    extractPoint(trip?.dropoff) || extractPoint(trip?.endLocation) ||
    extractPoint(trip?.destinationPoint) || extractPoint(trip?.destinationCoordinates) ||
    checked(trip?.destinationLatitude ?? trip?.destinationLat, trip?.destinationLongitude ?? trip?.destinationLng);
  return { pickup, destination };
}

export function routeProfile(serviceCode) {
  const code = String(serviceCode || '').toUpperCase();
  return /(BIKE|MOTO|MOTORBIKE|XE_MAY)/.test(code) ? 'moto' : 'car';
}

export function trackAsiaRouteUrl({ pickup, destination, serviceCode, apiBaseUrl, apiKey }) {
  if (!pickup || !destination || !validCoordinates(pickup.lat, pickup.lon) ||
      !validCoordinates(destination.lat, destination.lon)) return null;
  const base = String(apiBaseUrl || '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(base) || !apiKey) return null;
  const url = new URL(`${base}/route/v1/${routeProfile(serviceCode)}/${pickup.lon},${pickup.lat};${destination.lon},${destination.lat}.json`);
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('overview', 'full');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('key', apiKey);
  return url.toString();
}

export function parseTrackAsiaRoute(payload) {
  if (payload?.code && payload.code !== 'Ok') throw new Error('TrackAsia từ chối tính tuyến.');
  const candidate = payload?.routes?.[0];
  const coords = candidate?.geometry?.coordinates;
  if (candidate?.geometry?.type !== 'LineString' || !Array.isArray(coords) || coords.length < 2 ||
      !coords.every((coord) => Array.isArray(coord) && coord.length >= 2 &&
        validCoordinates(Number(coord[1]), Number(coord[0])))) {
    throw new Error('TrackAsia không trả về tuyến đường hợp lệ.');
  }
  return {
    geometry: { type: 'LineString', coordinates: coords.map((coord) => [Number(coord[0]), Number(coord[1])]) },
    distanceKm: Number.isFinite(candidate.distance) ? candidate.distance / 1000 : null,
    durationMinutes: Number.isFinite(candidate.duration) ? candidate.duration / 60 : null,
  };
}
