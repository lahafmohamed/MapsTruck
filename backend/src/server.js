import "dotenv/config";
import cors from "cors";
import express from "express";
import { fetchTrucksFromWhatsGps, getMockTrucks } from "./whatsGpsClient.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());

const parseLimit = (value) => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/trucks", async (req, res) => {
  const useMockData = process.env.WHATSGPS_USE_MOCK === "true";
  const requestedDevice = req.query.device ? String(req.query.device) : null;
  const limit = parseLimit(req.query.limit);

  try {
    const trucks = useMockData ? getMockTrucks() : await fetchTrucksFromWhatsGps();

    const filtered = requestedDevice
      ? trucks.filter((truck) => String(truck.id) === requestedDevice || String(truck.imei || "") === requestedDevice)
      : trucks;

    const result = limit ? filtered.slice(0, limit) : filtered;

    res.json({
      trucks: result,
      count: result.length,
      total: trucks.length,
      filters: {
        device: requestedDevice,
        limit
      },
      source: useMockData ? "mock" : "whatsgps",
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch truck positions from WhatsGPS API.",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});
