// js/app.js - ПОЛНАЯ ВЕРСИЯ (Liquid Glass Edition)

(function() {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e) {}

  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  let currentTab = 'marketplace'; 

  // =================================================================================
  // 1. КОНФИГУРАЦИЯ ПАЛИТР (6 Вариаций)
  // =================================================================================
  const PALETTES = [
    { name: "Dark Blue", bg: "#0b0b12", card: "rgba(18, 18, 22, 0.7)", text: "#ffffff", accent: "#6c5ce7", waveStart: "#6dd3ff", waveEnd: "#7b61ff" },
    { name: "Purple", bg: "#1a0f1f", card: "rgba(36, 19, 39, 0.7)", text: "#ffffff", accent: "#d13cff", waveStart: "#ff6fd8", waveEnd: "#b06cff" },
    { name: "Emerald", bg: "#06120e", card: "rgba(10, 31, 25, 0.7)", text: "#e0f2f1", accent: "#00b894", waveStart: "#55efc4", waveEnd: "#00b894" },
    { name: "Sunset", bg: "#1a0d0d", card: "rgba(45, 20, 20, 0.7)", text: "#fff0f0", accent: "#ff7675", waveStart: "#fab1a0", waveEnd: "#e17055" },
    { name: "Cyber", bg: "#0d0221", card: "rgba(21, 7, 48, 0.7)", text: "#00f2ff", accent: "#f013bd", waveStart: "#00f2ff", waveEnd: "#f013bd" },
    { name: "Midnight", bg: "#000000", card: "rgba(25, 25, 25, 0.7)", text: "#ffffff", accent: "#3498db", waveStart: "#2980b9", waveEnd: "#6dd5fa" }
  ];

  function applyPalette(p) {
    const r = document.documentElement.style;
    r.setProperty('--bg', p.bg);
    r.setProperty('--card', p.card);
    r.setProperty('--text', p.text);
    r.setProperty('--accent', p.accent);
    r.setProperty('--wave-start', p.waveStart);
    r.setProperty('--wave-end', p.waveEnd);
    localStorage.setItem('selectedPalette', p.name);
    // Обновляем вихрь, если он инициализирован
    if (window.initVortex) window.initVortex();
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");

    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      const p = PALETTES.find(x => x.name === saved);
      if (p) applyPalette(p);
    }

    paletteBtn.onclick = () => overlay.hidden = false;
    closeBtn.onclick = () => overlay.hidden = true;

    grid.innerHTML = PALETTES.map(p => `
      <div class="palette-item" style="background:${p.bg}; border: 2px solid ${p.accent};" title="${p.name}">
        <div style="width:20px; height:20px; background:${p.accent}; border-radius:50%;"></div>
      </div>
    `).join('');

    grid.querySelectorAll('.palette-item').forEach((el, idx) => {
      el.onclick = () => {
        applyPalette(PALETTES[idx]);
        overlay.hidden = true;
      };
    });
  }

  // =================================================================================
  // 2. ЛОГИКА СЕКЦИЙ
  // =================================================================================
  async function loadSection(section) {
    // Подсветка кнопок меню
    menuBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));
    window.location.hash = section;

    if (section === 'wardrobe') {
      renderWardrobe();
    } else if (section === 'populate') {
      renderPopulate();
    } else if (section === 'looks') {
      content.innerHTML = `<div class="glass-info"><h2>✨ Образы</h2><p>AI-стилист подбирает лучшие сочетания для вас. Скоро!</p></div>`;
    } else if (section === 'profile') {
      renderProfile();
    }
  }

  // --- ГАРДЕРОБ ---
  async function renderWardrobe() {
    content.innerHTML = `<div class="loader">Загрузка гардероба...</div>`;
    try {
      const items = await window.apiGet('/api/wardrobe/items');
      if (!items || items.length === 0) {
        content.innerHTML = `<div class="empty-state">Ваш гардероб пуст. Добавьте первую вещь!</div>`;
        return;
      }
      content.innerHTML = `
        <div class="wardrobe-grid">
          ${items.map(item => `
            <div class="wardrobe-item glass-card">
              <img src="${window.BACKEND_URL}${item.image_url}" alt="${item.name}" loading="lazy">
              <div class="item-info">
                <span>${item.name}</span>
                <button class="delete-btn" onclick="window.appDelete('${item.id}')">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<div class="error-state">Ошибка: ${e.message}</div>`;
    }
  }

  // --- ДОБАВЛЕНИЕ (POPULATE) ---
  function renderPopulate() {
    content.innerHTML = `
      <div class="populate-container">
        <div class="mode-switch glass-card">
          <button class="small-btn ${currentTab === 'marketplace' ? 'active' : ''}" onclick="window.switchTab('marketplace')">Маркетплейс</button>
          <button class="small-btn ${currentTab === 'manual' ? 'active' : ''}" onclick="window.switchTab('manual')">Вручную</button>
        </div>
        <div id="populate-content" class="glass-card main-action-card"></div>
      </div>
    `;
    updatePopulateContent();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    renderPopulate();
  };

  function updatePopulateContent() {
    const container = document.getElementById("populate-content");
    if (currentTab === 'marketplace') {
      container.innerHTML = `
        <h3>Ссылка на товар</h3>
        <p class="hint">Вставьте ссылку с Wildberries, Lamoda или Ozon</p>
        <div class="input-wrapper">
          <input type="text" id="market-url" class="input" placeholder="https://...">
        </div>
        <button class="btn btn-primary liquid-glass" onclick="window.handleAddMarket()">Добавить в гардероб</button>
      `;
    } else {
      container.innerHTML = `
        <h3>Ручное добавление</h3>
        <div class="input-wrapper">
          <input type="text" id="manual-name" class="input" placeholder="Название (например: Белая футболка)">
        </div>
        <div class="input-wrapper with-file-btn">
          <input type="text" id="file-name-display" class="input" readonly placeholder="Выберите фото">
          <label class="file-pick-label">
            📸 <input type="file" id="manual-file" hidden onchange="document.getElementById('file-name-display').value = this.files[0]?.name || ''">
          </label>
        </div>
        <button class="btn btn-primary liquid-glass" onclick="window.handleAddManual()">Загрузить</button>
      `;
    }
  }

  // --- ПРОФИЛЬ ---
  function renderProfile() {
    const id = (tg?.initDataUnsafe?.user?.id) || "Local_User";
    const name = (tg?.initDataUnsafe?.user?.first_name) || "Гость";
    content.innerHTML = `
      <div class="profile-card glass-card">
        <div class="profile-avatar">${name[0]}</div>
        <h2>${name}</h2>
        <p>Telegram ID: <code>${id}</code></p>
        <div class="stats-row">
          <div class="stat-item"><span>V 1.0.8</span><br><small>Стабильная</small></div>
        </div>
      </div>
    `;
  }

  // =================================================================================
  // 3. ОБРАБОТЧИКИ ДЕЙСТВИЙ (GLOBAL)
  // =================================================================================
  window.appDelete = async (id) => {
    if (!confirm("Удалить вещь из гардероба?")) return;
    try {
      await window.apiDelete('/api/wardrobe/delete', { item_id: id });
      renderWardrobe();
    } catch (e) { alert(e.message); }
  };

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    if (!url) return alert("Введите ссылку");
    const btn = document.querySelector(".main-action-card .btn");
    btn.disabled = true; btn.innerText = "Обработка...";
    try {
      await window.apiPost('/api/wardrobe/add-marketplace', { url, name: "Товар из магазина" });
      loadSection('wardrobe');
    } catch (e) { alert(e.message); }
    finally { btn.disabled = false; btn.innerText = "Добавить"; }
  };

  window.handleAddManual = async () => {
    const name = document.getElementById("manual-name").value;
    const file = document.getElementById("manual-file").files[0];
    if (!name || !file) return alert("Заполните все поля");
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);

    const btn = document.querySelector(".main-action-card .btn");
    btn.disabled = true; btn.innerText = "Загрузка...";
    try {
      await window.apiUpload('/api/wardrobe/upload', formData);
      loadSection('wardrobe');
    } catch (e) { alert(e.message); }
    finally { btn.disabled = false; btn.innerText = "Загрузить"; }
  };

  // =================================================================================
  // 4. ИНИЦИАЛИЗАЦИЯ
  // =================================================================================
  async function authenticate() {
    if (!tg || !tg.initData) return false;
    try {
      const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
      if (res && res.access_token) {
        window.setToken(res.access_token);
        return true;
      }
    } catch (e) { console.error("Auth error:", e); }
    return false;
  }

  async function startApp() {
    setupPalette();
    
    // Навигация
    menuBtns.forEach(btn => {
      btn.onclick = () => loadSection(btn.dataset.section);
    });

    // Стартовая секция
    loadSection('wardrobe');

    // Прогрев сервера и авторизация
    const isUp = await window.waitForBackend();
    if (isUp) {
      const authed = await authenticate();
      if (authed && window.location.hash === '#wardrobe') {
        renderWardrobe(); // Перерисовываем с данными
      }
    }
  }

  startApp();
})();
