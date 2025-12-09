// js/app.js (non-module)
(function(){
  // Telegram shim (safe if not present)
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try{ tg && tg.expand && tg.expand(); } catch(e){}

  // USER ID (from Telegram if available) - fallback 0 for testing
  const USER_ID = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) ? tg.initDataUnsafe.user.id : 0;

  const content = document.getElementById("content");
  const btns = document.querySelectorAll(".btn[data-section]");
  const importBtn = document.getElementById("import-btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  const paletteClose = document.getElementById("palette-close");
  const paletteAuto = document.getElementById("palette-auto");

  // 6 palettes: each has bg, card, text, accent, waveStart, waveEnd
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Midnight", bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveStart:"#7bd3ff", waveEnd:"#6a6bff" },
    { name:"Warm", bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveStart:"#ffb199", waveEnd:"#ff6b6b" },
    { name:"Aurora", bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveStart:"#00f0ff", waveEnd:"#7b61ff" }
  ];

  // Apply palette to :root
  function applyPalette(p, persist=true){
    if(!p) return;
    document.documentElement.style.setProperty("--bg", p.bg);
    document.documentElement.style.setProperty("--card", p.card);
    document.documentElement.style.setProperty("--text", p.text);
    document.documentElement.style.setProperty("--muted", p.muted || 'rgba(255,255,255,0.72)');
    document.documentElement.style.setProperty("--accent", p.accent);
    document.documentElement.style.setProperty("--wave-start", p.waveStart || p.accent);
    document.documentElement.style.setProperty("--wave-end", p.waveEnd || p.accent);

    // if palette is light-ish - add helper class for light tweaks
    const bgLum = getLuminance(p.bg);
    if (bgLum > 0.6) document.documentElement.classList.add("root-light");
    else document.documentElement.classList.remove("root-light");

    // persist
    if (persist) localStorage.setItem("stylist_palette", JSON.stringify(p));

    // update waves (function from waves.js)
    if (window.updateWavesColors) window.updateWavesColors();
  }

  // luminance helper
  function getLuminance(hex){
    hex = hex.replace("#",""); if(hex.length===3) hex = hex.split("").map(c=>c+c).join("");
    const r = parseInt(hex.substr(0,2),16)/255;
    const g = parseInt(hex.substr(2,2),16)/255;
    const b = parseInt(hex.substr(4,2),16)/255;
    // sRGB luminance
    const a = [r,g,b].map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  }

  // detect Telegram theme if available (dark/light)
  function detectAutoPalette(){
    // Telegram WebApp provides themeParams sometimes
    if (tg && tg.themeParams) {
      const bg = tg.themeParams.bg_color || tg.themeParams.background_color || tg.themeParams.background || null;
      const text = tg.themeParams.text_color || null;
      if (bg) {
        // choose nearest palette by bg luminance
        const lum = getLuminance(bg);
        // if light, pick the warm/light-like; else dark variants
        if (lum > 0.6) {
          // light-ish fallback
          return { bg: "#ffffff", card:"#fbfbfd", text:"#111", accent:"#4d7cff", waveStart:"#cfe9ff", waveEnd:"#b9befe" };
        } else {
          // dark default
          return PALETTES[0];
        }
      }
    }
    return PALETTES[0];
  }

  // load saved palette or auto
  function loadSaved(){
    const raw = localStorage.getItem("stylist_palette");
    if (raw) {
      try{ applyPalette(JSON.parse(raw), false); return; } catch(e){}
    }
    // default: use auto detection
    applyPalette(detectAutoPalette(), true);
  }

  // build palette overlay grid
  function buildPaletteGrid(){
    paletteGrid.innerHTML = "";
    PALETTES.forEach((p, i) => {
      const sw = document.createElement("div");
      sw.className = "palette-swatch";
      sw.title = p.name;
      sw.style.background = `linear-gradient(90deg, ${p.waveStart || p.accent}, ${p.waveEnd || p.accent})`;
      sw.onclick = ()=> { applyPalette(p); overlay.hidden = true; };
      paletteGrid.appendChild(sw);
    });
  }

  // Toggle overlay
  paletteBtn.addEventListener("click", ()=> {
    overlay.hidden = false;
  });
  paletteClose.addEventListener("click", ()=> overlay.hidden = true);
  paletteAuto.addEventListener("click", ()=> {
    const auto = detectAutoPalette();
    applyPalette(auto);
    overlay.hidden = true;
  });

  // Close overlay on outside click
  overlay.addEventListener("click", (e)=>{
    if (e.target === overlay) overlay.hidden = true;
  });

  // init
  buildPaletteGrid();
  loadSaved();

  // ensure waves start (in case waves script loaded earlier)
  if (window.startWaves) window.startWaves();

  // ROUTES / pages
  const pages = {
    wardrobe: wardrobePage,
    add: addPage,
    looks: looksPage,
    profile: profilePage
  };

  // attach menu buttons
  btns.forEach(b => b.addEventListener("click", ()=> {
    const sec = b.dataset.section;
    if (sec && pages[sec]) pages[sec]();
  }));

  // Import by URL
  importBtn.addEventListener("click", importByUrl);

  // default open - wardrobe
  wardrobePage();

  // ---------- PAGES ----------
  async function wardrobePage(){
    content.innerHTML = `<div class="card"><h2>Ваши вещи</h2><div id="wardrobe-list">Загрузка...</div></div>`;
    try {
      const data = await window.apiGet("/api/wardrobe/list", { user_id: USER_ID });
      const list = document.getElementById("wardrobe-list");
      list.innerHTML = "";
      if (!data.items || data.items.length === 0) {
        list.innerHTML = `<p>Пока нет вещей — добавьте первую.</p>`;
        return;
      }
      data.items.forEach(item => {
        const el = document.createElement("div");
        el.className = "item-card";
        el.innerHTML = `
          <img src="${item.image_url || item.photo_url || ''}" alt="${escapeHtml(item.name || 'Вещь')}" loading="lazy">
          <div><b>${escapeHtml(item.name || '')}</b> — <span>${escapeHtml(item.item_type || '')}</span></div>
        `;
        list.appendChild(el);
      });
    } catch(err){
      content.innerHTML = `<div class="card"><h2>Ваши вещи</h2><p>Ошибка при загрузке: ${escapeHtml(err.message)}</p></div>`;
      console.error(err);
    }
  }

  function addPage(){
    content.innerHTML = `
      <div class="card">
        <h2>Добавить вещь вручную</h2>
        <input id="manual-name" class="input" placeholder="Название">
        <input id="manual-url" class="input" placeholder="URL картинки">
        <button id="manual-save" class="btn" style="margin-top:8px;">Сохранить</button>
      </div>
    `;
    document.getElementById("manual-save").addEventListener("click", manualAdd);
  }

  async function manualAdd(){
    const name = document.getElementById("manual-name").value.trim();
    const url = document.getElementById("manual-url").value.trim();
    if (!name || !url) return alert("Заполните поля");
    try {
      await window.apiPost("/api/wardrobe/add", { user_id: USER_ID, name, image_url: url, item_type: "manual" });
      alert("Сохранено");
      wardrobePage();
    } catch(e){
      alert("Ошибка: " + e.message);
    }
  }

  function looksPage(){
    content.innerHTML = `<div class="card"><h2>Генерация луков</h2><p>Функция скоро появится.</p></div>`;
  }

  function profilePage(){
    content.innerHTML = `<div class="card"><h2>Профиль</h2><p>ID: <b>${USER_ID}</b></p><p>Подписки — в боте.</p></div>`;
  }

  // Import flow (fetch candidates, show images, choose)
  async function importByUrl(){
    const url = prompt("Вставьте ссылку на товар:");
    if (!url) return;
    content.innerHTML = `<div class="card"><h2>Поиск изображений...</h2><p>Пожалуйста подождите...</p></div>`;
    try{
      const data = await window.apiPost("/api/import/fetch", { url });
      if (!data.candidates || data.candidates.length === 0) {
        content.innerHTML = `<div class="card"><h2>Картинки не найдены</h2></div>`;
        return;
      }
      // show candidates
      content.innerHTML = `<div class="card"><h2>Выберите изображение</h2><div id="candidates"></div></div>`;
      const ctn = document.getElementById("candidates");
      data.candidates.forEach(c => {
        const img = document.createElement("img");
        img.src = c.url;
        img.className = "candidate-img";
        img.alt = "Кандидат";
        img.addEventListener("click", ()=> chooseImported(c.url));
        ctn.appendChild(img);
      });
    } catch(e){
      content.innerHTML = `<div class="card"><h2>Ошибка</h2><p>${escapeHtml(e.message)}</p></div>`;
      console.error(e);
    }
  }

  async function chooseImported(url){
    const name = prompt("Название вещи:");
    if (!name) return;
    try{
      await window.apiPost("/api/wardrobe/add", { user_id: USER_ID, name, image_url: url, item_type: "import" });
      alert("Добавлено");
      wardrobePage();
    } catch(e){
      alert("Ошибка: " + e.message);
    }
  }

  // small helper
  function escapeHtml(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g, function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];}); }

  // expose some controls for debugging (optional)
  window._stylist = {
    applyPalette, getPalettes: ()=>PALETTES
  };

  // ensure palette persist on unload
  window.addEventListener("beforeunload", ()=> {
    const raw = localStorage.getItem("stylist_palette");
    if(raw) localStorage.setItem("stylist_palette", raw);
  });

})();
