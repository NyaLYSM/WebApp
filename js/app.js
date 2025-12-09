// js/app.js — non-module, self-contained
(function(){
  // safe Telegram WebApp access
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}

  // USER_ID fallback to 0 if not available
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0;

  // Elements
  const content = document.getElementById("content");
  const btns = document.querySelectorAll(".btn[data-section]");
  const importBtn = document.getElementById("import-btn");

  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  const paletteClose = document.getElementById("palette-close");
  const paletteAuto = document.getElementById("palette-auto");

  // Make sure overlay hidden at start
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");

  // Palettes
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Midnight", bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveStart:"#7bd3ff", waveEnd:"#6a6bff" },
    { name:"Warm", bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveStart:"#ffb199", waveEnd:"#ff6b6b" },
    { name:"Aurora", bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveStart:"#00f0ff", waveEnd:"#7b61ff" }
  ];

  // tiny helper: luminance for bg detection
  function getLuminance(hex){
    if(!hex) return 0;
    hex = hex.replace("#","");
    if(hex.length===3) hex = hex.split("").map(c=>c+c).join("");
    const r = parseInt(hex.substr(0,2),16)/255;
    const g = parseInt(hex.substr(2,2),16)/255;
    const b = parseInt(hex.substr(4,2),16)/255;
    const a = [r,g,b].map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  }

  // Apply palette to :root and persist
  function applyPalette(p, persist=true){
    if(!p) return;
    const root = document.documentElement;
    root.style.setProperty("--bg", p.bg);
    root.style.setProperty("--card", p.card);
    root.style.setProperty("--text", p.text);
    root.style.setProperty("--accent", p.accent);
    root.style.setProperty("--wave-start", p.waveStart);
    root.style.setProperty("--wave-end", p.waveEnd);

    const lum = getLuminance(p.bg);
    if(lum > 0.6) root.classList.add("root-light");
    else root.classList.remove("root-light");

    if(persist) {
      try { localStorage.setItem("stylist_palette", JSON.stringify(p)); } catch(e){}
    }

    // If waves script exposes startWaves, call it to refresh colors
    if (window.startWaves) {
      try { window.startWaves(); }
      catch(e){ /* ignore */ }
    }
  }

  // Detect auto palette from Telegram theme if available
  function detectAutoPalette(){
    if (tg?.themeParams?.bg_color) {
      const bg = tg.themeParams.bg_color;
      const lum = getLuminance(bg);
      if(lum > 0.6){
        return { bg:"#ffffff", card:"#fbfbfd", text:"#111", accent:"#4d7cff", waveStart:"#dfe9ff", waveEnd:"#b9befe" };
      }
      return PALETTES[0];
    }
    return PALETTES[0];
  }

  // Load saved palette or detect auto
  function loadSaved(){
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");

    const raw = localStorage.getItem("stylist_palette");
    if(raw){
      try { applyPalette(JSON.parse(raw), false); return; }
      catch(e){}
    }
    applyPalette(detectAutoPalette(), true);
  }

  // Build palette swatches grid
  function buildPaletteGrid(){
    paletteGrid.innerHTML = "";
    PALETTES.forEach((p,idx)=>{
      const el = document.createElement("div");
      el.className = "palette-swatch";
      el.title = p.name;
      el.setAttribute("role","button");
      el.style.background = `linear-gradient(90deg, ${p.waveStart}, ${p.waveEnd})`;
      el.onclick = ()=>{
        applyPalette(p);
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden","true");
      };
      paletteGrid.appendChild(el);
    });
  }

  // overlay open/close handlers
  paletteBtn.addEventListener("click", ()=> {
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden","false");
  });
  paletteClose.addEventListener("click", ()=> {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden","true");
  });
  paletteAuto.addEventListener("click", ()=> {
    applyPalette(detectAutoPalette());
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden","true");
  });
  // click outside card closes overlay
  overlay.addEventListener("click", e => {
    if (e.target === overlay){
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden","true");
    }
  });

  // Build and load palette on init
  buildPaletteGrid();
  loadSaved();

  // If waves loaded and exposes startWaves, call it to ensure color sync
  if(window.startWaves) {
    try { window.startWaves(); } catch(e){}
  }

  // If waves script doesn't expose startWaves but uses CSS variables,
  // we'll expose a safe no-op to avoid errors elsewhere:
  if(!window.startWaves) window.startWaves = function(){};

  // Simple API helpers (use api.js from your project)
  // apiGet and apiPost should already be defined in js/api.js
  async function safeApiGet(path, params = {}){
    try {
      if(typeof apiGet === "function") return await apiGet(path, params);
      // fallback: construct fetch
      const q = new URLSearchParams(params).toString();
      const res = await fetch((window.BACKEND_URL || "") + path + (q ? "?" + q : ""));
      return await res.json();
    } catch(e){
      console.error("API GET error", e);
      return null;
    }
  }
  async function safeApiPost(path, body = {}){
    try {
      if(typeof apiPost === "function") return await apiPost(path, body);
      const res = await fetch((window.BACKEND_URL || "") + path, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch(e){
      console.error("API POST error", e);
      return null;
    }
  }

  // Pages
  async function wardrobePage(){
    content.innerHTML = `<h2>Ваши вещи</h2><div id="wardrobe-list"><p>Загрузка…</p></div>`;
    const listEl = document.getElementById("wardrobe-list");

    const data = await safeApiGet("/api/wardrobe/list", { user_id: USER_ID });
    if(!data || !data.items){
      listEl.innerHTML = `<p>Ошибка загрузки вещей или пусто.</p>`;
      return;
    }

    if(data.items.length === 0){
      listEl.innerHTML = `<p>Гардероб пуст — добавьте вещь.</p>`;
      return;
    }

    listEl.innerHTML = "";
    data.items.forEach(item => {
      const el = document.createElement("div");
      el.className = "item-card";
      const img = item.image_url || item.photo_url || "";
      el.innerHTML = `
        ${img ? `<img src="${img}" alt="${item.name||'item'}">` : ''}
        <div><strong>${item.name || item.item_name || "Без названия"}</strong></div>
        <div style="color:var(--muted); font-size:13px;">${item.item_type || item.itemType || ""}</div>
      `;
      listEl.appendChild(el);
    });
  }

  function addPage(){
    content.innerHTML = `
      <h2>Добавить вещь вручную</h2>
      <input id="manual-name" class="input" placeholder="Название">
      <input id="manual-url" class="input" placeholder="URL картинки">
      <button id="manual-save" class="btn" style="margin-top:8px;">Сохранить</button>
    `;
    document.getElementById("manual-save").onclick = manualAdd;
  }

  async function manualAdd(){
    const name = document.getElementById("manual-name").value.trim();
    const url = document.getElementById("manual-url").value.trim();
    if(!name || !url) return alert("Заполните поля!");

    const res = await safeApiPost("/api/wardrobe/add", {
      user_id: USER_ID,
      name,
      image_url: url,
      item_type: "manual"
    });

    if(res && res.item){
      alert("Сохранено!");
      wardrobePage();
    } else {
      alert("Ошибка при сохранении. Проверьте backend.");
    }
  }

  async function importByUrl(){
    const url = prompt("Вставьте ссылку на товар:");
    if(!url) return;

    content.innerHTML = `<h2>Поиск изображений</h2><p>Загрузка кандидатов…</p>`;

    const data = await safeApiPost("/api/import/fetch", { url });
    if(!data || !data.candidates){
      content.innerHTML = `<p>Картинки не найдены или ошибка.</p>`;
      return;
    }

    content.innerHTML = `<h2>Выберите изображение</h2><div id="candidates"></div>`;
    const ctn = document.getElementById("candidates");
    data.candidates.forEach(c => {
      const img = document.createElement("img");
      img.src = c.url;
      img.className = "candidate-img";
      img.alt = "Кандидат";
      img.onclick = () => chooseImported(c.url);
      ctn.appendChild(img);
    });
  }

  async function chooseImported(url){
    const name = prompt("Название вещи:");
    if(!name) return;
    const res = await safeApiPost("/api/wardrobe/add", {
      user_id: USER_ID,
      name,
      image_url: url,
      item_type: "import"
    });
    if(res && res.item){
      alert("Добавлено!");
      wardrobePage();
    } else {
      alert("Ошибка при добавлении. Проверьте backend.");
    }
  }

  function looksPage(){
    content.innerHTML = `
      <h2>Генерация луков</h2>
      <p>Скоро будет доступно (здесь будет выбор вещей и генерация).</p>
    `;
  }

  function profilePage(){
    content.innerHTML = `
      <h2>Профиль</h2>
      <p>ID: <strong>${USER_ID}</strong></p>
      <p>Информация о подписке будет доступна в боте.</p>
    `;
  }

  // Router setup (buttons)
  const pages = {
    wardrobe: wardrobePage,
    add: addPage,
    looks: looksPage,
    profile: profilePage
  };

  // wire up menu buttons
  btns.forEach(b => {
    b.addEventListener("click", ()=>{
      const sec = b.dataset.section;
      if(sec && pages[sec]) {
        pages[sec]();
        // update aria-pressed for accessibility
        btns.forEach(x => x.setAttribute("aria-pressed","false"));
        b.setAttribute("aria-pressed","true");
      }
    });
  });

  // import button
  importBtn.addEventListener("click", importByUrl);

  // Default open — wardrobe
  setTimeout(()=> {
    // Mark first button pressed
    const first = document.querySelector('.btn[data-section="wardrobe"]');
    if(first) first.setAttribute("aria-pressed","true");
    wardrobePage();
  }, 80);

  // expose a function to update waves from palette changes (safe)
  window.updateWavesColors = function(){
    if(window.startWaves) {
      try { window.startWaves(); } catch(e) {}
    }
  };

})();
