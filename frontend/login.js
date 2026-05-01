const API_BASE = "http://localhost:5000";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  msg.style.color = "#1a7f37"; // green for status
  msg.textContent = "Logging in...";

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      msg.style.color = "#b42318"; // red for error
      msg.textContent = data.message || data.error || "Login failed";
      return;
    }

    // Save user session
    localStorage.setItem("user", JSON.stringify(data.user));

    msg.style.color = "#1a7f37";
    msg.textContent = "Login successful ✅ Redirecting...";
    window.location.href = "./dashboard.html";
  } catch (err) {
    msg.style.color = "#b42318";
    msg.textContent = "Server error. Is backend running?";
  }
});
