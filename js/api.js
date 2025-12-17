// js/api.js
console.log('--- API.js SCRIPT LOADED (WITH WARMUP & RETRY) ---');

(function () {
  // ===========================================
  // BACKEND URL
  // ===========================================
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    console.warn("BACKEND_URL не установлен! Используем локальный дефолт.");
    window.BACKEND_URL = "http://127.0.0.1:8000";
  }

  // ===========================================
  // TOKEN
  // ===========================================
  window.getToken = () => localStorage.getItem("access_token");
  window.setToken = (t) => localStorage.setItem("access_token", t);
  window.clearToken = () => localStorage.removeItem("access_token");

  // ===========================================
  // HEADERS
  // ===========================================
  function getHeaders(isJson = true) {
    const headers = {};
    const token = window.getToken();

    if (token) headers.Authorization = `Bearer ${token}`;
    if (isJson) headers["Content-Type"] = "application/json";

    return headers;
  }

  // ===========================================
  // BACKEND WARM-UP (Render cold start)
  // ===========================================
  window.waitForBackend = async function (maxWaitMs = 40000) {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      try {
        const res = await fetch(window.BACKEND_URL + "/health");
        if (res.ok) {
          console.log("✅ Backend is awake");
          return true;
        }
      } catch (_) {}

      console.log("⏳ Waiting for backend...");
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error("Backend did not wake up in time");
  };

  // ===========================================
  // ERROR HANDLER (NO AUTO TOKEN DROP)
  // ===========================================
  async function handleApiError(response) {
    if (response.status === 401) {
      // ❗ НЕ удаляем токен сразу
      const err = new Error("401 Unauthorized");
      err.status = 401;
      throw err;
    }

    if (!response.ok) {
      let body;
      try {
        body = await response.json();
      } catch {
        body = { detail: `${response.status} ${response.statusText}` };
      }

      const detail = body.detail || body.message || JSON.stringify(body);
      const err = new Error(`API Error ${response.status}: ${detail}`);
      err.status = response.status;
      throw err;
    }
  }

  // ===========================================
  // RETRY WRAPPER
  // ===========================================
  async function withRetry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (e) {
        if (i === retries - 1) throw e;
        if (e.status !== 401) throw e;

        console.warn(`🔁 Retry ${i + 1}/${retries} after 401`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // ===========================================
  // API METHODS
  // ===========================================
  window.apiGet = async function (path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");

    return withRetry(async () => {
      const res = await fetch(url, { headers: getHeaders(false) });
      await handleApiError(res);
      return res.json();
    });
  };

  window.apiPost = async function (path, payload) {
    const url = window.BACKEND_URL + path;

    return withRetry(async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload || {}),
      });
      await handleApiError(res);
      return res.json();
    });
  };

  window.apiUpload = async function (path, formData) {
    const url = window.BACKEND_URL + path;

    return withRetry(async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: getHeaders(false), // Content-Type НЕ указываем
        body: formData,
      });
      await handleApiError(res);
      return res.json();
    });
  };

  window.apiDelete = async function (path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");

    return withRetry(async () => {
      const res = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(false),
      });
      await handleApiError(res);
      return res.json();
    });
  };
})();
