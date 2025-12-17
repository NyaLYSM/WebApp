// js/api.js
(function () {
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";
  }

  window.getToken = () => localStorage.getItem("access_token");
  window.setToken = (t) => localStorage.setItem("access_token", t);
  window.clearToken = () => localStorage.removeItem("access_token");

  function getHeaders(json = true) {
    const h = {};
    const token = window.getToken();
    if (token) h.Authorization = `Bearer ${token}`;
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  async function handleApiError(res) {
    if (res.status === 401) {
      window.clearToken();
      // Не кидаем ошибку сразу, чтобы дать приложению загрузиться
    }
    if (!res.ok) {
      const details = await res.text();
      throw new Error(`API Error ${res.status}: ${details}`);
    }
  }

  // Метод для "прогрева" сервера
  window.waitForBackend = async () => {
    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(window.BACKEND_URL + "/health");
        if (res.ok) return true;
      } catch (e) {
        console.log("Waiting for backend...");
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), { headers: getHeaders(false) });
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
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), {
      method: "DELETE",
      headers: getHeaders(false)
    });
    await handleApiError(res);
    return res.json();
  };
})();
