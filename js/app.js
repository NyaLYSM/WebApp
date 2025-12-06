import { api } from "./api.js";

const content = document.getElementById("content");

function renderWardrobe(items) {
    content.innerHTML = `
        <h2 class="section-title">👗 Ваши вещи</h2>
        ${items.length === 0 ? "<p>Пока пусто... Добавьте первую вещь!</p>" : ""}
        ${items.map(item => `
            <div class="item-card">
                <img src="${item.photo}" width="100%" style="border-radius: 10px;">
                <p><b>Категория:</b> ${item.category}</p>
            </div>
        `).join('')}
    `;
}

function renderAddForm() {
    content.innerHTML = `
        <h2 class="section-title">📸 Добавить вещь</h2>
        <button class="btn" id="uploadPhoto">Загрузить фото</button>
    `;

    document.getElementById("uploadPhoto").onclick = () => {
        Telegram.WebApp.showPopup({
            title: "Загрузка",
            message: "Отправьте фото в боте, скоро добавим загрузку через Mini App!",
            buttons: [{id: "ok", type: "default", text: "Ок"}]
        });
    };
}

function renderLooks() {
    content.innerHTML = `
        <h2 class="section-title">🎨 Генерация луков</h2>
        <p>Функция скоро будет доступна</p>
    `;
}

function renderProfile() {
    content.innerHTML = `
        <h2 class="section-title">⚙️ Профиль</h2>
        <p>Скоро добавим настройки и статистику</p>
    `;
}

document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", async () => {

        const section = btn.dataset.section;

        if (section === "wardrobe") {
            const items = await api.getWardrobe();
            renderWardrobe(items);
        }

        if (section === "add") {
            renderAddForm();
        }

        if (section === "looks") {
            renderLooks();
        }

        if (section === "profile") {
            renderProfile();
        }
    });
});
