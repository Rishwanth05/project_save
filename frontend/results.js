const API_BASE = "http://localhost:5000";

const list = document.getElementById("list");
const msg = document.getElementById("msg");
const filterInfo = document.getElementById("filterInfo");
const cameraOnly = document.getElementById("cameraOnly");

document.getElementById("changeFilterBtn").onclick = () => {
  window.location.href = "filter.html"; // change if your filter page name differs
};
document.getElementById("backBtn").onclick = () => {
  window.location.href = "dashboard.html";
};

const filter = JSON.parse(localStorage.getItem("reportFilter") || "{}");
let selectedReportId = null;

// --- helpers
function toRad(x) {
  return (x * Math.PI) / 180;
}
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function sevBadge(sev) {
  const s = (sev || "").toLowerCase();
  if (s === "high") return `<span class="badge sev-high">High</span>`;
  if (s === "medium") return `<span class="badge sev-medium">Medium</span>`;
  return `<span class="badge sev-low">Low</span>`;
}

function safeText(x) {
  return (x ?? "").toString().replace(/[<>&"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
  }[c]));
}

async function loadReports() {
  if (!filter?.lat || !filter?.lng || !filter?.radiusMiles) {
    msg.textContent = "No filter found. Go back and set location + radius.";
    return;
  }

  filterInfo.textContent =
    `Center: ${Number(filter.lat).toFixed(4)}, ${Number(filter.lng).toFixed(4)} | ` +
    `Radius: ${filter.radiusMiles} miles`;

  msg.textContent = "Loading reports...";
  list.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/reports/all`);
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || data.error || "Failed to load reports";
      return;
    }

    // filter by radius
    const filtered = data
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => {
        const d = distanceMiles(
          Number(filter.lat),
          Number(filter.lng),
          Number(r.latitude),
          Number(r.longitude)
        );
        return { ...r, _distance: d };
      })
      .filter((r) => r._distance <= Number(filter.radiusMiles))
      .sort((a, b) => a._distance - b._distance);

    if (filtered.length === 0) {
      msg.textContent = "No reports found in this radius.";
      return;
    }

    msg.textContent = "";

    list.innerHTML = filtered
      .map((r) => {
        const img = r.image_url
          ? `<img class="thumb" src="${API_BASE}${r.image_url}" alt="hazard photo" />`
          : `<div class="thumb placeholder">No Photo</div>`;

        const status = (r.status || "pending").toLowerCase();
        const isResolved = status === "resolved";

        return `
          <div class="card">
            <div class="thumbWrap">
              ${img}
            </div>

            <div class="cardBody">
              <div class="topRow">
                <div class="hazType">${safeText(r.hazard_type)}</div>
                ${sevBadge(r.severity)}
              </div>

              <div class="desc">${safeText(r.description || "")}</div>

              <div class="metaRow">
                <div class="metaLeft">
                  <div class="metaName">${safeText(r.name || "User")}</div>
                </div>
                <div class="metaRight">${r._distance.toFixed(1)} mi</div>
              </div>

              <div class="resolveRow">
                <div class="resolveText">Report resolved?</div>
                ${
                  isResolved
                    ? `<button class="btnResolved done" disabled>Resolved ✅</button>`
                    : `<button class="btnResolved" data-id="${r.id}">Resolved</button>`
                }
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // attach click handlers
    document.querySelectorAll(".btnResolved[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedReportId = btn.getAttribute("data-id");
        cameraOnly.value = "";
        cameraOnly.click(); // opens camera-only on mobile; desktop shows file chooser
      });
    });
  } catch (e) {
    msg.textContent = "Server error. Is backend running?";
  }
}

// camera proof upload
cameraOnly.addEventListener("change", async () => {
  const file = cameraOnly.files?.[0];
  if (!file || !selectedReportId) return;

  msg.textContent = "Uploading proof photo...";

  try {
    const form = new FormData();
    form.append("report_id", selectedReportId);
    form.append("proof", file);

    const res = await fetch(`${API_BASE}/api/reports/resolve`, {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.message || data.error || "Resolve failed";
      return;
    }

    // store what we just resolved (to show on next page)
    localStorage.setItem(
      "resolvedInfo",
      JSON.stringify({
        report_id: selectedReportId,
        proofUrl: data.proofUrl || "",
        time: new Date().toISOString(),
      })
    );

    window.location.href = "resolved-success.html";
  } catch (err) {
    msg.textContent = "Upload failed. Is backend running?";
  } finally {
    selectedReportId = null;
  }
});

loadReports();
