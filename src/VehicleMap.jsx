// src/VehicleMap.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import AnimatedMarker from "./AnimatedMarker";
import { calcSpeedKmH } from "./utils";
import "leaflet/dist/leaflet.css";

const carIcon = L.divIcon({
  html: "🚗",
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function VehicleMap() {
  const [route, setRoute] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetch("/dummy-route.json")
      .then(r => r.json())
      .then(data => {
        setRoute(data);
        if (data && data.length && mapRef.current) {
          mapRef.current.setView([data[0].latitude, data[0].longitude], 15);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (playing && route.length && index < route.length - 1) {
      intervalRef.current = setInterval(() => {
        setIndex(i => Math.min(i + 1, route.length - 1));
      }, 1500);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, route, index]);

  const current = route[index] || null;
  const prev = route[index - 1] || null;
  const currentPos = current ? [current.latitude, current.longitude] : [17.385044, 78.486671];
  const fullCoords = useMemo(() => route.map(p => [p.latitude, p.longitude]), [route]);
  const traveledCoords = useMemo(() => route.slice(0, index + 1).map(p => [p.latitude, p.longitude]), [route, index]);
  const speed = calcSpeedKmH(prev, current).toFixed(2);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={currentPos}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {fullCoords.length > 0 && (
          <Polyline positions={fullCoords} pathOptions={{ color: "#2c7be5", weight: 4, opacity: 0.7 }} />
        )}
        {traveledCoords.length > 0 && (
          <Polyline positions={traveledCoords} pathOptions={{ color: "#ef4444", weight: 5, opacity: 0.9 }} />
        )}

        {current && (
          <Marker
            position={currentPos}
            icon={carIcon}
            eventHandlers={{
              click: () => setShowPopup(true),
            }}
          />
        )}

        {showPopup && current && (
          <Popup
            position={currentPos}
            onClose={() => setShowPopup(false)}
            autoClose={false}
            closeButton={true}
          >
            <div style={{ width: 250 }}>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>🚘 WIRELESS</div>
              <div style={{ color: "#16a34a", fontWeight: "bold" }}>
                {new Date(current.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <div>📍 Address: Vijay Nagar Rd (sample)</div>
                <div>💨 Speed: {speed} km/h</div>
                <div>🔋 Battery: 16%</div>
                <div>📊 Status: Running</div>
                <div>📅 Index: {index + 1} / {route.length}</div>
              </div>
            </div>
          </Popup>
        )}

        {current && <CircleMarker center={currentPos} radius={6} fillColor="#ef4444" />}
      </MapContainer>

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          background: "white",
          padding: 12,
          borderRadius: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          zIndex: 1000,
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Vehicle Simulation</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPlaying(p => !p)} style={{ padding: "8px 12px" }}>
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => { setPlaying(false); setIndex(0); }} style={{ padding: "8px 12px" }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
