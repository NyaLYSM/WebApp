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
    // ИСПРАВЛЕНИЕ: Добавляем заголовок только если токен реально существует и он не пустой
    if (token && token !== "undefined" && token !== "null") {
      h.Authorization = `Bearer ${token}`;
    }
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  async function handleApiError(res) {
    if (res.status === 401) {
      console.warn("Сессия истекла или токен неверный");
      window.clearToken();
      // Не кидаем исключение здесь, чтобы старт приложения (startApp) мог продолжить работу
      return; 
    }
    if (!res.ok) {
      const details = await res.text();
      throw new Error(`Ошибка ${res.status}: ${details}`);
    }
  }

  window.waitForBackend = async () => {
    try {
      const res = await fetch(window.BACKEND_URL + "/health", { method: 'GET' });
      return res.ok;
    } catch (e) {
      console.log("Ожидание пробуждения сервера...");
      return false;
    }
  };

  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), { 
      headers: getHeaders(false) 
    });
    await handleApiError(res);
    return res.ok ? res.json() : []; // Возвращаем пустой массив при ошибке (например 401)
  };

  window.apiPost = async (path, payload = {}) => {
    const res = await fetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    await handleApiError(res);
    return res.ok ? res.json() : null;
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
