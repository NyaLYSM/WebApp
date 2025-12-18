// js/app.js - ПОЛНАЯ ВЕРСИЯ (Восстановлено + Исправлено)

(function(){
  // 1. Инициализация Telegram
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  // Данные пользователя для профиля
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || "Не определен (Локальный режим)";

  // DOM Элементы
  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  
  // Глобальное состояние для вкладок в разделе "Добавить"
  let currentTab = 'marketplace'; 

  // =================================================================================
  // 1. ПАЛИТРА
  // =================================================================================
  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const paletteGrid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close"); 
    const autoBtn = document.getElementById("palette-auto");

    const PALETTES = [
      { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
      { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
      { name:"Midnight", bg:"#050505", card:"#111111", text:"#eeeeee", accent:"#00d1ff", waveStart:"#00d1ff", waveEnd:"#007aff" },
      { name:"Emerald", bg:"#0a120b", card:"#121a13", text:"#ffffff", accent:"#00ff88", waveStart:"#00ff88", waveEnd:"#00a35c" }
    ];

    if (!paletteBtn || !overlay) return;

    paletteBtn.onclick = () => overlay.hidden = false;
    if (closeBtn) closeBtn.onclick = () => overlay.hidden = true;

    if (paletteGrid) {
      paletteGrid.innerHTML = "";
      PALETTES.forEach(p => {
        const d = document.createElement("div");
        d.className = "palette-item";
        d.style.background = p.accent;
        d.onclick = () => {
          const r = document.documentElement.style;
          r.setProperty('--bg', p.bg);
          r.setProperty('--card', p.card);
          r.setProperty('--text', p.text);
          r.setProperty('--accent', p.accent);
          r.setProperty('--wave-start', p.waveStart);
          r.setProperty('--wave-end', p.waveEnd);
          if (window.initWaves) window.initWaves();
          overlay.hidden = true;
        };
        paletteGrid.appendChild(d);
      });
    }
  }

  // =================================================================================
  // 2. НАВИГАЦИЯ И СЕКЦИИ
  // =================================================================================
  async function loadSection(section) {
    console.log("Navigating to:", section);
    content.innerHTML = '<div class="loader">Подождите...</div>';

    // Снимаем активный класс со всех кнопок и ставим на нужную
    menuBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));

    try {
      if (section === 'wardrobe') {
        renderWardrobe();
      } else if (section === 'populate') {
        renderPopulate();
      } else if (section === 'looks') {
        content.innerHTML = `<h2>✨ Образы</h2><p class="empty-msg">Этот раздел находится в разработке.</p>`;
      } else if (section === 'profile') {
        renderProfile();
      }
    } catch (err) {
      content.innerHTML = `<div class="error-msg">Ошибка загрузки раздела: ${err.message}</div>`;
    }
  }

  // --- Рендер Гардероба ---
  async function renderWardrobe() {
    try {
      const items = await window.apiGet('/api/wardrobe/items');
      if (!items || items.length === 0) {
        content.innerHTML = '<div class="empty-msg">Гардероб пуст. Добавьте свою первую вещь!</div>';
        return;
      }
      content.innerHTML = '<div class="grid" id="wardrobe-grid"></div>';
      const grid = document.getElementById('wardrobe-grid');
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.innerHTML = `
          <img src="${window.BACKEND_URL}${item.image_url}" alt="${item.name}" loading="lazy">
          <div class="card-info">
            <p>${item.name}</p>
            <button class="delete-btn" data-id="${item.id}">🗑️</button>
          </div>
        `;
        div.querySelector('.delete-btn').onclick = () => handleDelete(item.id);
        grid.appendChild(div);
      });
    } catch (e) {
      content.innerHTML = `<div class="error-msg">Не удалось связаться с сервером.</div>`;
    }
  }

  // --- Рендер Добавления (с твоими вкладками) ---
  function renderPopulate() {
    content.innerHTML = `
      <div class="add-container">
        <div class="mode-switch">
          <button class="small-btn ${currentTab === 'marketplace' ? 'active' : ''}" id="tab-market">По ссылке</button>
          <button class="small-btn ${currentTab === 'manual' ? 'active' : ''}" id="tab-manual">Вручную</button>
        </div>

        <div id="market-form" class="add-content ${currentTab === 'marketplace' ? '' : 'hidden'}">
          <input type="text" id="item-name" class="input" placeholder="Название (например: Белая футболка)">
          <div class="input-group">
            <input type="text" id="item-url" class="input" placeholder="Ссылка на товар">
          </div>
          <button id="btn-add-market" class="btn btn-primary">Добавить в гардероб</button>
        </div>

        <div id="manual-form" class="add-content ${currentTab === 'manual' ? '' : 'hidden'}">
          <input type="text" id="manual-name" class="input" placeholder="Название">
          <label class="file-upload-label">
            <input type="file" id="manual-file" hidden accept="image/*">
            <span class="btn-file-select">📸 Выбрать фото</span>
          </label>
          <button id="btn-add-manual" class="btn btn-primary">Загрузить</button>
        </div>
      </div>
    `;

    // Логика переключения вкладок
    document.getElementById('tab-market').onclick = () => {
      currentTab = 'marketplace';
      renderPopulate();
    };
    document.getElementById('tab-manual').onclick = () => {
      currentTab = 'manual';
      renderPopulate();
    };

    // Привязка действий к кнопкам
    const btnMarket = document.getElementById('btn-add-market');
    if (btnMarket) btnMarket.onclick = handleAddMarketplace;

    const btnManual = document.getElementById('btn-add-manual');
    if (btnManual) btnManual.onclick = handleAddManual;
  }

  // --- Рендер Профиля (Только ID) ---
  function renderProfile() {
    content.innerHTML = `
      <div class="profile-container" style="text-align: center; padding: 10px;">
        <h2 class="section-title">⚙️ Профиль</h2>
        <div class="card-item" style="padding: 25px; margin-top: 20px;">
          <p style="color: var(--muted); margin-bottom: 10px; font-size: 0.9rem;">Ваш Telegram ID:</p>
          <code style="font-size: 1.4rem; color: var(--accent); font-weight: bold; letter-spacing: 1px;">
            ${USER_ID}
          </code>
        </div>
        <p style="margin-top: 30px; font-size: 0.7rem; color: var(--muted); opacity: 0.5;">
          Version 1.1.0-stable
        </p>
      </div>
    `;
  }

  // =================================================================================
  // 3. ОБРАБОТЧИКИ ДЕЙСТВИЙ (API)
  // =================================================================================
  async function handleAddMarketplace() {
    const name = document.getElementById('item-name').value;
    const url = document.getElementById('item-url').value;
    if (!name || !url) return alert("Заполните все поля");

    try {
      await window.apiPost('/api/wardrobe/add-marketplace', { name, url });
      alert("Вещь добавлена!");
      loadSection('wardrobe');
    } catch (e) { alert(e.message); }
  }

  async function handleAddManual() {
    const name = document.getElementById('manual-name').value;
    const fileInput = document.getElementById('manual-file');
    if (!name || !fileInput.files[0]) return alert("Введите имя и выберите фото");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', fileInput.files[0]);

    try {
      await window.apiUpload('/api/wardrobe/add-file', formData);
      alert("Загружено успешно!");
      loadSection('wardrobe');
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm("Удалить эту вещь?")) return;
    try {
      await window.apiDelete(`/api/wardrobe/delete?item_id=${id}`);
      renderWardrobe();
    } catch (e) { alert(e.message); }
  }

  // =================================================================================
  // 4. ЗАПУСК ПРИЛОЖЕНИЯ
  // =================================================================================
  async function authenticate() {
    if (!tg || !tg.initData) return false;
    try {
      const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
      if (res && res.access_token) {
        window.setToken(res.access_token);
        return true;
      }
    } catch (e) {
      console.error("Auth error:", e);
    }
    return false;
  }

  function main() {
    setupPalette();

    // Настройка кнопок меню
    menuBtns.forEach(btn => {
      btn.onclick = (e) => loadSection(e.currentTarget.dataset.section);
    });

    // Сразу показываем гардероб (он будет крутить лоадер)
    loadSection('wardrobe');

    // Фоновая авторизация и прогрев
    (async () => {
      const isUp = await window.waitForBackend();
      if (isUp) {
        const authed = await authenticate();
        if (authed) {
          // Если авторизовались успешно — обновляем гардероб уже с данными
          if (document.querySelector('.menu .btn[data-section="wardrobe"]').classList.contains('active')) {
            renderWardrobe();
          }
        }
      }
    })();
  }

  // Точка входа
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();
