// src/utils.js
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function calcSpeedKmH(prev, curr) {
  if (!prev || !curr || !prev.timestamp || !curr.timestamp) return 0;
  const d = haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  const dtHours = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);
  if (dtHours <= 0) return 0;
  return d / dtHours;
}
