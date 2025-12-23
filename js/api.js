// js/api.js — FIXED NETWORK HANDLING & AUTH + TIMEOUT
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
      return; 
    }
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = await res.text(); } catch(e){}
      throw new Error(`Ошибка ${res.status}: ${msg}`);
    }
  }

  // Fetch с timeout
  async function fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания. Попробуйте еще раз.');
      }
      throw error;
    }
  }

  // Глобальная функция проверки статуса сервера
  window.checkBackendHealth = async () => {
    try {
      const res = await fetchWithTimeout(window.BACKEND_URL + "/health", { method: 'GET' }, 5000);
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  // Обертка для fetch с обработкой ошибок
  async function safeFetch(url, options, timeout = 30000) {
    try {
      const res = await fetchWithTimeout(url, options, timeout);
      await handleApiError(res);
      return res;
    } catch (e) {
      console.error("Fetch error:", e);
      throw e;
    }
  }

  // --- МЕТОДЫ API ---
  
  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await safeFetch(
      window.BACKEND_URL + path + (qs ? "?" + qs : ""), 
      { headers: getHeaders(false) },
      15000  // 15 секунд для GET
    );
    return res ? res.json() : [];
  };

  window.apiPost = async (path, payload = {}) => {
    const res = await safeFetch(
      window.BACKEND_URL + path,
      {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      },
      45000  // 45 секунд для POST (маркетплейсы долго грузят)
    );
    return res ? res.json() : null;
  };

  window.apiDelete = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await safeFetch(
      window.BACKEND_URL + path + (qs ? "?" + qs : ""),
      {
        method: "DELETE",
        headers: getHeaders(false)
      },
      15000
    );
    return res ? res.json() : null;
  };

  window.apiUpload = async (path, formData) => {
    const token = window.getToken();
    const headers = {};
  
    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }
  
    // Используем safeFetch с увеличенным timeout для загрузки файлов
    const res = await safeFetch(
      window.BACKEND_URL + path,
      {
        method: "POST",
        headers: headers,
        body: formData
      },
      60000  // 60 секунд для загрузки файлов
    );
  
    return res ? res.json() : null;
  };
})();
