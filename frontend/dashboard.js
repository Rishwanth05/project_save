// frontend/dashboard.js

// 1️ user session
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!user) {
  // Not logged in → redirect to login
  window.location.href = "login.html";
}

//  welcome text (safe even if element doesn't exist)
const welcomeEl = document.getElementById("welcome");
if (welcomeEl && user) {
  welcomeEl.textContent = `Welcome, ${user.name} 👋`;
}
