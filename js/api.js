// js/api.js
(function(){
  window.BACKEND_URL = window.BACKEND_URL || "https://stylist-backend-h5jl.onrender.com";

  window.apiGet = async function(path, params) {
    params = params || {};
    const qs = new URLSearchParams(params).toString();
    const url = window.BACKEND_URL + path + (qs ? "?" + qs : "");
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error("API GET error: " + res.status + " - " + txt);
    }
    return await res.json();
  };

  window.apiPost = async function(path, payload) {
    const url = window.BACKEND_URL + path;
    const res = await fetch(url, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload || {})
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error("API POST error: " + res.status + " - " + txt);
    }
    return await res.json();
  };

  // multipart upload (file)
  window.apiUploadFile = async function(path, formData) {
    const url = window.BACKEND_URL + path;
    const res = await fetch(url, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error("API UPLOAD error: " + res.status + " - " + txt);
    }
    return await res.json();
  };
})();
