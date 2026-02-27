import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const DEFAULT_CENTER = [20, 0];

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function FitToMarkers({ trucks }) {
  const map = useMap();

  useEffect(() => {
    if (!trucks.length) return;

    if (trucks.length === 1) {
      map.setView([trucks[0].latitude, trucks[0].longitude], 10);
      return;
    }

    const bounds = L.latLngBounds(trucks.map((truck) => [truck.latitude, truck.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, trucks]);

  return null;
}

function App() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ source: "unknown", fetchedAt: null, total: 0 });

  const loadTrucks = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/trucks");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || payload.message || "Failed to load truck positions.");
      }

      setTrucks(payload.trucks || []);
      setMeta({
        source: payload.source || "unknown",
        fetchedAt: payload.fetchedAt || null,
        total: payload.total ?? payload.count ?? 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error while loading trucks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
    const interval = setInterval(loadTrucks, 30_000);
    return () => clearInterval(interval);
  }, []);

  const mapCenter = useMemo(() => {
    if (trucks.length === 0) return DEFAULT_CENTER;
    return [trucks[0].latitude, trucks[0].longitude];
  }, [trucks]);

  return (
    <main className="layout">
      <header className="header">
        <div>
          <h1>Truck Live Map</h1>
          <p className="subtitle">
            Source: <b>{meta.source}</b> • Last sync: <b>{formatDate(meta.fetchedAt)}</b>
          </p>
        </div>
        <button type="button" onClick={loadTrucks} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="content">
        <aside className="panel">
          <h2>
            Tracked Trucks ({trucks.length}/{meta.total})
          </h2>
          {trucks.length === 0 && !loading ? (
            <p>No truck coordinates returned from WhatsGPS yet.</p>
          ) : (
            <ul>
              {trucks.map((truck) => (
                <li key={truck.id}>
                  <strong>{truck.name}</strong>
                  <div>Status: {truck.status}</div>
                  <div>
                    {truck.latitude.toFixed(5)}, {truck.longitude.toFixed(5)}
                  </div>
                  <div>Speed: {truck.speed ?? "N/A"} km/h</div>
                  <div>Last update: {formatDate(truck.updatedAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="mapShell">
          <MapContainer center={mapCenter} zoom={5} scrollWheelZoom className="map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToMarkers trucks={trucks} />

            {trucks.map((truck) => (
              <Marker key={truck.id} position={[truck.latitude, truck.longitude]}>
                <Popup>
                  <strong>{truck.name}</strong>
                  <br />
                  Status: {truck.status}
                  <br />
                  Speed: {truck.speed ?? "N/A"} km/h
                  <br />
                  Updated: {formatDate(truck.updatedAt)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>
    </main>
  );
}

export default App;
