// src/AnimatedMarker.jsx
import React, { useEffect, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

export default function AnimatedMarker({ position, icon, duration = 1200 }) {
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !position) return;
    const startLatLng = marker.getLatLng ? marker.getLatLng() : L.latLng(position);
    const endLatLng = L.latLng(position);
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * t;
      const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * t;
      marker.setLatLng([lat, lng]);
      if (t < 1) requestAnimationFrame(animate);
      else marker.setLatLng(endLatLng);
    };

    requestAnimationFrame(animate);
    // optional: comment in to keep map centered
    // map.panTo(endLatLng, { animate: true, duration: 0.5 });
  }, [position, duration, map]);

  return <Marker ref={markerRef} position={position} icon={icon} />;
}
