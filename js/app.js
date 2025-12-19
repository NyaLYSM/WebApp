// js/app.js - SHINY 3D & WAVE EDITION

(function() {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  
  try { 
    if(tg) {
      tg.expand(); 
      tg.enableClosingConfirmation();
      // Устанавливаем черный хедер, чтобы сливался
      tg.headerColor = '#0b0b12'; 
      tg.backgroundColor = '#0b0b12';
    }
  } catch(e) {}

  const content = document.getElementById("content");
  const navButtons = document.querySelectorAll(".menu .btn-nav");
  const wave = document.getElementById("menu-wave");
  let currentTab = 'marketplace'; 

  // =================================================================================
  // 1. WAVE ANIMATION LOGIC
  // =================================================================================
  function moveWave(targetBtn) {
      // 2 кнопки в ряд, 2 ряда. Определяем позицию.
      // Но у нас Grid 2x2. Логика простая: двигаем transform.
      // Получаем индекс кнопки
      const index = Array.from(navButtons).indexOf(targetBtn);
      
      // Сетка 2 колонки. 
      // X: если index четный (0, 2) -> 0%, если нечетный (1, 3) -> 100% (с учетом отступов)
      // Y: если index < 2 -> 0%, если index >= 2 -> 100%
      
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      // Смещаем. У нас gap 8px и padding 6px.
      // Проще всего через translate в процентах, так как ширина 50%
      // 100% ширины wave + gap (который примерно 16px относительно ширины блока)
      // Точный расчет сложен в CSS calc, упростим:
      
      const x = col * 100 + (col * 4); // 4% поправка на gap
      const y = row * 100 + (row * 10); // поправка на высоту
      
      // В данном случае проще использовать координаты кнопок относительно родителя
      const parentRect = document.getElementById('nav-menu').getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      
      const relX = btnRect.left - parentRect.left;
      const relY = btnRect.top - parentRect.top;
      
      wave.style.width = btnRect.width + 'px';
      wave.style.height = btnRect.height + 'px';
      wave.style.transform = `translate(${relX}px, ${relY}px)`;
  }

  // =================================================================================
  // 2. THEMES
  // =================================================================================
  const PALETTES = [
    { name: "Graphite", bg: "#0b0b12", card: "#15151a", accent: "#6c5ce7", accentDark: "#483d8b" },
    { name: "Rose", bg: "#160b0f", card: "#1f1015", accent: "#e84393", accentDark: "#b71569" },
    { name: "Ocean", bg: "#05101a", card: "#0a1926", accent: "#0984e3", accentDark: "#05589c" },
    { name: "Emerald", bg: "#05140e", card: "#0a2117", accent: "#00b894", accentDark: "#007d63" },
    { name: "Gold", bg: "#141005", card: "#211b0a", accent: "#fdcb6e", accentDark: "#dfa628" },
    { name: "Crimson", bg: "#1a0505", card: "#260a0a", accent: "#ff7675", accentDark: "#d63031" },
  ];

  function applyPalette(p) {
    const r = document.documentElement.style;
    r.setProperty('--bg-color', p.bg); // Для канваса
    r.setProperty('--card-bg', p.card);
    r.setProperty('--accent', p.accent);
    r.setProperty('--accent-dark', p.accentDark);
    
    // Перерисовываем вихрь
    if (window.initWaves) window.initWaves();
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");
    const autoBtn = document.getElementById("palette-auto");

    // Инит
    const saved = localStorage.getItem('selectedPalette');
    const startP = saved ? PALETTES.find(x => x.name === saved) : PALETTES[0];
    applyPalette(startP || PALETTES[0]);

    paletteBtn.onclick = () => overlay.hidden = false;
    closeBtn.onclick = () => overlay.hidden = true;
    overlay.onclick = (e) => { if(e.target === overlay) overlay.hidden = true; };

    grid.innerHTML = PALETTES.map((p, idx) => `
      <div class="p-item" style="background: linear-gradient(135deg, ${p.accent}, ${p.accentDark});" data-idx="${idx}"></div>
    `).join('');

    grid.querySelectorAll('.p-item').forEach(el => {
      el.onclick = () => {
        const idx = el.dataset.idx;
        applyPalette(PALETTES[idx]);
        localStorage.setItem('selectedPalette', PALETTES[idx].name);
        overlay.hidden = true;
      };
    });
    
    if(autoBtn) {
        autoBtn.onclick = () => {
            applyPalette(PALETTES[0]); // Default dark
            overlay.hidden = true;
        }
    }
  }

  // =================================================================================
  // 3. NAVIGATION
  // =================================================================================
  async function loadSection(section, btnElement) {
    // 1. Анимация меню
    navButtons.forEach(b => b.classList.remove('active'));
    if(btnElement) {
        btnElement.classList.add('active');
        moveWave(btnElement);
    }

    // 2. Рендер контента
    if (section === 'wardrobe') await renderWardrobe();
    else if (section === 'populate') renderPopulate();
    else if (section === 'looks') {
        content.innerHTML = `
            <div class="card" style="text-align:center;">
                <h3>✨ AI Looks</h3>
                <p>Нейросеть генерирует...</p>
                <button class="btn" disabled>Скоро</button>
            </div>`;
    } 
    else if (section === 'profile') renderProfile();
  }

  // --- ГАРДЕРОБ ---
  async function renderWardrobe() {
    content.innerHTML = `<div class="loader">Синхронизация...</div>`;
    try {
      const items = await window.apiGet('/api/wardrobe/items');
      if (!items || items.length === 0) {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px 20px;">
                <h3>Пусто</h3>
                <p>Добавьте свои первые вещи</p>
                <button class="btn" onclick="document.querySelector('[data-section=populate]').click()">Добавить</button>
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
      content.innerHTML = `<div class="card" style="color:#ff5e57; text-align:center;">Ошибка: ${e.message}</div>`;
    }
  }

  // --- ДОБАВЛЕНИЕ (ПЕРЕДЕЛАНО ПО ТЗ) ---
  function renderPopulate() {
    content.innerHTML = `
      <div class="card">
        <div class="mode-switch">
          <button class="${currentTab === 'marketplace' ? 'active' : ''}" onclick="window.switchTab('marketplace')">Маркетплейс</button>
          <button class="${currentTab === 'manual' ? 'active' : ''}" onclick="window.switchTab('manual')">Ручное</button>
        </div>
        <div id="populate-form"></div>
      </div>
    `;
    updatePopulateForm();
  }

  window.switchTab = (tab) => {
    currentTab = tab;
    const btns = document.querySelectorAll('.mode-switch button');
    btns[0].classList.toggle('active', tab === 'marketplace');
    btns[1].classList.toggle('active', tab === 'manual');
    updatePopulateForm();
  };

  function updatePopulateForm() {
    const container = document.getElementById("populate-form");
    
    if (currentTab === 'marketplace') {
      // ТЗ: 1. Ссылка (URL), 2. Название
      // ОЙ! В ТЗ сказано "В первой поле название, а ниже поле на ссылку маркетплейса... поменяй поля местами"
      // Значит: Сначала Ссылка, потом Название (как я и сделал в прошлой версии, но видимо я не так понял).
      // Читаем внимательно: "В первой поле название, а ниже поле на ссылку... поменяй поля местами". 
      // Значит должно быть: Ссылка СВЕРХУ, Название СНИЗУ. (Или наоборот?)
      // "поменяй поля местами" от состояния (Название, Ссылка). Значит итог: Ссылка, Название.
      
      container.innerHTML = `
        <div class="input-wrapper">
          <input type="text" id="market-url" class="input" placeholder="Ссылка (WB, Ozon)">
        </div>
        <div class="input-wrapper">
          <input type="text" id="market-name" class="input" placeholder="Название (Джинсы)">
        </div>
        <button class="btn" onclick="window.handleAddMarket()">Добавить</button>
      `;
    } else {
      // ТЗ: Название, затем Ссылка на ФОТО, а левее (рядом) кнопка Галереи.
      container.innerHTML = `
        <div class="input-wrapper">
            <input type="text" id="manual-name" class="input" placeholder="Название вещи">
        </div>
        
        <div class="input-wrapper file-row">
            <input type="text" id="manual-img-url" class="input" placeholder="Ссылка на фото (необяз.)">
            
            <label class="gallery-btn">
                🖼️ <input type="file" id="manual-file" hidden accept="image/*" onchange="document.getElementById('manual-img-url').value = 'Файл: ' + (this.files[0]?.name || '')">
            </label>
        </div>
        
        <button class="btn" onclick="window.handleAddManual()" style="margin-top:10px;">Загрузить</button>
      `;
    }
  }

  // --- ПРОФИЛЬ ---
  function renderProfile() {
    const user = tg?.initDataUnsafe?.user || {};
    const firstName = user.first_name || "Guest";
    const id = user.id || "Unknown";

    content.innerHTML = `
      <div class="card profile-card">
        <div class="profile-name">${firstName}</div>
        <div class="profile-id">ID: ${id}</div>
        <div class="stats-row">
           <div class="stat-box">PRO</div>
           <div class="stat-box">V. 2.1</div>
        </div>
      </div>
    `;
  }

  // =================================================================================
  // 4. API ACTIONS
  // =================================================================================
  function setBtnLoading(btn, isLoading) {
      if(!btn) return;
      if(isLoading) {
          btn.dataset.oldText = btn.innerText;
          btn.innerText = "⏳";
          btn.disabled = true;
      } else {
          btn.innerText = btn.dataset.oldText || "Готово";
          btn.disabled = false;
      }
  }

  window.appDelete = async (id) => {
      if (!confirm("Удалить?")) return;
      await window.apiDelete('/api/wardrobe/delete', { item_id: id });
      renderWardrobe();
  };

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    const name = document.getElementById("market-name").value;
    if (!url) return alert("Введите ссылку");
    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);
    try {
      await window.apiPost('/api/wardrobe/add-marketplace', { url, name: name || "Покупка" });
      loadSection('wardrobe', document.querySelector('[data-section=wardrobe]'));
    } catch (e) { alert(e.message); setBtnLoading(btn, false); }
  };

  window.handleAddManual = async () => {
    const name = document.getElementById("manual-name").value;
    const fileInp = document.getElementById("manual-file");
    const urlInp = document.getElementById("manual-img-url").value;
    
    // Логика: Или файл, или ссылка (если бэкенд поддерживает ссылку на картинку в ручном режиме)
    // Но обычно ручной режим = загрузка файла.
    // Если пользователь ввел ссылку в поле "Ссылка на фото", мы должны отправить ее.
    // Если бэкенд принимает только файл в /upload, то ссылка не сработает без доработки бэкенда.
    // Предположим, мы отправляем файл, если он есть.
    
    if (!name || (!fileInp.files[0] && !urlInp)) return alert("Нужно имя и фото (файл или ссылка)");

    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      if(fileInp.files[0]) {
          formData.append("file", fileInp.files[0]);
      } else {
          // Если есть ссылка на картинку, ее надо как-то передать. 
          // Если API /upload ждет только file, это проблема.
          // Передадим как 'image_url'
          formData.append("image_url", urlInp);
      }

      await window.apiUpload('/api/wardrobe/upload', formData);
      loadSection('wardrobe', document.querySelector('[data-section=wardrobe]'));
    } catch (e) { alert(e.message); setBtnLoading(btn, false); }
  };

  // =================================================================================
  // 5. STARTUP
  // =================================================================================
  async function startApp() {
    setupPalette();
    
    navButtons.forEach(btn => {
      btn.onclick = () => loadSection(btn.dataset.section, btn);
    });

    // Инициализация первой вкладки и волны
    const startBtn = document.querySelector('[data-section=wardrobe]');
    // Ждем небольшой таймаут, чтобы DOM отрисовался для расчета координат волны
    setTimeout(() => loadSection('wardrobe', startBtn), 50);

    const isUp = await window.waitForBackend();
    if (isUp && tg && tg.initData) {
        try {
           const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
           if (res && res.access_token) {
               window.setToken(res.access_token);
               renderWardrobe(); 
           }
        } catch(e) {}
    }
  }

  startApp();
})();
