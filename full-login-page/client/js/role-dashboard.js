import { fetchMe, clearSession, getToken } from "./auth.js";
import { toast } from "./ui.js";

if (!getToken()) window.location.href = "../index.html";

function pageRoleFromPath() {
  const file = location.pathname.split("/").pop();
  const map = {
    "investor.html": "INVESTOR",
    "startup.html": "STARTUP",
    "intern.html": "INTERN_SEEKER",
    "influencer.html": "INFLUENCER",
  };
  return map[file] || null;
}

async function load() {
  try {
    const me = await fetchMe();

    const expected = pageRoleFromPath();
    if (me.role === "ADMIN") {
      // Admin can access admin panel only
      window.location.href = "./admin.html";
      return;
    }
    if (expected && me.role !== expected) {
      window.location.href = "./dashboard.html";
      return;
    }

    const statusEl = document.getElementById("status");
    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const roleEl = document.getElementById("role");
    const avatarEl = document.getElementById("avatar");
    const avatarInitialEl = document.getElementById("avatarInitial");

    if (statusEl) statusEl.textContent = "You are logged in ✅";
    if (nameEl) nameEl.textContent = me.full_name || "User";
    if (emailEl) emailEl.textContent = me.email;
    if (roleEl) roleEl.textContent = `Role: ${me.role}`;

    // Handle avatar image
    if (avatarEl) {
      if (me.avatar_url) {
        avatarEl.src = me.avatar_url;
        avatarEl.style.display = "block";
      } else {
        avatarEl.style.display = "none";
      }
    }

    // Handle avatar initial (for new dashboard design)
    if (avatarInitialEl && me.full_name) {
      avatarInitialEl.textContent = me.full_name.charAt(0).toUpperCase();
    }
  } catch (e) {
    console.error("Dashboard load error:", e);
    toast("Session expired. Please login again.", "error");
    clearSession();
    setTimeout(() => (window.location.href = "../index.html"), 700);
  }
}

document.getElementById("logout").addEventListener("click", () => {
  clearSession();
  toast("Logged out", "success");
  setTimeout(() => (window.location.href = "../index.html"), 500);
});

load();
