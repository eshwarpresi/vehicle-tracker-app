// src/VehicleMap.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { calcSpeedKmH } from "./utils";
import "leaflet/dist/leaflet.css";

const carIcon = L.divIcon({
  html: "🚗",
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Separate component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function VehicleMap() {
  const [route, setRoute] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [clickTarget, setClickTarget] = useState(null);
  const [isMovingToClick, setIsMovingToClick] = useState(false);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

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

  // Handle map clicks
  const handleMapClick = (latlng) => {
    console.log("Map clicked at:", latlng); // Debug log
    
    if (playing) {
      setPlaying(false); // Stop automatic playback when clicking
      clearInterval(intervalRef.current);
    }
    
    const { lat, lng } = latlng;
    setClickTarget([lat, lng]);
    setIsMovingToClick(true);
    
    // Generate a smooth path from current position to clicked position
    const currentPos = route[index] ? [route[index].latitude, route[index].longitude] : [17.385044, 78.486671];
    generateSmoothPath(currentPos, [lat, lng]);
  };

  // Generate smooth path between two points
  const generateSmoothPath = (start, end) => {
    const [startLat, startLng] = start;
    const [endLat, endLng] = end;
    
    const steps = 15; // Number of intermediate points
    const newPoints = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Simple linear interpolation
      const lat = startLat + (endLat - startLat) * t;
      const lng = startLng + (endLng - startLng) * t;
      
      newPoints.push({
        latitude: lat,
        longitude: lng,
        timestamp: new Date(Date.now() + i * 1000).toISOString()
      });
    }
    
    setRoute(prevRoute => [...prevRoute.slice(0, index + 1), ...newPoints]);
    // Start playing automatically after generating new path
    setTimeout(() => setPlaying(true), 100);
  };

  // Original playback logic
  useEffect(() => {
    if (playing && route.length && index < route.length - 1) {
      intervalRef.current = setInterval(() => {
        setIndex(i => {
          const newIndex = Math.min(i + 1, route.length - 1);
          
          // If we reached the end of a click-generated path
          if (isMovingToClick && newIndex === route.length - 1) {
            setIsMovingToClick(false);
            // Keep the click target visible for a moment
            setTimeout(() => setClickTarget(null), 2000);
          }
          
          return newIndex;
        });
      }, 500); // Movement speed
    }
    
    return () => clearInterval(intervalRef.current);
  }, [playing, route, index, isMovingToClick]);

  const current = route[index] || null;
  const prev = route[index - 1] || null;
  const currentPos = current ? [current.latitude, current.longitude] : [17.385044, 78.486671];
  const fullCoords = useMemo(() => route.map(p => [p.latitude, p.longitude]), [route]);
  const traveledCoords = useMemo(() => route.slice(0, index + 1).map(p => [p.latitude, p.longitude]), [route, index]);
  const speed = calcSpeedKmH(prev, current).toFixed(2);

  // Reset to original route
  const resetToOriginalRoute = async () => {
    setPlaying(false);
    setIsMovingToClick(false);
    setClickTarget(null);
    setIndex(0);
    clearInterval(intervalRef.current);
    
    try {
      const response = await fetch("/dummy-route.json");
      const data = await response.json();
      setRoute(data);
      if (data && data.length && mapRef.current) {
        mapRef.current.setView([data[0].latitude, data[0].longitude], 15);
      }
    } catch (error) {
      console.error("Error resetting route:", error);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={currentPos}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
          console.log("Map created"); // Debug log
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        
        {/* Map click handler */}
        <MapClickHandler onMapClick={handleMapClick} />

        {fullCoords.length > 0 && (
          <Polyline positions={fullCoords} pathOptions={{ color: "#2c7be5", weight: 4, opacity: 0.7 }} />
        )}
        {traveledCoords.length > 0 && (
          <Polyline positions={traveledCoords} pathOptions={{ color: "#ef4444", weight: 5, opacity: 0.9 }} />
        )}

        {/* Click target marker */}
        {clickTarget && (
          <CircleMarker 
            center={clickTarget} 
            radius={8} 
            pathOptions={{ color: "#10b981", fillColor: "#10b981", weight: 3, fillOpacity: 0.8 }}
          >
            <Popup>
              <div>🎯 Target Destination</div>
              <div>Lat: {clickTarget[0].toFixed(6)}</div>
              <div>Lng: {clickTarget[1].toFixed(6)}</div>
            </Popup>
          </CircleMarker>
        )}

        {current && (
          <Marker
            ref={markerRef}
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
                <div>📊 Status: {isMovingToClick ? "Moving to Target" : playing ? "Running" : "Stopped"}</div>
                <div>📅 Index: {index + 1} / {route.length}</div>
                {clickTarget && (
                  <div style={{ marginTop: 8, padding: 4, background: "#f0fdf4", borderRadius: 4 }}>
                    🎯 Moving to target...
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}

        {current && (
          <CircleMarker 
            center={currentPos} 
            radius={6} 
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1 }}
          />
        )}
      </MapContainer>

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          background: "white",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          zIndex: 1000,
          minWidth: '250px',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
          Vehicle Simulation
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: 'wrap', marginBottom: 12 }}>
          <button 
            onClick={() => setPlaying(p => !p)} 
            style={{ 
              padding: "8px 16px", 
              background: playing ? "#ef4444" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            {playing ? "⏸️ Pause" : "▶️ Play"}
          </button>
          <button 
            onClick={resetToOriginalRoute} 
            style={{ 
              padding: "8px 16px", 
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            🔄 Reset Route
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
          {isMovingToClick ? 
            "🎯 Vehicle is moving to your click target..." : 
            "📍 Click anywhere on the map to move vehicle to that location"}
        </div>
      </div>
    </div>
  );
}