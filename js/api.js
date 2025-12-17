// js/api.js
console.log('--- API.js LOADED ---');

(function () {

  // =========================
  // BACKEND URL
  // =========================
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";
  }

  // =========================
  // TOKEN
  // =========================
  window.getToken = () => localStorage.getItem("access_token");
  window.setToken = (t) => localStorage.setItem("access_token", t);
  window.clearToken = () => localStorage.removeItem("access_token");

  // =========================
  // HEADERS
  // =========================
  function getHeaders(json = true) {
    const h = {};
    const token = window.getToken();
    if (token) h.Authorization = `Bearer ${token}`;
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  // =========================
  // ERROR HANDLER
  // =========================
  async function handleApiError(res) {
    if (res.status === 401) {
      window.clearToken();
      throw new Error("401 Unauthorized");
    }

    if (!res.ok) {
      let body;
      try {
        body = await res.json();
      } catch {
        body = { detail: res.statusText };
      }
      throw new Error(body.detail || "API error");
    }
  }

  // =========================
  // WAIT FOR BACKEND (Render)
  // =========================
  window.waitForBackend = async function ({
    timeoutMs = 60000,
    intervalMs = 3000
  } = {}) {

    console.log("⏳ Waiting for backend...");

    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(window.BACKEND_URL + "/health", {
          cache: "no-store"
        });
        if (res.ok) {
          console.log("✅ Backend is awake");
          return true;
        }
      } catch (_) {}

      await new Promise(r => setTimeout(r, intervalMs));
    }

    throw new Error("Backend did not wake up in time");
  };

  // =========================
  // API METHODS
  // =========================
  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      window.BACKEND_URL + path + (qs ? "?" + qs : ""),
      { headers: getHeaders(false) }
    );
    await handleApiError(res);
    return res.json();
  };

  window.apiPost = async (path, payload = {}) => {
    const res = await fetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    await handleApiError(res);
    return res.json();
  };

  window.apiUpload = async (path, formData) => {
    const res = await fetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: getHeaders(false),
      body: formData
    });
    await handleApiError(res);
    return res.json();
  };

  window.apiDelete = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      window.BACKEND_URL + path + (qs ? "?" + qs : ""),
      { method: "DELETE", headers: getHeaders(false) }
    );
    await handleApiError(res);
    return res.json();
  };

})();
