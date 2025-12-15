// js/api.js

(function(){
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    console.warn("BACKEND_URL не установлен! Используем локальный дефолт.");
    window.BACKEND_URL = "http://127.0.0.1:8000"; 
  }

  // ===========================================
  // НОВЫЕ ФУНКЦИИ: Управление токеном
  // ===========================================
  window.getToken = function() {
    return localStorage.getItem('access_token');
  };
  window.setToken = function(token) {
    localStorage.setItem('access_token', token);
  };
  window.clearToken = function() {
    localStorage.removeItem('access_token');
  };
  
  // Вспомогательная функция для заголовков
  function getHeaders(isJson = true) {
    const headers = {};
    const token = window.getToken();
    
    // КРИТИЧЕСКИ ВАЖНО: Добавление заголовка авторизации
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (isJson) {
      // Content-Type: application/json нужен только для JSON-тела
      headers['Content-Type'] = 'application/json'; 
    }
    return headers;
  }
  
  // Вспомогательная функция для обработки 401
  async function handleApiError(res) {
    if (res.status === 401) {
      window.clearToken(); // Сбрасываем недействительный токен
      // Выбрасываем ошибку, чтобы остановить дальнейшую обработку
      throw new Error("401 Unauthorized. Сессия истекла. Пожалуйста, перезапустите бота."); 
    }
    // Для других ошибок
    if(!res.ok) {
      const txt = await res.text();
      throw new Error("API error: " + res.status + " - " + txt);
    }
    return res;
  }

  // ===========================================
  // ИСПРАВЛЕНО: Добавлен заголовок авторизации и удалена передача user_id
  // ===========================================
  window.apiGet = async function(path, params) {
    params = params || {};
    
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    
    const res = await fetch(url, {
      headers: getHeaders(false) 
    });
    
    await handleApiError(res);
    return await res.json();
  };

  // ===========================================
  // ИСПРАВЛЕНО: Добавлен заголовок авторизации и удалена передача user_id
  // ===========================================
  window.apiPost = async function(path, payload) {
    const url = window.BACKEND_URL + path;
    
    const res = await fetch(url, {
      method:"POST",
      // Используем getHeaders(true) для JSON-запросов
      headers: getHeaders(true), 
      body: JSON.stringify(payload || {})
    });
    
    await handleApiError(res);
    return await res.json();
  };

  // ===========================================
  // ИСПРАВЛЕНО: Добавлен заголовок авторизации и удалена передача user_id
  // ===========================================
  window.apiUpload = async function(path, formData) {
    const url = window.BACKEND_URL + path;
    
    // FormData не может содержать user_id, его удаляет api.js, 
    // но в app.js лучше тоже не добавлять.
    
    const res = await fetch(url, {
      method: "POST",
      // При работе с FormData Content-Type не нужен
      headers: getHeaders(false), 
      body: formData
    });
    
    await handleApiError(res);
    return await res.json();
  };
  
  // ===========================================
  // НОВОЕ: Добавлен заголовок авторизации и функция DELETE
  // ===========================================
  /**
   * Универсальная функция для отправки DELETE запросов.
   * Ожидает параметры в виде Query String (поиск по URL).
   */
  window.apiDelete = async function(path, params) {
    params = params || {};
    
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    
    const res = await fetch(url, {
      method: "DELETE",
      // Для DELETE тело обычно пустое, поэтому Content-Type не нужен
      headers: getHeaders(false) 
    });
    
    await handleApiError(res);
    return await res.json();
  };


})();
