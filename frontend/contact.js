const API_BASE = "http://localhost:5000";

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    message: document.getElementById("message").value.trim(),
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    statusEl.textContent = "Please fill all fields.";
    statusEl.style.color = "red";
    return;
  }

  statusEl.textContent = "Sending...";
  statusEl.style.color = "#1f4bd8";

  try {
    const res = await fetch(`${API_BASE}/api/contact/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = `❌ ${data.message || "Email send failed"}`;
      statusEl.style.color = "red";
      console.log("Contact send error:", data);
      return;
    }

    statusEl.style.color = "green";
    statusEl.textContent =
      `✅ Accepted by SendGrid (202). ` +
      `Message ID: ${data.sendgrid_message_id || "N/A"}. ` +
      `Check SendGrid Email Activity for Delivered (250) or Deferred (421).`;

    form.reset();
  } catch (err) {
    statusEl.textContent = "❌ Server error. Is backend running?";
    statusEl.style.color = "red";
  }
});
