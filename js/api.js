window.BACKEND_URL = window.BACKEND_URL || "https://stylist-backend-h5jl.onrender.com";

async function apiPost(path, data){
  const url = (window.BACKEND_URL||"") + path;
  const res = await fetch(url, { method: "POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(data) });
  if(!res.ok) throw new Error("API Error " + res.status);
  return res.json();
}

async function apiGet(path){
  const url = (window.BACKEND_URL||"") + path;
  const res = await fetch(url);
  if(!res.ok) throw new Error("API Error " + res.status);
  return res.json();
}
