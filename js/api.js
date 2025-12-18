// js/api.js
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
  function getHeaders(json = true) {
    const h = {};
    const token = window.getToken();
    // ФИКС: Отправляем Bearer только если токен есть и он не является строкой "null"/"undefined"
    if (token && token !== "null" && token !== "undefined") {
      h["Authorization"] = `Bearer ${token}`;
    }
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  // Централизованная обработка ошибок
  async function handleApiError(res) {
    if (res.status === 401) {
      console.warn("Сессия истекла (401). Токен очищен.");
      window.clearToken();
      return; // Не кидаем ошибку, чтобы приложение не падало
    }
    if (!res.ok) {
      const details = await res.text();
      throw new Error(`Ошибка API ${res.status}: ${details}`);
    }
  }

  // Ожидание прогрева сервера (Render)
  window.waitForBackend = async () => {
    console.log("Проверка связи с сервером...");
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch(window.BACKEND_URL + "/health");
        if (res.ok) return true;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 2000)); // Ждем 2 сек перед повтором
    }
    return false;
  };

  // Методы запросов
  window.apiGet = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), { 
      headers: getHeaders(false) 
    });
    await handleApiError(res);
    return res.ok ? res.json() : [];
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

  window.apiDelete = async (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(window.BACKEND_URL + path + (qs ? "?" + qs : ""), {
      method: "DELETE",
      headers: getHeaders(false)
    });
    await handleApiError(res);
    return res.ok ? res.json() : null;
  };
})();
