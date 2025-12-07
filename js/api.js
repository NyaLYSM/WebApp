const API_URL = "https://stylist-backend-h5jl.onrender.com";

export async function getWardrobe() {
    const res = await fetch(`${API_URL}/api/wardrobe`);
    return res.json();
}

export async function addItem(photoUrl) {
    const res = await fetch(`${API_URL}/api/add_item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: photoUrl })
    });
    return res.json();
}
