import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const DEFAULT_CENTER = [20, 0];

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function App() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <h1>Truck Live Map</h1>
        <button type="button" onClick={loadTrucks} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="content">
        <aside className="panel">
          <h2>Tracked Trucks ({trucks.length})</h2>
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

            {trucks.map((truck) => (
              <Marker key={truck.id} position={[truck.latitude, truck.longitude]}>
                <Popup>
                  <strong>{truck.name}</strong>
                  <br />
                  Status: {truck.status}
                  <br />
                  Speed: {truck.speed ?? "N/A"} km/h
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
