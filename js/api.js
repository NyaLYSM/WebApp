// js/api.js — FIXED UPLOAD & AUTH
(function () {
  // Настройка URL бэкенда
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";
  }

  // Управление токеном
  window.getToken = () => localStorage.getItem("access_token");
  window.setToken = (t) => localStorage.setItem("access_token", t);
  window.clearToken = () => localStorage.removeItem("access_token");

  // Формирование заголовков
  // json = true -> добавляем Content-Type: application/json
  // json = false -> не добавляем Content-Type (нужно для FormData/Upload)
  function getHeaders(json = true) {
    const h = {};
    const token = window.getToken();
    
    // Проверяем токен на валидность строки
    if (token && token !== "null" && token !== "undefined") {
      h["Authorization"] = `Bearer ${token}`;
    }
    
    if (json) {
      h["Content-Type"] = "application/json";
    }
    
    return h;
  }

  // Обработка ошибок
  async function handleApiError(res) {
    if (res.status === 401) {
      console.warn("Сессия истекла (401). Токен очищен.");
      window.clearToken();
      // Можно добавить редирект или перезагрузку, если нужно
      return; 
    }
    if (!res.ok) {
      const details = await res.text();
      throw new Error(`Ошибка API ${res.status}: ${details}`);
    }
  }

  // Прогрев
  window.waitForBackend = async () => {
    console.log("Проверка связи с сервером...");
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch(window.BACKEND_URL + "/health");
        if (res.ok) return true;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 2000));
    }
    return false;
  };

  // --- МЕТОДЫ ---

  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), { 
      headers: getHeaders(true) // Можно true или false для GET, но обычно JSON ок
    });
    await handleApiError(res);
    return res.ok ? res.json() : [];
  };

  window.apiPost = async (path, payload = {}) => {
    const res = await fetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: getHeaders(true), // Content-Type: application/json
      body: JSON.stringify(payload)
    });
    await handleApiError(res);
    return res.ok ? res.json() : null;
  };

  window.apiDelete = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), {
      method: "DELETE",
      headers: getHeaders(false)
    });
    await handleApiError(res);
    return res.ok ? res.json() : null;
  };

  // ВОТ ОНА — ПРОПАВШАЯ ФУНКЦИЯ
  window.apiUpload = async (path, formData) => {
    // ВАЖНО: getHeaders(false) не добавляет Content-Type,
    // чтобы браузер сам выставил multipart/form-data boundary
    const headers = getHeaders(false); 

    const res = await fetch(window.BACKEND_URL + path, {
      method: "POST",
      headers: headers, // Тут только Authorization
      body: formData
    });
    await handleApiError(res);
    return res.ok ? res.json() : null;
  };

})();
