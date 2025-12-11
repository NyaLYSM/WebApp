// js/app.js — non-module
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}

  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0;

  const content = document.getElementById("content");
  const replenishBtn = document.getElementById("replenish-btn");
  const menuBtns = document.querySelectorAll(".btn[data-section]");

  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  const paletteClose = document.getElementById("palette-close");
  const paletteAuto = document.getElementById("palette-auto");
  overlay.hidden = true;
  overlay.style.display = "none";

  // palettes (same as earlier)
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Midnight", bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveStart:"#7bd3ff", waveEnd:"#6a6bff" },
    { name:"Warm", bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveStart:"#ffb199", waveEnd:"#ff6b6b" },
    { name:"Aurora", bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveStart:"#00f0ff", waveEnd:"#7b61ff" }
  ];

  function applyPalette(p, persist=true){
    if(!p) return;
    const root = document.documentElement;
    root.style.setProperty("--bg", p.bg);
    root.style.setProperty("--card", p.card);
    root.style.setProperty("--text", p.text);
    root.style.setProperty("--accent", p.accent);
    root.style.setProperty("--wave-start", p.waveStart);
    root.style.setProperty("--wave-end", p.waveEnd);
    if(persist) try { localStorage.setItem("stylist_palette", JSON.stringify(p)); } catch(e){}
    if (window.updateWavesColors) window.updateWavesColors();
  }

  function detectAutoPalette(){
    if (tg?.themeParams?.bg_color) {
      const bg = tg.themeParams.bg_color;
      // simple luminance guess
      const v = parseInt(bg.replace("#","").slice(0,2),16);
      if(v > 200) return { bg:"#ffffff", card:"#fbfbfd", text:"#111", accent:"#4d7cff", waveStart:"#dfe9ff", waveEnd:"#b9befe" };
    }
    return PALETTES[0];
  }

  function loadSaved(){
    const raw = localStorage.getItem("stylist_palette");
    if(raw){
      try { applyPalette(JSON.parse(raw), false); return; }
      catch(e){}
    }
    applyPalette(detectAutoPalette(), true);
  }

  function buildPaletteGrid(){
    paletteGrid.innerHTML = "";
    PALETTES.forEach((p)=>{
      const el = document.createElement("div");
      el.className = "palette-swatch";
      el.title = p.name;
      el.style.background = `linear-gradient(90deg, ${p.waveStart}, ${p.waveEnd})`;
      el.onclick = ()=>{ applyPalette(p); hideOverlay(); };
      paletteGrid.appendChild(el);
    });
  }

  function showOverlay(){ overlay.hidden = false; overlay.style.display = ""; overlay.setAttribute("aria-hidden","false"); }
  function hideOverlay(){ overlay.hidden = true; overlay.style.display = "none"; overlay.setAttribute("aria-hidden","true"); }

  paletteBtn.addEventListener("click", ()=> showOverlay());
  paletteAuto.addEventListener("click", ()=> { applyPalette(detectAutoPalette()); hideOverlay(); });
  paletteClose.addEventListener("click", ()=> hideOverlay());
  overlay.addEventListener("click", e => { if(e.target === overlay) hideOverlay(); });

  buildPaletteGrid();
  loadSaved();
  if(window.startWaves) window.startWaves();

  // --- Pages ---

  async function wardrobePage(){
    content.innerHTML = `<h2>Ваши вещи</h2><div id="wardrobe-list"><p>Загрузка…</p></div>`;
    const listEl = document.getElementById("wardrobe-list");
    let data;
    try {
      data = await apiGet("/api/wardrobe/list", { user_id: USER_ID });
    } catch(e){
      console.error(e);
      listEl.innerHTML = `<p>Не удалось загрузить данные — проверьте соединение.</p>`;
      return;
    }
    const items = data?.items || [];
    if(items.length === 0){
      listEl.innerHTML = `<p>Гардероб пуст — пополните его.</p>`;
      return;
    }
    listEl.innerHTML = "";
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(2, 1fr)";
    grid.style.gap = "10px";

    items.forEach(it => {
      const block = document.createElement("div");
      block.className = "item-card";
      block.innerHTML = `
        ${it.image_url ? `<img src="${it.image_url}" alt="${it.name}">`:""}
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600">${it.name}</div>
            <div style="font-size:13px;color:var(--muted)">${it.item_type || ""}</div>
          </div>
        </div>
      `;
      grid.appendChild(block);
    });
    listEl.appendChild(grid);
  }

  // Replenish page (two small buttons: URL / Фото)
  function replenishPage(){
    content.innerHTML = `
      <h2>Пополнить гардероб</h2>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button id="tab-url" class="small-btn">URL</button>
        <button id="tab-file" class="small-btn">Фото</button>
      </div>
      <div id="replenish-area"></div>
    `;
    document.getElementById("tab-url").onclick = () => replenishUrl();
    document.getElementById("tab-file").onclick = () => replenishFile();
    // default URL
    replenishUrl();
  }

  // URL tab
  function replenishUrl(){
    const area = document.getElementById("replenish-area");
    area.innerHTML = `
      <div class="card">
        <label>Название</label>
        <input id="r-name" class="input" placeholder="Например: Белая футболка">
        <label>Ссылка на фото</label>
        <input id="r-url" class="input" placeholder="https://...">
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button id="r-add" class="btn">Добавить</button>
          <button id="r-cancel" class="btn" style="background:transparent;color:var(--muted);box-shadow:none;">Отмена</button>
        </div>
        <div id="r-msg" style="margin-top:8px;color:var(--muted);font-size:13px;"></div>
      </div>
    `;
    document.getElementById("r-add").onclick = async ()=>{
      const name = document.getElementById("r-name").value.trim();
      const url = document.getElementById("r-url").value.trim();
      if(!name || !url){ alert("Заполните название и ссылку"); return; }
      document.getElementById("r-add").disabled = true;
      document.getElementById("r-add").textContent = "Добавление...";
      try {
        const res = await apiPost("/api/wardrobe/add_from_url", { user_id: USER_ID, name, url });
        alert("Вещь добавлена!");
        wardrobePage();
      } catch(e){
        console.error(e);
        alert("Ошибка: " + (e.message || e));
      } finally {
        document.getElementById("r-add").disabled = false;
        document.getElementById("r-add").textContent = "Добавить";
      }
    };
    document.getElementById("r-cancel").onclick = () => wardrobePage();
  }

  // File tab
  function replenishFile(){
    const area = document.getElementById("replenish-area");
    area.innerHTML = `
      <div class="card">
        <label>Название</label>
        <input id="f-name" class="input" placeholder="Например: Синяя куртка">
        <label>Фото</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="f-fake" class="input" placeholder="Не выбрано" readonly style="flex:1">
          <button id="f-choose" class="small-btn" title="Выбрать фото">🖼️</button>
          <button id="f-clear" class="small-btn" title="Очистить" style="display:none">✖</button>
        </div>
        <input type="file" id="real-file" accept="image/*" style="display:none">
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button id="f-add" class="btn">Добавить</button>
          <button id="f-cancel" class="btn" style="background:transparent;color:var(--muted);box-shadow:none;">Отмена</button>
        </div>
        <div id="f-msg" style="margin-top:8px;color:var(--muted);font-size:13px;"></div>
      </div>
    `;

    const realFile = document.getElementById("real-file");
    const fake = document.getElementById("f-fake");
    const chooseBtn = document.getElementById("f-choose");
    const clearBtn = document.getElementById("f-clear");

    chooseBtn.onclick = () => realFile.click();
    clearBtn.onclick = () => {
      realFile.value = "";
      fake.value = "";
      fake.placeholder = "Не выбрано";
      clearBtn.style.display = "none";
    };

    realFile.addEventListener("change", (e)=>{
      const f = realFile.files[0];
      if(!f) return;
      // file size limit check (5MB)
      if(f.size > 5 * 1024 * 1024){ alert("Файл слишком большой (>5MB)"); realFile.value=""; return; }
      fake.value = f.name;
      clearBtn.style.display = "";
    });

    document.getElementById("f-add").onclick = async () => {
      const name = document.getElementById("f-name").value.trim();
      const f = realFile.files[0];
      if(!name) { alert("Введите название"); return; }
      if(!f) { alert("Выберите фото"); return; }
      const fd = new FormData();
      fd.append("user_id", USER_ID);
      fd.append("name", name);
      fd.append("file", f, f.name);
      document.getElementById("f-add").disabled = true;
      document.getElementById("f-add").textContent = "Загрузка...";
      try {
        const res = await apiUploadFile("/api/wardrobe/add_from_file", fd);
        alert("Вещь добавлена!");
        wardrobePage();
      } catch(e){
        console.error(e);
        alert("Ошибка: " + (e.message || e));
      } finally {
        document.getElementById("f-add").disabled = false;
        document.getElementById("f-add").textContent = "Добавить";
      }
    };

    document.getElementById("f-cancel").onclick = () => wardrobePage();
  }

  function looksPage(){
    content.innerHTML = `<h2>Генератор луков</h2><p style="opacity:.7">Скоро здесь будет ИИогенерация луков.</p>`;
  }

  function inspoPage(){
    content.innerHTML = `<h2>Вдохновение</h2><p style="opacity:.7">Место для ленты образов — пусто пока.</p>`;
  }

  const pages = {
    wardrobe: wardrobePage,
    looks: looksPage,
    inspo: inspoPage
  };

  // menu handlers
  replenishBtn.addEventListener("click", () => {
    replenishPage();
    // unset other pressed
    document.querySelectorAll(".btn[data-section]").forEach(x => x.setAttribute("aria-pressed","false"));
  });
  menuBtns.forEach(b => {
    b.addEventListener("click", ()=>{
      const sec = b.dataset.section;
      if(sec && pages[sec]) {
        pages[sec]();
        // mark pressed state
        document.querySelectorAll(".btn[data-section]").forEach(x => x.setAttribute("aria-pressed","false"));
        b.setAttribute("aria-pressed","true");
      }
    });
  });

  // init
  setTimeout(()=> {
    document.querySelector('.btn[data-section="wardrobe"]')?.setAttribute("aria-pressed","true");
    wardrobePage();
  }, 80);

  // external API to update waves
  window.updateWavesColors = function(){ if(window.startWaves) try{ window.startWaves(); } catch(e){} };

})();
