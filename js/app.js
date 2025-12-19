// js/app.js - BUSINESS EDITION

(function() {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  
  // Инициализация Telegram
  try { 
    if(tg) {
      tg.expand(); 
      tg.enableClosingConfirmation();
      tg.headerColor = '#0b0b12'; 
      tg.backgroundColor = '#0b0b12';
    }
  } catch(e) {}

  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  let currentTab = 'marketplace'; 

  // =================================================================================
  // 1. ТЕМЫ И ПАЛИТРЫ
  // =================================================================================
  const PALETTES = [
    { name: "Graphite", bg: "#0b0b12", card: "#15151a", text: "#fff", accent: "#6c5ce7" },
    { name: "Velvet", bg: "#150a18", card: "#1f1024", text: "#fff", accent: "#d041ff" },
    { name: "Forest", bg: "#08140c", card: "#0d1f14", text: "#e0f2f1", accent: "#00b894" },
    { name: "Rust", bg: "#1a0d0d", card: "#261212", text: "#fff0f0", accent: "#ff7675" },
    { name: "Ocean", bg: "#05111a", card: "#081a26", text: "#fff", accent: "#3498db" },
  ];

  function applyPalette(p) {
    const r = document.documentElement.style;
    r.setProperty('--bg', p.bg);
    r.setProperty('--card-bg', p.card);
    r.setProperty('--text', p.text);
    r.setProperty('--accent', p.accent);
    r.setProperty('--accent-dark', adjustColor(p.accent, -20)); // Затемняем для тени

    if(tg) tg.headerColor = p.bg;
    
    // Перезапуск вихря при смене цвета
    if (window.initWaves) window.initWaves();
  }

  // Простая функция затемнения цвета для 3D тени
  function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  function handleAutoPalette() {
    // В бизнес теме авто = Graphite (темная классика)
    applyPalette(PALETTES[0]);
    localStorage.removeItem('selectedPalette');
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");
    const autoBtn = document.getElementById("palette-auto"); // Кнопка "Сбросить" в HTML

    overlay.hidden = true;

    // Загрузка
    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      const p = PALETTES.find(x => x.name === saved);
      if (p) applyPalette(p);
    } else {
        applyPalette(PALETTES[0]); 
    }

    // Открытие/Закрытие
    paletteBtn.onclick = () => overlay.hidden = false;
    closeBtn.onclick = () => overlay.hidden = true;
    overlay.onclick = (e) => { if(e.target === overlay) overlay.hidden = true; };

    // Рендер цветов
    grid.innerHTML = PALETTES.map((p, idx) => `
      <div class="p-item" style="background: ${p.accent};" data-idx="${idx}" title="${p.name}"></div>
    `).join('');

    grid.querySelectorAll('.p-item').forEach(el => {
      el.onclick = () => {
        const idx = el.dataset.idx;
        applyPalette(PALETTES[idx]);
        localStorage.setItem('selectedPalette', PALETTES[idx].name);
        overlay.hidden = true;
      };
    });

    // Обработка кнопки Авто (которая в HTML)
    if(autoBtn) {
        autoBtn.onclick = () => {
            handleAutoPalette();
            overlay.hidden = true;
        };
    }
  }

  // =================================================================================
  // 2. НАВИГАЦИЯ
  // =================================================================================
  async function loadSection(section) {
    menuBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));
    
    // Мгновенное переключение, без лишних анимаций
    if (section === 'wardrobe') await renderWardrobe();
    else if (section === 'populate') renderPopulate();
    else if (section === 'looks') {
        content.innerHTML = `
            <div class="card" style="text-align:center;">
                <h3>AI Стилист</h3>
                <p>Функция в разработке.</p>
                <button class="btn" disabled>Скоро</button>
            </div>`;
    } 
    else if (section === 'profile') renderProfile();
  }

  // --- ГАРДЕРОБ ---
  async function renderWardrobe() {
    // Явный индикатор загрузки
    content.innerHTML = `<div class="loader">Загрузка гардероба...</div>`;
    
    try {
      const items = await window.apiGet('/api/wardrobe/items');
      
      if (!items || items.length === 0) {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px 20px;">
                <h3>Пусто</h3>
                <p>В гардеробе пока нет вещей.</p>
                <button class="btn" onclick="document.querySelector('[data-section=populate]').click()">Добавить вещь</button>
            </div>`;
        return;
      }
      
      content.innerHTML = `
        <div class="wardrobe-grid">
          ${items.map(item => `
            <div class="wardrobe-item">
              <img src="${window.BACKEND_URL}${item.image_url}" alt="${item.name}" loading="lazy">
              <div class="item-footer">
                <div class="item-name">${item.name}</div>
                <button class="delete-icon" onclick="window.appDelete('${item.id}')">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="card" style="color:#ff5e57; text-align:center;">Ошибка связи: ${e.message}</div>`;
    }
  }

  // --- ДОБАВЛЕНИЕ ---
  function renderPopulate() {
    content.innerHTML = `
      <div class="card" style="padding: 10px;">
        <div class="mode-switch">
          <button class="${currentTab === 'marketplace' ? 'active' : ''}" onclick="window.switchTab('marketplace')">По ссылке</button>
          <button class="${currentTab === 'manual' ? 'active' : ''}" onclick="window.switchTab('manual')">Файл</button>
        </div>
        <div id="populate-form"></div>
      </div>
    `;
    updatePopulateForm();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    // Обновляем классы кнопок
    const btns = document.querySelectorAll('.mode-switch button');
    btns[0].classList.toggle('active', tab === 'marketplace');
    btns[1].classList.toggle('active', tab === 'manual');
    updatePopulateForm();
  };

  function updatePopulateForm() {
    const container = document.getElementById("populate-form");
    
    if (currentTab === 'marketplace') {
      container.innerHTML = `
        <div class="input-wrapper">
          <input type="text" id="market-url" class="input" placeholder="Ссылка (WB, Ozon, Lamoda)">
        </div>
        <div class="input-wrapper">
          <input type="text" id="market-name" class="input" placeholder="Название вещи">
        </div>
        <button class="btn" onclick="window.handleAddMarket()">Добавить</button>
      `;
    } else {
      container.innerHTML = `
        <div class="input-wrapper">
            <input type="text" id="manual-name" class="input" placeholder="Название вещи">
        </div>
        <div class="input-wrapper file-row">
            <input type="text" id="file-name-display" class="input" readonly placeholder="Выберите фото..." style="margin-bottom:0;">
            <label class="file-upload-btn">
                📷 <input type="file" id="manual-file" hidden accept="image/*" onchange="document.getElementById('file-name-display').value = this.files[0]?.name || ''">
            </label>
        </div>
        <button class="btn" onclick="window.handleAddManual()" style="margin-top:10px;">Загрузить</button>
      `;
    }
  }

  // --- ПРОФИЛЬ (Без фото) ---
  function renderProfile() {
    const user = tg?.initDataUnsafe?.user || {};
    const id = user.id || "Unknown";
    const firstName = user.first_name || "Пользователь";

    content.innerHTML = `
      <div class="card profile-card">
        <div class="profile-name">${firstName}</div>
        <div class="profile-id">ID: ${id}</div>
        
        <div class="stats-row">
           <div class="stat-box">Ver: 2.0</div>
           <div class="stat-box">Pro Status</div>
        </div>
      </div>
    `;
  }

  // =================================================================================
  // 3. ACTIONS
  // =================================================================================
  function setBtnLoading(btn, isLoading) {
      if(!btn) return;
      if(isLoading) {
          btn.dataset.oldText = btn.innerText;
          btn.innerText = "Обработка...";
          btn.disabled = true;
      } else {
          btn.innerText = btn.dataset.oldText || "Готово";
          btn.disabled = false;
      }
  }

  window.appDelete = async (id) => {
      if (!confirm("Удалить вещь?")) return;
      try {
        await window.apiDelete('/api/wardrobe/delete', { item_id: id });
        renderWardrobe();
      } catch (e) { alert("Ошибка: " + e.message); }
  };

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    const name = document.getElementById("market-name").value;
    if (!url) return alert("Введите ссылку");
    
    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);

    try {
      await window.apiPost('/api/wardrobe/add-marketplace', { url, name: name || "Покупка" });
      loadSection('wardrobe');
    } catch (e) { 
        alert("Ошибка: " + e.message); 
        setBtnLoading(btn, false);
    }
  };

  window.handleAddManual = async () => {
    const nameInput = document.getElementById("manual-name");
    const fileInput = document.getElementById("manual-file");
    
    if (!nameInput.value || !fileInput.files[0]) return alert("Нужно название и фото");

    const formData = new FormData();
    formData.append("name", nameInput.value);
    formData.append("file", fileInput.files[0]);

    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);

    try {
      await window.apiUpload('/api/wardrobe/upload', formData);
      loadSection('wardrobe');
    } catch (e) { 
        alert("Ошибка: " + e.message); 
        setBtnLoading(btn, false);
    }
  };

  // =================================================================================
  // 4. ЗАПУСК
  // =================================================================================
  async function startApp() {
    setupPalette();
    
    // Меню
    menuBtns.forEach(btn => btn.onclick = () => loadSection(btn.dataset.section));

    // Сразу показываем гардероб (пусть грузится визуально)
    loadSection('wardrobe');

    // Логинимся
    const isUp = await window.waitForBackend();
    if (isUp && tg && tg.initData) {
        try {
           const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
           if (res && res.access_token) {
               window.setToken(res.access_token);
               // Обновляем список вещей после логина
               if (document.querySelector('.loader')) renderWardrobe();
           }
        } catch(e) {}
    }
  }

  startApp();
})();
