// js/api.js
const BACKEND_URL = "<YOUR_BACKEND_URL>"; // <-- Поставь сюда URL вашего backend-а

function buildUrl(path){
  if(!BACKEND_URL || BACKEND_URL.startsWith("<")) throw new Error("BACKEND_URL не задан в js/api.js");
  return BACKEND_URL.replace(/\/$/, "") + path;
}

export async function registerUser(user_id, username=null, first_name=null){
  const url = buildUrl("/api/auth/register");
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({user_id, username, first_name})
  });
  return await res.json();
}

export async function getWardrobe(user_id){
  const url = buildUrl(`/api/wardrobe/${user_id}`);
  const res = await fetch(url);
  if(!res.ok){
    const t = await res.text();
    throw new Error(`Wardrobe fetch error: ${res.status} ${t}`);
  }
  return await res.json();
}

export async function addWardrobeItem(user_id, item_name, item_type, photo_url, colors=null, description=null){
  const url = buildUrl("/api/wardrobe/add");
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({user_id, item_name, item_type, photo_url, colors, description})
  });
  if(!res.ok) {
    const t = await res.text();
    throw new Error(`Add item failed: ${res.status} ${t}`);
  }
  return await res.json();
}
