const tg = window.Telegram.WebApp;
tg.expand();

/* ========== PALETTE SWITCHER ========== */

const palettes = [
    { bg:"#111", card:"#1b1b1b", text:"#fff", accent:"#6c5ce7", waveA:"#6dd3ff", waveB:"#7b61ff" },
    { bg:"#1a0f1f", card:"#241327", text:"#fff", accent:"#d13cff", waveA:"#ff7cfa", waveB:"#b43bff" },
    { bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveA:"#5affcc", waveB:"#00a579" },
    { bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveA:"#77a6ff", waveB:"#4d6aff" },
    { bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveA:"#ff8b8b", waveB:"#ff5252" },
    { bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveA:"#6bbcff", waveB:"#0077ff" }
];

function applyPalette(p) {
    document.documentElement.style.setProperty("--bg", p.bg);
    document.documentElement.style.setProperty("--card", p.card);
    document.documentElement.style.setProperty("--text", p.text);
    document.documentElement.style.setProperty("--accent", p.accent);

    // add wave palette
    document.documentElement.style.setProperty("--wave-start", p.accent);
    document.documentElement.style.setProperty("--wave-end", p.text);

    localStorage.setItem("palette", JSON.stringify(p));

    if (window.startWaves) startWaves(); // перезапуск волн
}



document.getElementById("palette-btn").onclick = () => {
    let current = JSON.parse(localStorage.getItem("palette"));
    let idx = current ? palettes.findIndex(x => x.bg === current.bg) : 0;
    idx = (idx + 1) % palettes.length;
    applyPalette(palettes[idx]);
};

let saved = localStorage.getItem("palette");
if (saved) applyPalette(JSON.parse(saved));
else applyPalette(palettes[0]);

/* ========== NAVIGATION ========== */
document.querySelectorAll(".btn[data-section]").forEach(btn => {
    btn.addEventListener("click", () => {
        const sec = btn.dataset.section;
        if (sec === "wardrobe") loadWardrobe();
        if (sec === "add") loadAddItem();
        if (sec === "looks") loadLooks();
    });
});

/* SIMPLE TABS — ЗАГЛУШКИ */
function loadWardrobe() {
    document.getElementById("content").innerHTML = "<h3>Ваши вещи появятся здесь</h3>";
}

function loadAddItem() {
    document.getElementById("content").innerHTML = "<h3>Добавление вещи</h3>";
}

function loadLooks() {
    document.getElementById("content").innerHTML = "<h3>Ваши луки</h3>";
}


/* ========== IMPORT BY URL ========== */

document.getElementById("import-btn").onclick = async () => {
    const url = prompt("Вставьте ссылку на товар:");
    if (!url) return;

    const data = await apiPost("/import/fetch", { url });

    showCandidates(data.candidates);
};

function showCandidates(list) {
    const c = document.getElementById("content");
    c.innerHTML = "<h3>Выберите изображение:</h3>";

    list.forEach(img => {
        const el = document.createElement("img");
        el.src = img.url;
        el.className = "candidate-img";
        el.onclick = () => chooseImage(img.url);
        c.appendChild(el);
    });
}

async function chooseImage(url) {
    const name = prompt("Название вещи:");
    if (!name) return;

    await apiPost("/import/add", {
        user_id: tg.initDataUnsafe.user.id,
        image_url: url,
        name,
        item_type: "unknown"
    });

    alert("Вещь добавлена!");
}
