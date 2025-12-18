// js/app.js - FIX: MODAL BUG & PALETTE LAYOUT

(function() {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
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
  // 1. КОНФИГУРАЦИЯ ПАЛИТР
  // =================================================================================
  const PALETTES = [
    { name: "Dark Blue", bg: "#0b0b12", text: "#ffffff", accent: "#6c5ce7", waveStart: "#6dd3ff", waveEnd: "#7b61ff" },
    { name: "Purple", bg: "#1a0f1f", text: "#ffffff", accent: "#d13cff", waveStart: "#ff6fd8", waveEnd: "#b06cff" },
    { name: "Emerald", bg: "#06120e", text: "#e0f2f1", accent: "#00b894", waveStart: "#55efc4", waveEnd: "#00b894" },
    { name: "Sunset", bg: "#1a0d0d", text: "#fff0f0", accent: "#ff7675", waveStart: "#fab1a0", waveEnd: "#e17055" },
    { name: "Cyber", bg: "#0d0221", text: "#00f2ff", accent: "#f013bd", waveStart: "#00f2ff", waveEnd: "#f013bd" },
    { name: "Midnight", bg: "#000000", text: "#ffffff", accent: "#3498db", waveStart: "#2980b9", waveEnd: "#6dd5fa" }
  ];

  function applyPalette(p) {
    const r = document.documentElement.style;
    r.setProperty('--bg', p.bg);
    r.setProperty('--text', p.text);
    r.setProperty('--accent', p.accent);
    r.setProperty('--wave-start', p.waveStart);
    r.setProperty('--wave-end', p.waveEnd);
    if(tg) tg.headerColor = p.bg;
    if (window.initWaves) window.initWaves();
  }

  function handleAutoPalette() {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const autoP = isDark ? PALETTES[5] : PALETTES[0]; 
    applyPalette(autoP);
    localStorage.removeItem('selectedPalette');
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");

    // ФИКС БАГА: Принудительно скрываем оверлей при инициализации
    // (совместно с CSS [hidden] {display: none !important})
    overlay.hidden = true;

    // Загрузка сохраненной
    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      const p = PALETTES.find(x => x.name === saved);
      if (p) applyPalette(p);
    } else {
        applyPalette(PALETTES[0]); 
    }

    paletteBtn.onclick = () => overlay.hidden = false;
    closeBtn.onclick = () => overlay.hidden = true;

    // 1. Генерируем ТОЛЬКО цвета в сетку (без кнопки Авто)
    grid.innerHTML = PALETTES.map(p => `
      <div class="p-item" style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%);" title="${p.name}">
      </div>
    `).join('');

    // 2. Вставляем кнопку Авто СНИЗУ под сеткой (если её еще нет)
    let autoBtn = document.getElementById('palette-auto-btn');
    if (!autoBtn) {
        // Создаем кнопку с классом liquid-glass и специальным классом для позиционирования
        const btnHTML = `
            <button id="palette-auto-btn" class="btn liquid-glass btn-auto-toggle">
                ✨ Авто (Системная)
            </button>
        `;
        // Вставляем сразу после грида
        grid.insertAdjacentHTML('afterend', btnHTML);
        autoBtn = document.getElementById('palette-auto-btn');
    }

    // Обработчик для новой кнопки Авто
    if(autoBtn) {
        autoBtn.onclick = () => {
            handleAutoPalette();
            overlay.hidden = true;
        };
    }

    // Обработчики цветов
    grid.querySelectorAll('.p-item').forEach((el, idx) => {
      el.onclick = () => {
        applyPalette(PALETTES[idx]);
        localStorage.setItem('selectedPalette', PALETTES[idx].name);
        overlay.hidden = true;
      };
    });
  }

  // =================================================================================
  // 2. НАВИГАЦИЯ
  // =================================================================================
  async function loadSection(section) {
    menuBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));
    content.style.opacity = 0;
    
    setTimeout(async () => {
        if (section === 'wardrobe') await renderWardrobe();
        else if (section === 'populate') renderPopulate();
        else if (section === 'looks') {
            content.innerHTML = `
                <div class="glass-card" style="text-align:center;">
                    <h2>✨ AI Стилист</h2>
                    <p>Нейросеть анализирует ваш гардероб...</p>
                    <button class="btn liquid-glass" disabled>Скоро</button>
                </div>`;
        } 
        else if (section === 'profile') renderProfile();
        content.style.opacity = 1;
    }, 200);
  }

  // --- ГАРДЕРОБ ---
  async function renderWardrobe() {
    content.innerHTML = `<div class="loader">Сдуваем пыль с полок...</div>`;
    try {
      const items = await window.apiGet('/api/wardrobe/items');
      if (!items || items.length === 0) {
        content.innerHTML = `
            <div class="glass-card" style="text-align:center; padding: 40px 20px;">
                <h3>Пусто 🌑</h3>
                <p>Ваш гардероб пока пуст.<br>Добавьте первую вещь!</p>
                <button class="btn liquid-glass" onclick="document.querySelector('[data-section=populate]').click()">Добавить</button>
            </div>`;
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
      content.innerHTML = `<div class="glass-card" style="color:#ff7675; text-align:center;">Ошибка: ${e.message}</div>`;
    }
  }

  // --- ДОБАВЛЕНИЕ ---
  function renderPopulate() {
    content.innerHTML = `
      <div class="populate-container">
        <div class="glass-card" style="padding:10px;">
            <div class="mode-switch">
              <button class="${currentTab === 'marketplace' ? 'active' : ''}" onclick="window.switchTab('marketplace')">🔗 Ссылка</button>
              <button class="${currentTab === 'manual' ? 'active' : ''}" onclick="window.switchTab('manual')">📤 Загрузка</button>
            </div>
        </div>
        <div id="populate-content" class="glass-card"></div>
      </div>
    `;
    updatePopulateContent();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    updatePopulateContent();
    const btns = document.querySelectorAll('.mode-switch button');
    btns[0].classList.toggle('active', tab === 'marketplace');
    btns[1].classList.toggle('active', tab === 'manual');
  };

  function updatePopulateContent() {
    const container = document.getElementById("populate-content");
    if (currentTab === 'marketplace') {
      container.innerHTML = `
        <h3>Импорт по ссылке</h3>
        <p>Wildberries, Lamoda, Ozon</p>
        <div class="input-wrapper">
          <input type="text" id="market-url" class="input" placeholder="https://wildberries.ru/catalog/...">
        </div>
        <div class="input-wrapper">
          <input type="text" id="market-name" class="input" placeholder="Название (например: Синие джинсы)">
        </div>
        <button class="btn liquid-glass" onclick="window.handleAddMarket()">✨ Добавить магию</button>
      `;
    } else {
      container.innerHTML = `
        <h3>Ручная загрузка</h3>
        <p>Фото из галереи + описание</p>
        <div class="input-wrapper">
            <input type="text" id="manual-name" class="input" placeholder="Что это за вещь?">
        </div>
        <div class="input-wrapper file-row">
            <input type="text" id="file-name-display" class="input" readonly placeholder="Выберите фото..." style="margin-bottom:0;">
            <label class="file-label liquid-glass">
                🖼️ <input type="file" id="manual-file" hidden accept="image/*" onchange="document.getElementById('file-name-display').value = this.files[0]?.name || ''">
            </label>
        </div>
        <button class="btn liquid-glass" onclick="window.handleAddManual()" style="margin-top:10px;">🚀 Загрузить</button>
      `;
    }
  }

  // --- ПРОФИЛЬ ---
  function renderProfile() {
    const user = tg?.initDataUnsafe?.user || {};
    const id = user.id || "Local_Dev";
    const firstName = user.first_name || "Guest";
    const initial = firstName.charAt(0).toUpperCase() || "?";

    content.innerHTML = `
      <div class="profile-card glass-card">
        <div class="profile-avatar">${initial}</div>
        <h2>${firstName}</h2>
        <p style="opacity: 0.5;">ID: ${id}</p>
        <div class="stats-row">
           <div class="stat-item"><span style="font-size:18px; font-weight:bold;">1.1.2</span><small>Patch Fix</small></div>
           <div class="stat-item"><span style="font-size:18px; font-weight:bold;">PRO</span><small>Status</small></div>
        </div>
      </div>
      <div class="glass-card" style="text-align:center">
         <p>Настройки уведомлений и приватности скоро появятся.</p>
      </div>
    `;
  }

  // =================================================================================
  // 3. ACTIONS
  // =================================================================================
  function setBtnLoading(btn, isLoading, text = "") {
      if(!btn) return;
      if(isLoading) {
          btn.dataset.oldText = btn.innerText;
          btn.innerText = text;
          btn.disabled = true;
          btn.style.opacity = 0.7;
      } else {
          btn.innerText = btn.dataset.oldText || "Готово";
          btn.disabled = false;
          btn.style.opacity = 1;
      }
  }

  window.appDelete = async (id) => {
      if (!confirm("Убрать эту вещь из гардероба?")) return;
      try {
        await window.apiDelete('/api/wardrobe/delete', { item_id: id });
        renderWardrobe();
      } catch (e) { alert("Ошибка удаления: " + e.message); }
  };

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    const name = document.getElementById("market-name").value;
    if (!url) return alert("Нужна ссылка!");
    const btn = document.querySelector("#populate-content .btn");
    setBtnLoading(btn, true, "Парсинг...");
    try {
      await window.apiPost('/api/wardrobe/add-marketplace', { url, name: name || "Новая покупка" });
      loadSection('wardrobe');
    } catch (e) { alert("Ошибка: " + e.message); setBtnLoading(btn, false); }
  };

  window.handleAddManual = async () => {
    const nameInput = document.getElementById("manual-name");
    const fileInput = document.getElementById("manual-file");
    if (!nameInput.value || !fileInput.files[0]) return alert("Заполните имя и выберите фото");
    const formData = new FormData();
    formData.append("name", nameInput.value);
    formData.append("file", fileInput.files[0]);
    const btn = document.querySelector("#populate-content .btn");
    setBtnLoading(btn, true, "Загрузка...");
    try {
      await window.apiUpload('/api/wardrobe/upload', formData);
      loadSection('wardrobe');
    } catch (e) { alert("Ошибка: " + e.message); setBtnLoading(btn, false); }
  };

  // =================================================================================
  // 4. START
  // =================================================================================
  async function startApp() {
    setupPalette();
    menuBtns.forEach(btn => btn.onclick = () => loadSection(btn.dataset.section));
    loadSection('wardrobe');
    const isUp = await window.waitForBackend();
    if (isUp) {
      if (tg && tg.initData) {
          try {
             const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
             if (res && res.access_token) window.setToken(res.access_token);
          } catch(e) {}
      }
      if (document.querySelector('.wardrobe-grid') || document.querySelector('.loader')) {
          renderWardrobe();
      }
    }
  }

  startApp();
})();
