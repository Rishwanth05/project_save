const API_BASE = "http://localhost:5000";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  msg.textContent = "Creating account...";

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || "Signup failed";
      return;
    }

    msg.style.color = "green";
    msg.textContent = "Signup successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (err) {
    msg.textContent = "Server error. Is backend running?";
  }
});
