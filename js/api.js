// js/api.js
(function () {
  // Настройка URL (заменится автоматически или останется дефолтным)
  if (!window.BACKEND_URL || window.BACKEND_URL.includes("{{")) {
    window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";
  }

  // --- TOKEN MANAGEMENT ---
  window.getToken = () => localStorage.getItem("access_token");
  window.setToken = (t) => localStorage.setItem("access_token", t);
  window.clearToken = () => localStorage.removeItem("access_token");

  // --- HEADERS ---
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

  // --- HEALTH CHECK (Критически важно для старта) ---
  window.checkBackendHealth = async () => {
    try {
      const controller = new AbortController();
      // Ждем всего 2 секунды. Если сервер тупит — считаем, что он не готов.
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(window.BACKEND_URL + "/health", { 
        method: 'GET',
        signal: controller.signal,
        cache: "no-store"
      });
      
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  // --- BASE FETCH WRAPPER ---
  async function safeFetch(url, options, timeout = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);

      if (res.status === 401) {
        window.clearToken();
        throw new Error("UNAUTHORIZED");
      }
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }
      return res;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  // --- API METHODS ---
  window.apiGet = async (path) => {
    try {
      const res = await safeFetch(window.BACKEND_URL + path, { headers: getHeaders(false) }, 10000);
      return await res.json();
    } catch (e) {
      console.warn("GET failed:", path, e);
      return []; // Возвращаем пустой массив, чтобы не крашить map() в app.js
    }
  };

  window.apiPost = async (path, payload) => {
    try {
      const res = await safeFetch(window.BACKEND_URL + path, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      }, 45000); // Длинный тайм-аут для загрузки с маркетплейсов
      return await res.json();
    } catch (e) {
      if(e.message === "UNAUTHORIZED") return null;
      throw e;
    }
  };

  window.apiDelete = async (path, params = {}) => {
    try {
      const qs = new URLSearchParams(params).toString();
      await safeFetch(window.BACKEND_URL + path + "?" + qs, {
        method: "DELETE",
        headers: getHeaders(false)
      }, 10000);
      return true;
    } catch (e) { return false; }
  };

  window.apiUpload = async (path, formData) => {
    // Для загрузки файлов заголовки собираем вручную без Content-Type (браузер сам поставит boundary)
    const token = window.getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await safeFetch(window.BACKEND_URL + path, {
        method: "POST",
        headers: headers,
        body: formData
    }, 60000);
    return await res.json();
  };

/**
   * Добавление товара с маркетплейса с генерацией вариантов
   * Возвращает temp_id и превью вариантов
   */
  window.apiAddMarketplaceWithVariants = async (url, name = "") => {
    try {
      const res = await safeFetch(window.BACKEND_URL + '/api/wardrobe/add-marketplace-with-variants', {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ url, name })
      }, 90000); // 60 секунд на обработку
      return await res.json();
    } catch (e) {
      if(e.message === "UNAUTHORIZED") return null;
      throw e;
    }
  };

  /**
   * Сохранение выбранного варианта
   */
  window.apiSelectVariant = async (temp_id, selected_variant, name) => {
    try {
      const res = await safeFetch(window.BACKEND_URL + '/api/wardrobe/select-variant', {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ temp_id, selected_variant, name })
      }, 15000);
      return await res.json();
    } catch (e) {
      if(e.message === "UNAUTHORIZED") return null;
      throw e;
    }
  };
  
})();


