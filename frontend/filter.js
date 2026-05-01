let selectedLat = null;
let selectedLng = null;

const pinStatus = document.getElementById("pinStatus");
const gpsBtn = document.getElementById("gpsBtn");
const radius = document.getElementById("radius");
const radiusVal = document.getElementById("radiusVal");
const msg = document.getElementById("msg");
const viewBtn = document.getElementById("viewBtn");

radiusVal.textContent = radius.value;
radius.addEventListener("input", () => {
  radiusVal.textContent = radius.value;
});

function setPin(lat, lng) {
  selectedLat = lat;
  selectedLng = lng;
  pinStatus.textContent = `Center: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

const map = L.map("map").setView([39.0416, -94.6275], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

let marker = null;

map.on("click", (e) => {
  const { lat, lng } = e.latlng;
  if (marker) marker.setLatLng([lat, lng]);
  else marker = L.marker([lat, lng]).addTo(map);
  setPin(lat, lng);
});

gpsBtn.addEventListener("click", () => {
  msg.textContent = "Getting location...";
  if (!navigator.geolocation) {
    msg.textContent = "Geolocation not supported.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      map.setView([lat, lng], 15);
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng]).addTo(map);
      setPin(lat, lng);
      msg.textContent = "";
    },
    () => (msg.textContent = "Location permission denied/unavailable."),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

viewBtn.addEventListener("click", () => {
  msg.textContent = "";
  if (selectedLat == null || selectedLng == null) {
    msg.textContent = "Drop a pin to set the filter center.";
    return;
  }

  const filter = {
    lat: selectedLat,
    lng: selectedLng,
    radiusMiles: Number(radius.value),
  };

  localStorage.setItem("reportFilter", JSON.stringify(filter));
  window.location.href = "results.html";
});
