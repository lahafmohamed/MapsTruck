# MapsTruck (React + Node.js)

A starter full-stack app for visualizing truck locations from the WhatsGPS API.

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

- For quick local demo, keep `WHATSGPS_USE_MOCK=true`.
- For real WhatsGPS data:
  - set `WHATSGPS_USE_MOCK=false`
  - set `WHATSGPS_API_BASE_URL`
  - set `WHATSGPS_API_PATH`
  - set `WHATSGPS_API_TOKEN`

## 3) Run full app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## API endpoint used by frontend

- `GET /api/trucks` on backend (frontend calls this via Vite proxy).

The backend normalizes common location payload fields to:

```json
{
  "id": "truck-id",
  "name": "Truck Name",
  "latitude": 0,
  "longitude": 0,
  "speed": 0,
  "status": "moving",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

If your WhatsGPS payload structure is different, update `backend/src/whatsGpsClient.js` normalization fields.
