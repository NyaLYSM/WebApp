// js/api.js — FIXED NETWORK HANDLING & AUTH
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
    if (token && token !== "null" && token !== "undefined") {
      h["Authorization"] = `Bearer ${token}`;
    }
    if (json) {
      h["Content-Type"] = "application/json";
    }
    return h;
  }

  // Улучшенная обработка ошибок
  async function handleApiError(res) {
    if (res.status === 401) {
      console.warn("401 Unauthorized. Токен устарел.");
      window.clearToken();
      // Здесь можно вызвать событие, чтобы UI показал экран входа, но пока просто чистим
      return; 
    }
    if (!res.ok) {
      // Пытаемся прочитать текст ошибки, если сервер что-то ответил
      let msg = res.statusText;
      try { msg = await res.text(); } catch(e){}
      throw new Error(`Ошибка ${res.status}: ${msg}`);
    }
  }

  // Глобальная функция проверки статуса сервера
  window.checkBackendHealth = async () => {
    try {
      const res = await fetch(window.BACKEND_URL + "/health", { method: 'GET' });
      return res.ok;
    } catch (e) {
      return false; // Сервер лежит или сеть недоступна
    }
  };

  // Обертка для fetch, чтобы ловить NetworkError (когда сервер лежит)
  async function safeFetch(url, options) {
    try {
      const res = await fetch(url, options);
      await handleApiError(res);
      return res;
    } catch (e) {
      // Если это NetworkError, скорее всего сервер спит
      console.error("Fetch error:", e);
      throw e;
    }
  }

  // --- МЕТОДЫ ---

  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await safeFetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), { 
      headers: getHeaders(true) 
    });
    return res ? res.json() : [];
  };

  window.apiPost = async (path, payload = {}) => {
    const res = await safeFetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    return res ? res.json() : null;
  };

  window.apiDelete = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await safeFetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), {
      method: "DELETE",
      headers: getHeaders(false)
    });
    return res ? res.json() : null;
  };

  window.apiUpload = async (path, formData) => {
    const token = window.getToken();
    const headers = {};
  
    // Добавляем токен только если он валидный
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }
  
    const res = await fetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: headers,
      body: formData
    });
  
    await handleApiError(res);
    return res.ok ? res.json() : null;
  };

})();

