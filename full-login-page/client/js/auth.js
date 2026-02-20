import { api } from "./api.js";

const TOKEN_KEY = "token";

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerLocal(email, password, full_name, role) {
  const data = await api("/auth/signup", {
    method: "POST",
    body: { email, password, full_name, role },
  });
  setToken(data.token);
  return data.user;
}

export async function loginLocal(email, password) {
  const data = await api("/auth/signin", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  return data.user;
}

export async function loginWithGoogleCredential(credential) {
  // GIS returns a JWT "id_token" as `credential`
  const data = await api("/auth/google/verify", {
    method: "POST",
    body: { credential },
  });
  setToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) throw new Error("No session token");
  const data = await api("/user/me", { token });
  return data.user;
}
export function redirectByRole(role) {
  const map = {
    INVESTOR: "../pages/investor.html",
    STARTUP: "../pages/startup.html",
    INTERN_SEEKER: "../pages/intern.html",
    INFLUENCER: "../pages/influencer.html",
    ADMIN: "../pages/admin.html",
  };
  return map[role] || "../pages/intern.html";
}
