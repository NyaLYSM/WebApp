// js/api.js — FIXED NETWORK HANDLING, AUTH & CRASH PROTECTION
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
      throw new Error("UNAUTHORIZED"); // Специальная ошибка для отлова
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
      if (e.message === "UNAUTHORIZED") throw e; // Пробрасываем 401 выше
      console.error("Fetch error:", e);
      throw e;
    }
  }

  // --- МЕТОДЫ API ---
  
  window.apiGet = async (path, params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await safeFetch(
        window.BACKEND_URL + path + (qs ? "?" + qs : ""), 
        { headers: getHeaders(false) },
        15000
      );
      return await res.json();
    } catch (e) {
      // ГЛАВНЫЙ ФИКС: Если ошибка, возвращаем пустой массив, а не падаем
      console.warn("apiGet failed, returning empty array:", e);
      return []; 
    }
  };

  window.apiPost = async (path, payload = {}) => {
    try {
      const res = await safeFetch(
        window.BACKEND_URL + path,
        {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify(payload)
        },
        45000
      );
      return await res.json();
    } catch (e) {
      if (e.message === "UNAUTHORIZED") return null;
      throw e;
    }
  };

  window.apiDelete = async (path, params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await safeFetch(
        window.BACKEND_URL + path + (qs ? "?" + qs : ""),
        {
          method: "DELETE",
          headers: getHeaders(false)
        },
        15000
      );
      return await res.json();
    } catch (e) { return null; }
  };

  window.apiUpload = async (path, formData) => {
    // ВАЖНО: apiUpload должен сам обрабатывать try/catch или пробрасывать, 
    // но лучше вернуть null при ошибке, чтобы UI не завис
    try {
        const token = window.getToken();
        const headers = {};
        if (token && token !== "null") headers["Authorization"] = `Bearer ${token}`;
      
        const res = await safeFetch(
          window.BACKEND_URL + path,
          {
            method: "POST",
            headers: headers,
            body: formData
          },
          60000
        );
        return await res.json();
    } catch (e) {
        throw e; // Upload пусть падает, чтобы мы показали alert пользователю
    }
  };
})();
