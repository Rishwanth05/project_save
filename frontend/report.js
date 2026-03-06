const API_BASE = "http://localhost:5000";

/* =========================
   Helpers
========================= */
function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function getPinnedLocation() {
  const keys = ["pinLocation", "selectedLocation", "reportPin", "reportFilter"];
  for (const k of keys) {
    try {
      const obj = JSON.parse(localStorage.getItem(k));
      if (obj && typeof obj.lat === "number" && typeof obj.lng === "number") {
        return { lat: obj.lat, lng: obj.lng };
      }
    } catch {}
  }
  return null;
}

function setPinnedLocation(lat, lng) {
  const loc = { lat: Number(lat), lng: Number(lng) };
  localStorage.setItem("pinLocation", JSON.stringify(loc));
  return loc;
}

/* =========================
   DOM
========================= */
const form = document.getElementById("reportForm");
const msg = document.getElementById("msg");

const hazardTypeEl = document.getElementById("hazard_type");
const severityEl = document.getElementById("severity");
const descriptionEl = document.getElementById("description");

const pinTextEl = document.getElementById("pinText");
const gpsBtn = document.getElementById("gpsBtn");

/* =========================
   Severity color
========================= */
function applySeverityColor() {
  const val = (severityEl?.value || "").toLowerCase();
  severityEl.classList.remove("sev-high", "sev-medium", "sev-low");
  if (val === "high") severityEl.classList.add("sev-high");
  else if (val === "medium") severityEl.classList.add("sev-medium");
  else if (val === "low") severityEl.classList.add("sev-low");
}
if (severityEl) {
  severityEl.addEventListener("change", applySeverityColor);
  applySeverityColor();
}

/* =========================
   Pin Text UI
========================= */
function updatePinText() {
  if (!pinTextEl) return;
  const loc = getPinnedLocation();
  if (!loc) {
    pinTextEl.textContent = "No pin selected";
    return;
  }
  pinTextEl.textContent = `Pin: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
}
updatePinText();

/* =========================
   Leaflet Map Setup
========================= */
const mapEl = document.getElementById("map");

let map = null;
let marker = null;

function initMap() {
  if (!mapEl) return;

  // If map was previously initialized (hot reload), clear it safely
  if (mapEl._leaflet_id) {
    mapEl._leaflet_id = null;
  }

  // Default center (Overland Park-ish) if no pin
  const saved = getPinnedLocation();
  const startLat = saved?.lat ?? 38.9822;
  const startLng = saved?.lng ?? -94.6708;

  map = L.map("map").setView([startLat, startLng], 13);

  // Tiles (use HTTPS)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // If pin exists, show marker
  if (saved) {
    marker = L.marker([saved.lat, saved.lng]).addTo(map);
  }

  // Click to drop/move pin
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;
    setPinnedLocation(lat, lng);

    if (!marker) {
      marker = L.marker([lat, lng]).addTo(map);
    } else {
      marker.setLatLng([lat, lng]);
    }

    updatePinText();
  });

  
  setTimeout(() => {
    map.invalidateSize();
  }, 250);
}

initMap();

/* =========================
   GPS Button
========================= */
if (gpsBtn) {
  gpsBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      msg.textContent = "Geolocation not supported in this browser.";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Fetching location...";
    msg.style.color = "#1f4bd8";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPinnedLocation(lat, lng);

        if (map) {
          map.setView([lat, lng], 16);
          if (!marker) marker = L.marker([lat, lng]).addTo(map);
          else marker.setLatLng([lat, lng]);
        }

        updatePinText();
        msg.textContent = "Location set ✅";
        msg.style.color = "green";
      },
      (err) => {
        msg.textContent =
          err.code === 1
            ? "Location permission denied."
            : "Unable to get GPS location.";
        msg.style.color = "red";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = getLoggedInUser();
  if (!user?.id) {
    msg.textContent = "You are not logged in. Please login again.";
    msg.style.color = "red";
    window.location.href = "login.html";
    return;
  }

  const hazard_type = hazardTypeEl.value.trim();
  const severity = severityEl.value.trim();
  const description = descriptionEl.value.trim();

  if (!hazard_type || !severity || !description) {
    msg.textContent = "Please fill Hazard Type, Severity, and Description.";
    msg.style.color = "red";
    return;
  }

  const loc = getPinnedLocation();
  if (!loc) {
    msg.textContent = "Please drop a pin on the map before submitting.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Submitting report...";
  msg.style.color = "#1f4bd8";

  try {
    const res = await fetch(`${API_BASE}/api/reports/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        hazard_type,
        severity,
        description,
        latitude: loc.lat,
        longitude: loc.lng,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || data.error || "Failed to submit report";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Report submitted ✅ Redirecting...";
    msg.style.color = "green";

    localStorage.setItem(
      "lastReport",
      JSON.stringify({ hazard_type, severity, description, ...loc })
    );

    setTimeout(() => {
      window.location.href = "success.html";
    }, 600);
  } catch (err) {
    msg.textContent = "Server error. Is backend running?";
    msg.style.color = "red";
  }
});
