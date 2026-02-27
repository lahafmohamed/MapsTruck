const ensureHttpPrefix = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const inferDeviceName = (raw) =>
  firstDefined(raw.truckName, raw.vehicleName, raw.deviceName, raw.name, raw.plate, raw.carno, raw.licensePlate) ||
  `Device ${firstDefined(raw.id, raw.deviceId, raw.imei, "Unknown")}`;

const inferLatitude = (raw) => parseNumber(firstDefined(raw.lat, raw.latitude, raw.gpsLat, raw?.position?.lat));

const inferLongitude = (raw) =>
  parseNumber(firstDefined(raw.lng, raw.lon, raw.longitude, raw.gpsLon, raw?.position?.lng, raw?.position?.lon));

const normalizeTruck = (raw) => {
  const latitude = inferLatitude(raw);
  const longitude = inferLongitude(raw);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    id: firstDefined(raw.id, raw.deviceId, raw.imei, `${latitude}:${longitude}`),
    imei: firstDefined(raw.imei, raw.deviceImei, null),
    name: inferDeviceName(raw),
    latitude,
    longitude,
    speed: parseNumber(firstDefined(raw.speed, raw.speedKph, raw?.gps?.speed)),
    direction: parseNumber(firstDefined(raw.direction, raw.course)),
    status: firstDefined(raw.status, raw.state, raw.online ? "online" : null, "unknown"),
    updatedAt: firstDefined(raw.updatedAt, raw.gpsTime, raw.lastUpdate, raw.positionTime, null)
  };
};

const parseArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;

  const candidate = firstDefined(payload?.data, payload?.devices, payload?.trucks, payload?.results, payload?.rows, payload?.list);

  if (Array.isArray(candidate)) return candidate;
  return null;
};

const withJsonHeaders = (headers = {}) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...headers
});

const throwHttpError = async (response, context) => {
  const body = await response.text();
  throw new Error(`${context} failed (${response.status}): ${body}`);
};

const loginAndGetToken = async () => {
  const apiBaseUrl = process.env.WHATSGPS_API_BASE_URL;
  const loginPath = process.env.WHATSGPS_LOGIN_PATH;
  const username = process.env.WHATSGPS_USERNAME;
  const password = process.env.WHATSGPS_PASSWORD;

  if (!apiBaseUrl || !loginPath || !username || !password) {
    throw new Error(
      "Missing WHATSGPS_API_BASE_URL, WHATSGPS_LOGIN_PATH, WHATSGPS_USERNAME, or WHATSGPS_PASSWORD for login auth mode."
    );
  }

  const loginUrl = new URL(loginPath, ensureHttpPrefix(apiBaseUrl));
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: withJsonHeaders(),
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    await throwHttpError(response, "WhatsGPS login request");
  }

  const payload = await response.json();
  const token = firstDefined(payload?.token, payload?.data?.token, payload?.accessToken, payload?.data?.accessToken);

  if (!token) {
    throw new Error("WhatsGPS login succeeded but no token was present in response payload.");
  }

  return token;
};

const fetchRawDevices = async (token) => {
  const apiBaseUrl = process.env.WHATSGPS_API_BASE_URL;
  const apiPath = process.env.WHATSGPS_API_PATH || "/api/locations";

  if (!apiBaseUrl) {
    throw new Error("Missing WHATSGPS_API_BASE_URL in environment variables.");
  }

  const url = new URL(apiPath, ensureHttpPrefix(apiBaseUrl));
  const response = await fetch(url, {
    headers: withJsonHeaders(token ? { Authorization: `Bearer ${token}` } : {})
  });

  if (!response.ok) {
    await throwHttpError(response, "WhatsGPS locations request");
  }

  const payload = await response.json();
  const list = parseArrayPayload(payload);

  if (!list) {
    throw new Error("Unexpected WhatsGPS payload. Expected array or data/devices/trucks/results/rows/list array.");
  }

  return list;
};

const resolveAuthToken = async () => {
  const authMode = (process.env.WHATSGPS_AUTH_MODE || "bearer").toLowerCase();

  if (authMode === "none") return null;
  if (authMode === "login") {
    return loginAndGetToken();
  }

  const token = process.env.WHATSGPS_API_TOKEN;
  if (!token) {
    throw new Error("Missing WHATSGPS_API_TOKEN for bearer auth mode.");
  }

  return token;
};

export const getMockTrucks = () => [
  {
    id: "demo-1",
    imei: "123456789012345",
    name: "Truck Nairobi 01",
    latitude: -1.2921,
    longitude: 36.8219,
    speed: 52,
    direction: 70,
    status: "moving",
    updatedAt: new Date().toISOString()
  },
  {
    id: "demo-2",
    imei: "987654321098765",
    name: "Truck Kampala 02",
    latitude: 0.3476,
    longitude: 32.5825,
    speed: 0,
    direction: 180,
    status: "idle",
    updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
  }
];

export const fetchTrucksFromWhatsGps = async () => {
  const token = await resolveAuthToken();
  const list = await fetchRawDevices(token);
  return list.map(normalizeTruck).filter(Boolean);
};
