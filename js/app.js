import * as api from "./api.js";

const content = document.getElementById("content");

function renderWardrobe(items) {
    content.innerHTML = `
        <h2 class="section-title">👗 Ваши вещи</h2>
        ${items.length === 0 ? "<p>Пока пусто...</p>" : ""}
        ${items.map(item => `
            <div class="item-card">
                <img src="${item.photo_url}" style="width:100%;border-radius:12px;">
                <p><b>${item.item_type}</b></p>
            </div>
        `).join("")}
    `;
}

function renderAddForm() {
    content.innerHTML = `
        <h2 class="section-title">📸 Добавить вещь</h2>
        <button class="card-btn" id="uploadPhoto">Загрузить фото</button>
    `;

    document.getElementById("uploadPhoto").onclick = () => {
        Telegram.WebApp.showPopup({
            title: "Загрузка",
            message: "Отправьте фото в боте",
            buttons: [{id: "ok", type: "default", text: "Ок"}]
        });
    };
}

document.querySelectorAll(".card-btn").forEach(btn => {
    btn.onclick = async () => {
        const section = btn.dataset.section;

        if (section === "wardrobe") {
            const items = await api.getWardrobe();
            renderWardrobe(items);
        }

        if (section === "add") renderAddForm();
        if (section === "looks") content.innerHTML = "<h2>🎨 Скоро...</h2>";
        if (section === "profile") content.innerHTML = "<h2>⚙️ Профиль</h2>";
    };
});
