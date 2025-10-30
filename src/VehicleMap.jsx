// src/VehicleMap.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
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
  const [showInfo, setShowInfo] = useState(false);
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
        {fullCoords.length > 0 && <Polyline positions={fullCoords} pathOptions={{ color: "#2c7be5", weight: 4, opacity: 0.7 }} />}
        {traveledCoords.length > 0 && <Polyline positions={traveledCoords} pathOptions={{ color: "#ef4444", weight: 5, opacity: 0.9 }} />}
        {current && <AnimatedMarker position={currentPos} icon={carIcon} duration={1000} />}
        {current && <CircleMarker center={currentPos} radius={6} fillColor="#ef4444" />}
      </MapContainer>

      {/* Controls */}
      <div style={{
        position: "absolute", left: 16, bottom: 16, background: "white",
        padding: 12, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.12)"
      }}>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Vehicle Simulation</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPlaying(p => !p)} style={{ padding: "8px 12px" }}>
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => { setPlaying(false); setIndex(0); }} style={{ padding: "8px 12px" }}>
            Reset
          </button>
          <button onClick={() => setShowInfo(s => !s)} style={{ padding: "8px 12px" }}>
            Info
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 12 }}>
          <div>Index: {index + 1} / {route.length || 0}</div>
          <div>Coord: {current ? `${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}` : "-"}</div>
          <div>Time: {current ? new Date(current.timestamp).toLocaleTimeString() : "-"}</div>
          <div>Speed: {speed} km/h</div>
        </div>
      </div>

      {/* Info popup-like card (student style) */}
      {showInfo && current && (
        <div style={{
          position: "absolute", right: 24, top: 24, width: 320, background: "#fff",
          padding: 14, borderRadius: 10, boxShadow: "0 12px 30px rgba(0,0,0,0.15)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>WIRELESS</div>
            <div style={{ color: "#2b9348", fontWeight: 600 }}>{new Date(current.timestamp).toLocaleString()}</div>
          </div>

          <div style={{ fontSize: 13, marginBottom: 10 }}>
            <div style={{ marginBottom: 8 }}>Address: Vijay Nagar Rd (sample)</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div><div style={{ fontSize: 12 }}>Speed</div><div style={{ fontWeight: 700 }}>{speed} km/h</div></div>
              <div><div style={{ fontSize: 12 }}>Battery</div><div style={{ fontWeight: 700 }}>16%</div></div>
              <div><div style={{ fontSize: 12 }}>Status</div><div style={{ fontWeight: 700 }}>Running</div></div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <button onClick={() => setShowInfo(false)} style={{ padding: "6px 10px" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
