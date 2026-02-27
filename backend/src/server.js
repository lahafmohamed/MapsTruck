import "dotenv/config";
import cors from "cors";
import express from "express";
import { fetchTrucksFromWhatsGps, getMockTrucks } from "./whatsGpsClient.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/trucks", async (_req, res) => {
  const useMockData = process.env.WHATSGPS_USE_MOCK === "true";

  try {
    const trucks = useMockData ? getMockTrucks() : await fetchTrucksFromWhatsGps();
    res.json({
      trucks,
      count: trucks.length,
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
