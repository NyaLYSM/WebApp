window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";

// Unified GET
export async function apiGet(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = BACKEND_URL + path + (query ? "?" + query : "");
    const res = await fetch(url);
    return await res.json();
}

// Unified POST
export async function apiPost(path, data) {
    const res = await fetch(BACKEND_URL + path, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    return await res.json();
}
