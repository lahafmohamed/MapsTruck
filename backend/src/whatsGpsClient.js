const ensureHttpPrefix = (url) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

const parseNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const inferDeviceName = (raw) =>
  raw.truckName || raw.vehicleName || raw.deviceName || raw.name || raw.plate || `Device ${raw.id ?? "Unknown"}`;

const normalizeTruck = (raw) => {
  const lat = parseNumber(raw.lat ?? raw.latitude ?? raw.gpsLat);
  const lng = parseNumber(raw.lng ?? raw.lon ?? raw.longitude ?? raw.gpsLon);

  if (lat === null || lng === null) {
    return null;
  }

  return {
    id: raw.id ?? raw.deviceId ?? raw.imei ?? `${lat}:${lng}`,
    name: inferDeviceName(raw),
    latitude: lat,
    longitude: lng,
    speed: parseNumber(raw.speed),
    status: raw.status ?? raw.state ?? "unknown",
    updatedAt: raw.updatedAt ?? raw.gpsTime ?? raw.lastUpdate ?? null
  };
};

export const getMockTrucks = () => [
  {
    id: "demo-1",
    name: "Truck Nairobi 01",
    latitude: -1.2921,
    longitude: 36.8219,
    speed: 52,
    status: "moving",
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-2",
    name: "Truck Kampala 02",
    latitude: 0.3476,
    longitude: 32.5825,
    speed: 0,
    status: "idle",
    updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
  }
];

export const fetchTrucksFromWhatsGps = async () => {
  const apiBaseUrl = process.env.WHATSGPS_API_BASE_URL;
  const apiPath = process.env.WHATSGPS_API_PATH || "/api/locations";
  const apiToken = process.env.WHATSGPS_API_TOKEN;

  if (!apiBaseUrl || !apiToken) {
    throw new Error("Missing WHATSGPS_API_BASE_URL or WHATSGPS_API_TOKEN in environment variables.");
  }

  const url = new URL(apiPath, ensureHttpPrefix(apiBaseUrl));
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsGPS API request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload)
    ? payload
    : payload.data ?? payload.devices ?? payload.trucks ?? payload.results ?? [];

  if (!Array.isArray(list)) {
    throw new Error("Unexpected WhatsGPS API payload. Expected an array or a data/devices/trucks/results array.");
  }

  return list.map(normalizeTruck).filter(Boolean);
};
