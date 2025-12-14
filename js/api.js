// js/api.js

(function(){
  // Используем BACKEND_URL, который определен в .env и, возможно, передан
  window.BACKEND_URL = window.BACKEND_URL || "https://stylist-backend-h5jl.onrender.com";

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
  function handleApiError(res) {
    if (res.status === 401) {
      window.clearToken(); // Сбрасываем недействительный токен
      throw new Error("401 Unauthorized. Токен недействителен или просрочен."); 
    }
    // Для других ошибок
    if(!res.ok) {
      return res.text().then(txt => {
          throw new Error("API error: " + res.status + " - " + txt);
      });
    }
    return res;
  }

  // ===========================================
  // ИСПРАВЛЕНО: Добавлен заголовок авторизации
  // ===========================================
  window.apiGet = async function(path, params) {
    params = params || {};
    // Теперь user_id берется из JWT, удаляем его из params
    if(params.user_id) delete params.user_id; 
    
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    
    const res = await fetch(url, {
      headers: getHeaders(false) 
    });
    
    await handleApiError(res);
    return await res.json();
  };

  // ===========================================
  // ИСПРАВЛЕНО: Добавлен заголовок авторизации
  // ===========================================
  window.apiPost = async function(path, payload) {
    const url = window.BACKEND_URL + path;
    
    // Теперь user_id берется из JWT, удаляем его из payload
    if(payload && payload.user_id) delete payload.user_id;

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
  // ИСПРАВЛЕНО: Добавлен заголовок авторизации
  // ===========================================
  window.apiUpload = async function(path, formData) {
    const url = window.BACKEND_URL + path;
    
    // Теперь user_id берется из JWT, удаляем его из FormData
    formData.delete("user_id");

    const res = await fetch(url, {
      method: "POST",
      // При работе с FormData Content-Type не нужен
      headers: getHeaders(false), 
      body: formData
    });
    
    await handleApiError(res);
    return await res.json();
  };

})();
