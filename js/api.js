window.BACKEND_URL = "https://stylist-backend-h5jl.onrender.com";

async function apiPost(path, data) {
    const res = await fetch(BACKEND_URL + path, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function apiGet(path) {
    const res = await fetch(BACKEND_URL + path);
    return await res.json();
}
