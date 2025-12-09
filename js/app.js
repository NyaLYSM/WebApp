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

  // === ВАЖНОЕ ИСПРАВЛЕНИЕ: Гарантированно скрываем при старте ===
  if(overlay) {
      overlay.hidden = true;
      overlay.style.display = 'none'; // Дублируем через стиль для надежности до загрузки CSS
      overlay.setAttribute("aria-hidden", "true");
  }

	// Helper to hide/show
	function showOverlay() {
		overlay.hidden = false;
		// Убираем инлайн-стиль display, чтобы сработал CSS класс (display:flex)
		overlay.style.display = ''; 
		overlay.setAttribute("aria-hidden", "false");
	}
	
	function hideOverlay() {
		// ВАЖНО: Принудительно скрываем через инлайн-стиль для гарантированного закрытия
		overlay.hidden = true;
		overlay.style.display = 'none'; // <-- ГЛАВНОЕ ИСПРАВЛЕНИЕ
		overlay.setAttribute("aria-hidden", "true");
	}

  // Palettes config
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Midnight", bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveStart:"#7bd3ff", waveEnd:"#6a6bff" },
    { name:"Warm", bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveStart:"#ffb199", waveEnd:"#ff6b6b" },
    { name:"Aurora", bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveStart:"#00f0ff", waveEnd:"#7b61ff" }
  ];

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

    if (window.startWaves) {
      try { window.startWaves(); } catch(e){}
    }
  }

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

  function loadSaved(){
    hideOverlay(); // Ensure hidden on load

    const raw = localStorage.getItem("stylist_palette");
    if(raw){
      try { applyPalette(JSON.parse(raw), false); return; }
      catch(e){}
    }
    applyPalette(detectAutoPalette(), true);
  }

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
        hideOverlay();
      };
      paletteGrid.appendChild(el);
    });
  }


  // Listeners

  // 1. Кнопка палитры открывает оверлей
  paletteBtn.addEventListener("click", showOverlay); 

  // 2. АВТО-выбор
  paletteAuto.addEventListener("click", ()=> {
      applyPalette(detectAutoPalette());
      hideOverlay();
  });

  // 3. ПРЯМОЙ СЛУШАТЕЛЬ на кнопку "Закрыть"
  paletteClose.addEventListener("click", e => {
      // Останавливаем любое всплытие, чтобы избежать конфликтов с оверлеем
      e.preventDefault(); 
      e.stopPropagation(); 
      hideOverlay();
  });
  
  // 4. СЛУШАТЕЛЬ на клик по фону (Закрытие при клике мимо карточки)
  overlay.addEventListener("click", e => {
      // Если цель клика - сам оверлей (а не его дочерние элементы)
      if (e.target === overlay){
          hideOverlay();
      }
  });

  // Init
  buildPaletteGrid();
  loadSaved();

  // Waves fallback
  if(window.startWaves) {
    try { window.startWaves(); } catch(e){}
  }
  if(!window.startWaves) window.startWaves = function(){};

  // Safe API helpers
  async function safeApiGet(path, params = {}){
    try {
      if(typeof apiGet === "function") return await apiGet(path, params);
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

  // --- Pages Logic ---

  async function wardrobePage(){
    content.innerHTML = `<h2>Ваши вещи</h2><div id="wardrobe-list"><p>Загрузка…</p></div>`;
    const listEl = document.getElementById("wardrobe-list");

    const data = await safeApiGet("/api/wardrobe/list", { user_id: USER_ID });
    
    // Check various data structures
    if(!data) {
        listEl.innerHTML = `<p>Ошибка соединения с сервером.</p>`;
        return;
    }
    
    // Sometimes backend might return list directly or {items: []}
    const items = data.items || (Array.isArray(data) ? data : []);

    if(items.length === 0){
      listEl.innerHTML = `<p>Гардероб пуст — добавьте вещь.</p>`;
      return;
    }

    listEl.innerHTML = "";
    items.forEach(item => {
      const el = document.createElement("div");
      el.className = "item-card";
      // Fallback for different field names
      const img = item.image_url || item.photo_url || "";
      const name = item.name || item.item_name || "Вещь";
      const type = item.item_type || item.type || "";
      
      el.innerHTML = `
        ${img ? `<img src="${img}" alt="${name}">` : ''}
        <div><strong>${name}</strong></div>
        <div style="color:var(--muted); font-size:13px;">${type}</div>
      `;
      listEl.appendChild(el);
    });
  }

  function addPage(){
    content.innerHTML = `
      <h2>Добавить вещь</h2>
      <input id="manual-name" class="input" placeholder="Название (например: Белая футболка)">
      <input id="manual-url" class="input" placeholder="Ссылка на фото (URL)">
      <button id="manual-save" class="btn" style="margin-top:12px;">Сохранить</button>
    `;
    document.getElementById("manual-save").onclick = manualAdd;
  }

  async function manualAdd(){
    const nameBtn = document.getElementById("manual-save");
    const nameInp = document.getElementById("manual-name");
    const urlInp = document.getElementById("manual-url");
    
    const name = nameInp.value.trim();
    const url = urlInp.value.trim();
    
    if(!name || !url) return alert("Пожалуйста, заполните оба поля.");

    nameBtn.textContent = "Сохранение...";
    nameBtn.disabled = true;

    const res = await safeApiPost("/api/wardrobe/add", {
      user_id: USER_ID,
      name,
      image_url: url,
      item_type: "manual"
    });

    nameBtn.textContent = "Сохранить";
    nameBtn.disabled = false;

    if(res){
      alert("Вещь успешно добавлена!");
      wardrobePage(); // go back to list
      // Update menu state visually
      btns.forEach(x => x.setAttribute("aria-pressed","false"));
      document.querySelector('.btn[data-section="wardrobe"]')?.setAttribute("aria-pressed","true");
    } else {
      alert("Не удалось сохранить. Проверьте консоль.");
    }
  }

  async function importByUrl(){
    const url = prompt("Вставьте ссылку на страницу товара (Wildberries, Lamoda и т.д.):");
    if(!url) return;

    content.innerHTML = `<h2>Поиск изображений</h2><p>Анализирую сайт...</p>`;

    const data = await safeApiPost("/api/import/fetch", { url });
    
    // Handle both {candidates: []} and direct array
    const candidates = data?.candidates || [];

    if(!candidates || candidates.length === 0){
      content.innerHTML = `
        <h2>Ничего не найдено</h2>
        <p>Не удалось извлечь картинки по этой ссылке. Попробуйте добавить вручную.</p>
        <button class="btn" onclick="document.querySelector('.btn[data-section=\\'add\\']').click()">Добавить вручную</button>
      `;
      return;
    }

    content.innerHTML = `<h2>Выберите фото</h2><div id="candidates"></div>`;
    const ctn = document.getElementById("candidates");
    candidates.forEach(c => {
      const img = document.createElement("img");
      img.src = c.url;
      img.className = "candidate-img";
      img.onclick = () => chooseImported(c.url);
      ctn.appendChild(img);
    });
  }

  async function chooseImported(url){
    const name = prompt("Как назвать эту вещь?");
    if(!name) return;
    
    content.innerHTML = `<h2>Сохранение...</h2>`;
    
    const res = await safeApiPost("/api/wardrobe/add", {
      user_id: USER_ID,
      name,
      image_url: url,
      item_type: "import"
    });
    
    if(res){
      alert("Сохранено!");
      wardrobePage();
    } else {
      alert("Ошибка сохранения.");
      wardrobePage();
    }
  }

  function looksPage(){
    content.innerHTML = `
      <h2>Генератор образов</h2>
      <div class="card" style="text-align:center; background:transparent; box-shadow:none;">
        <p style="opacity:0.7">Здесь ИИ будет собирать для вас готовые луки из вашего гардероба.</p>
        <button class="btn" style="margin-top:10px;" onclick="alert('Функция в разработке!')">🎲 Сгенерировать лук</button>
      </div>
    `;
  }

  function profilePage(){
    // Usually unused if no profile button in HTML, but good to have
    content.innerHTML = `<h2>Профиль</h2><p>ID: ${USER_ID}</p>`;
  }

  const pages = {
    wardrobe: wardrobePage,
    add: addPage,
    looks: looksPage,
    profile: profilePage
  };

  btns.forEach(b => {
    b.addEventListener("click", ()=>{
      const sec = b.dataset.section;
      if(sec && pages[sec]) {
        pages[sec]();
        btns.forEach(x => x.setAttribute("aria-pressed","false"));
        b.setAttribute("aria-pressed","true");
      }
    });
  });

  importBtn.addEventListener("click", importByUrl);

  // Init routing
  setTimeout(()=> {
    const first = document.querySelector('.btn[data-section="wardrobe"]');
    if(first) first.setAttribute("aria-pressed","true");
    wardrobePage();
  }, 80);

  // Expose
  window.updateWavesColors = function(){
    if(window.startWaves) { try { window.startWaves(); } catch(e) {} }
  };

})();
