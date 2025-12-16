// js/api.js

console.log('--- API.js SCRIPT LOADED AND EXECUTING (V8_FINAL_FIX) ---');

(function(){
  if (!window.BACKEND_URL || window.BACKEND_URL === "{{ BACKEND_URL }}") {
    console.warn("BACKEND_URL не установлен! Используем локальный дефолт.");
    window.BACKEND_URL = "http://127.0.0.1:8000"; 
  }

  // ===========================================
  // Управление токеном
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
    
    // Добавление заголовка авторизации
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (isJson) {
      // Content-Type: application/json нужен только для JSON-тела
      headers['Content-Type'] = 'application/json'; 
    }
    return headers;
  }
  
  // Вспомогательная функция для обработки ошибок
  async function handleApiError(response) {
    if (response.status === 401) {
      window.clearToken(); // Сбрасываем недействительный токен
      throw new Error("401 Unauthorized. Сессия истекла. Пожалуйста, перезапустите бота.");
    }

    if (!response.ok) {
        let errorBody;
        try {
            errorBody = await response.json();
        } catch (e) {
            errorBody = { detail: `Неизвестная ошибка: ${response.status} ${response.statusText}` };
        }
        
        // Извлекаем подробности ошибки
        const detail = errorBody.detail || errorBody.message || errorBody;

        // Создаем ошибку с понятным статусом
        const error = new Error(`API Error ${response.status}: ${detail}`);
        error.status = response.status;
        error.details = detail;
        throw error;
    }
  }

  // ===========================================
  // ФУНКЦИИ API
  // ===========================================

  // GET
  window.apiGet = async function(path, params) {
    params = params || {};
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    
    const res = await fetch(url, {
      headers: getHeaders(false) // GET не использует JSON тело
    });
    
    await handleApiError(res);
    return await res.json();
  };

  // POST (JSON) <--- ЭТА ФУНКЦИЯ БЫЛА ПРОПУЩЕНА В ПРЕДЫДУЩЕЙ ВЕРСИИ
  window.apiPost = async function(path, payload) {
    const url = window.BACKEND_URL + path;
    
    const res = await fetch(url, {
      method:"POST",
      headers: getHeaders(true), // Content-Type: application/json
      body: JSON.stringify(payload || {})
    });
    
    await handleApiError(res);
    return await res.json();
  };

  // UPLOAD (FormData)
  window.apiUpload = async function(path, formData) {
    const url = window.BACKEND_URL + path;
    
    const res = await fetch(url, {
      method: "POST",
      // При работе с FormData Content-Type не нужен
      headers: getHeaders(false), 
      body: formData
    });
    
    await handleApiError(res);
    return await res.json();
  };

  // DELETE
  window.apiDelete = async function(path, params) {
    params = params || {};
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    
    const res = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(false) 
    });
    
    await handleApiError(res);
    return await res.json();
  };
  
})();
