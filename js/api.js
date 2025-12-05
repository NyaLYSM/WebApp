const API_URL = "https://stylist-backend-h5jl.onrender.com/";

export async function getWardrobe() {
    return fetch(`${API_URL}/wardrobe`).then(res => res.json());
}

export async function addItem(photoUrl) {
    return fetch(`${API_URL}/add_item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: photoUrl })
    }).then(res => res.json());
}
