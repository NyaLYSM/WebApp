import { apiGet, apiPost } from "./api.js";

const tg = window.Telegram.WebApp;
tg.expand();

const USER_ID = tg.initDataUnsafe?.user?.id || 0;
const content = document.getElementById("content");

// pages map
const routes = {
    wardrobe: wardrobePage,
    add: addPage,
    looks: looksPage
};

// bind main buttons
document.querySelectorAll(".btn[data-section]").forEach(btn => {
    btn.addEventListener("click", () => loadPage(btn.dataset.section));
});

// import by link
document.getElementById("import-btn").onclick = importByUrl;

function loadPage(name) {
    routes[name]?.();
}

/* ========= wardrobe ========= */
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
            <img src="${item.image_url}">
            <div class="item-meta">
                <b>${item.name}</b><br>
                <span>${item.item_type}</span>
            </div>
        `;
        list.appendChild(el);
    });
}

/* ========= manual add ========= */
function addPage() {
    content.innerHTML = `
        <h2>Добавить вручную</h2>
        <input id="manual-name" class="input" placeholder="Название">
        <input id="manual-url" class="input" placeholder="URL картинки">
        <button id="manual-save" class="btn">Сохранить</button>
    `;

    document.getElementById("manual-save").onclick = manualAdd;
}

async function manualAdd() {
    const name = document.getElementById("manual-name").value;
    const url = document.getElementById("manual-url").value;
    if (!name || !url) return alert("Заполните поля");

    await apiPost("/api/wardrobe/add", {
        user_id: USER_ID,
        name,
        image_url: url,
        item_type: "manual"
    });

    alert("Добавлено!");
    wardrobePage();
}

/* ========= import by URL ========= */
async function importByUrl() {
    const url = prompt("Введите ссылку на товар:");
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

/* ========= looks ========= */
function looksPage() {
    content.innerHTML = `
        <h2>Генерация луков</h2>
        <p>Скоро...</p>
    `;
}

wardrobePage();
