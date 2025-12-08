import { apiGet, apiPost } from "./api.js";

const tg = window.Telegram.WebApp;
tg.expand();

// Get user
const USER_ID = tg.initDataUnsafe?.user?.id || 0;

const content = document.getElementById("content");

// ROUTES
const routes = {
    wardrobePage,
    addPage,
    looksPage,
    profilePage
};

// All buttons
document.querySelectorAll(".btn[data-section]").forEach(btn => {
    btn.onclick = () => loadPage(btn.dataset.section);
});

// Import button
document.getElementById("import-btn").onclick = () => importByUrl();

function loadPage(name) {
    routes[name + "Page"]?.();
}

/* ========== 1) Вещи ========== */

async function wardrobePage() {
    const data = await apiGet("/api/wardrobe/list", { user_id: USER_ID });

    content.innerHTML = `
        <h2>Ваши вещи</h2>
        <div id="wardrobe-list"></div>
    `;

    const list = document.getElementById("wardrobe-list");

    data.items.forEach(item => {
        const el = document.createElement("div");
        el.className = "item-card";
        el.innerHTML = `
            <img src="${item.image_url}" style="width:100%;border-radius:10px;margin-bottom:10px;">
            <b>${item.name}</b> — <span>${item.item_type}</span>
        `;
        list.appendChild(el);
    });
}

/* ========== 2) Добавить вручную ========== */

function addPage() {
    content.innerHTML = `
        <h2>Добавить вещь вручную</h2>
        <input id="manual-name" class="input" placeholder="Название">
        <input id="manual-url" class="input" placeholder="URL картинки">
        <button id="manual-save" class="btn" style="margin-top:12px;">Сохранить</button>
    `;

    document.getElementById("manual-save").onclick = manualAdd;
}

async function manualAdd() {
    const name = document.getElementById("manual-name").value;
    const url = document.getElementById("manual-url").value;

    if (!name || !url) return alert("Заполните поля!");

    await apiPost("/api/wardrobe/add", {
        user_id: USER_ID,
        name,
        image_url: url,
        item_type: "manual"
    });

    alert("Сохранено!");
    wardrobePage();
}

/* ========== 3) Импорт по ссылке ========== */

async function importByUrl() {
    const url = prompt("Вставьте ссылку на товар:");
    if (!url) return;

    const data = await apiPost("/api/import/fetch", { url });

    content.innerHTML = `<h2>Выберите изображение:</h2>`;

    data.candidates.forEach(c => {
        const img = document.createElement("img");
        img.src = c.url;
        img.className = "candidate-img";
        img.onclick = () => chooseImported(c.url);
        content.appendChild(img);
    });
}

async function chooseImported(url) {
    const name = prompt("Название вещи:");
    if (!name) return;

    await apiPost("/api/wardrobe/add", {
        user_id: USER_ID,
        name,
        image_url: url,
        item_type: "import"
    });

    alert("Добавлено!");
    wardrobePage();
}

/* ========== 4) Луки ========== */
function looksPage() {
    content.innerHTML = `
        <h2>Генерация луков</h2>
        <p>Скоро будет доступно.</p>
    `;
}

/* ========== 5) Профиль ========== */
function profilePage() {
    content.innerHTML = `
        <h2>Профиль</h2>
        <p>ID: <b>${USER_ID}</b></p>
        <p>Здесь будет информация о подписке.</p>
    `;
}

// Default open
wardrobePage();
