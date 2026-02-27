# MapsTruck (React + Node.js)

A full-stack starter for visualizing truck locations from the WhatsGPS API.

## Stack
- **Frontend:** React + Vite + React Leaflet (OpenStreetMap)
- **Backend:** Node.js + Express

## 1) Install dependencies

```bash
npm install
```

## 2) Configure backend

```bash
cp backend/.env.example backend/.env
```

### Recommended local startup
Keep mock mode enabled first:

```env
WHATSGPS_USE_MOCK=true
```

Then run and verify UI before integrating live API credentials.

### WhatsGPS live mode
Set:

```env
WHATSGPS_USE_MOCK=false
WHATSGPS_API_BASE_URL=...
WHATSGPS_API_PATH=...
```

Choose auth mode:

1. `WHATSGPS_AUTH_MODE=bearer` (default)
   - `WHATSGPS_API_TOKEN=...`

2. `WHATSGPS_AUTH_MODE=login`
   - `WHATSGPS_LOGIN_PATH=...`
   - `WHATSGPS_USERNAME=...`
   - `WHATSGPS_PASSWORD=...`

3. `WHATSGPS_AUTH_MODE=none`
   - for open/test endpoints that do not require authorization.

## 3) Run full app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## API endpoint used by frontend

`GET /api/trucks`

Optional query parameters:
- `device=<id-or-imei>` filter to one device
- `limit=<n>` return first N results

Response shape:

```json
{
  "trucks": [
    {
      "id": "truck-id",
      "imei": "123456789012345",
      "name": "Truck Name",
      "latitude": 0,
      "longitude": 0,
      "speed": 0,
      "direction": 0,
      "status": "moving",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "total": 12,
  "source": "whatsgps",
  "fetchedAt": "2026-01-01T00:00:00.000Z"
}
```

If your WhatsGPS payload fields differ from the normalizer assumptions, edit `backend/src/whatsGpsClient.js`.
