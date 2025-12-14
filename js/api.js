// js/api.js

(function(){
  window.BACKEND_URL = window.BACKEND_URL || "https://stylist-backend-h5jl.onrender.com";

  // НОВЫЕ ФУНКЦИИ: Управление токеном
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
    
    // КРИТИЧЕСКИ ВАЖНАЯ ПРОВЕРКА И ДОБАВЛЕНИЕ:
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  // ИСПРАВЛЕНО: Добавлен заголовок авторизации
  window.apiGet = async function(path, params) {
    params = params || {};
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    
    // ДОБАВЛЕНЫ ЗАГОЛОВКИ!
    const res = await fetch(url, {
      headers: getHeaders(false) // GET запросы не всегда требуют Content-Type: application/json
    });
    
    if(res.status === 401) {
      window.clearToken(); // Если 401, очищаем токен и предлагаем перелогиниться
      throw new Error("401 Unauthorized. Токен недействителен или просрочен.");
    }

    if(!res.ok) {
      const txt = await res.text();
      throw new Error("API GET error: " + res.status + " - " + txt);
    }
    return await res.json();
  };

  // ИСПРАВЛЕНО: Добавлен заголовок авторизации
  window.apiPost = async function(path, payload) {
    const url = window.BACKEND_URL + path;
    const res = await fetch(url, {
      method:"POST",
      headers: getHeaders(true), // Content-Type: application/json включен
      body: JSON.stringify(payload || {})
    });

    if(res.status === 401) {
      window.clearToken();
      throw new Error("401 Unauthorized. Токен недействителен или просрочен.");
    }
    
    if(!res.ok){
      const txt = await res.text();
      throw new Error("API POST error: " + res.status + " - " + txt);
    }
    return await res.json();
  };

  // ИСПРАВЛЕНО: Добавлен заголовок авторизации
  window.apiUpload = async function(path, formData) {
    const url = window.BACKEND_URL + path;
    
    // Для FormData headers: {'Content-Type': 'multipart/form-data'} не нужен, но 
    // нужен Authorization.
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(false), // Не передаём Content-Type
      body: formData
    });
    
    if(res.status === 401) {
      window.clearToken();
      throw new Error("401 Unauthorized. Токен недействителен или просрочен.");
    }
    
    if(!res.ok) {
      const txt = await res.text();
      throw new Error("API UPLOAD error: " + res.status + " - " + txt);
    }
    return await res.json();
  };
})();
