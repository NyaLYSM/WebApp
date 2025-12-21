// js/api.js — STABLE AUTH & UPLOAD VERSION
(function () {

  // ===============================
  // BACKEND URL
  // ===============================
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";
  }

  // ===============================
  // TOKEN MANAGEMENT
  // ===============================
  window.getToken = () => localStorage.getItem("access_token");
  window.setToken = (t) => localStorage.setItem("access_token", t);
  window.clearToken = () => localStorage.removeItem("access_token");

  // ===============================
  // HEADERS
  // ===============================
  function getHeaders(json = true) {
    const headers = {};
    const token = window.getToken();

    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (json) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  // ===============================
  // ERROR HANDLER (CRITICAL)
  // ===============================
  async function handleApiError(res) {
    if (res.status === 401) {
      console.warn("⛔ 401 Unauthorized — token cleared");
      window.clearToken();
      throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }
  }

  // ===============================
  // API METHODS
  // ===============================

  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      window.BACKEND_URL + path + (qs ? "?" + qs : ""),
      {
        method: "GET",
        headers: getHeaders(true)
      }
    );

    await handleApiError(res);
    return res.json();
  };

  window.apiPost = async (path, payload = {}) => {
    const res = await fetch(
      window.BACKEND_URL + path,
      {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      }
    );

    await handleApiError(res);
    return res.json();
  };

  window.apiDelete = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      window.BACKEND_URL + path + (qs ? "?" + qs : ""),
      {
        method: "DELETE",
        headers: getHeaders(false)
      }
    );

    await handleApiError(res);
    return res.json();
  };

  // ===============================
  // FILE UPLOAD (FormData)
  // ===============================
  window.apiUpload = async (path, formData) => {
    const res = await fetch(
      window.BACKEND_URL + path,
      {
        method: "POST",
        headers: getHeaders(false), // ONLY Authorization
        body: formData
      }
    );

    await handleApiError(res);
    return res.json();
  };

})();
