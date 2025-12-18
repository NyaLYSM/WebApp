// js/app.js - LIQUID GLASS EDITION (FINAL FIXED)

(function() {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  // Сообщаем Telegram, что мы готовы и хотим на весь экран
  try { 
    if(tg) {
      tg.expand(); 
      tg.enableClosingConfirmation();
      tg.headerColor = '#0b0b12'; // Под цвет фона по умолчанию
      tg.backgroundColor = '#0b0b12';
    }
  } catch(e) {}

  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  let currentTab = 'marketplace'; 

  // =================================================================================
  // 1. КОНФИГУРАЦИЯ ПАЛИТР & АВТО-РЕЖИМ
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
    
    // Обновляем заголовок TMA под цвет
    if(tg) tg.headerColor = p.bg;

    // Обновляем вихрь (Vortex)
    // Важно: в vortex.js должно быть window.initWaves = resize; или аналогично
    if (window.initWaves) window.initWaves();
  }

  function handleAutoPalette() {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Если темно - Dark Blue, если светло (в теории) - можно другую, но у нас все темы темные
    // Поэтому для "Авто" выберем Midnight как нейтральную или Dark Blue как дефолт
    const autoP = isDark ? PALETTES[5] : PALETTES[0]; 
    applyPalette(autoP);
    localStorage.removeItem('selectedPalette'); // Удаляем фиксацию, чтобы работало авто
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");

    // Загрузка сохраненной
    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      const p = PALETTES.find(x => x.name === saved);
      if (p) applyPalette(p);
    } else {
        // Если ничего не сохранено - пытаемся применить дефолт
        applyPalette(PALETTES[0]); 
    }

    paletteBtn.onclick = () => overlay.hidden = false;
    closeBtn.onclick = () => overlay.hidden = true;

    // Генерация HTML палитры
    let html = `
       <div class="p-item auto-theme" id="btn-auto-theme">
          AUTO
       </div>
    `;
    
    html += PALETTES.map(p => `
      <div class="p-item" style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%);" title="${p.name}">
      </div>
    `).join('');

    grid.innerHTML = html;

    // Обработчик AUTO
    document.getElementById("btn-auto-theme").onclick = () => {
        handleAutoPalette();
        overlay.hidden = true;
    };

    // Обработчики цветов
    // Пропускаем первый элемент (Auto), поэтому index+1 в querySelectorAll было бы сложно, 
    // проще взять все p-item кроме первого
    const items = grid.querySelectorAll('.p-item:not(.auto-theme)');
    items.forEach((el, idx) => {
      el.onclick = () => {
        applyPalette(PALETTES[idx]);
        localStorage.setItem('selectedPalette', PALETTES[idx].name);
        overlay.hidden = true;
      };
    });
  }

  // =================================================================================
  // 2. НАВИГАЦИЯ И СЕКЦИИ
  // =================================================================================
  async function loadSection(section) {
    menuBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));
    
    // Плавная анимация ухода контента (опционально)
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
        
        // Появление
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

  // --- ДОБАВЛЕНИЕ (ИСПРАВЛЕНО) ---
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
    // Перерисовываем только контент карточки, чтобы не дергалось всё
    updatePopulateContent();
    // Обновляем кнопки
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

        <button class="btn liquid-glass" onclick="window.handleAddMarket()">
            ✨ Добавить магию
        </button>
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

        <button class="btn liquid-glass" onclick="window.handleAddManual()" style="margin-top:10px;">
            🚀 Загрузить
        </button>
      `;
    }
  }

  // --- ПРОФИЛЬ (ИСПРАВЛЕНО) ---
  function renderProfile() {
    // Безопасное получение данных
    const user = tg?.initDataUnsafe?.user || {};
    const id = user.id || "Local_Dev";
    const firstName = user.first_name || "Guest";
    // Защита от undefined в charAt
    const initial = firstName.charAt(0).toUpperCase() || "?";

    content.innerHTML = `
      <div class="profile-card glass-card">
        <div class="profile-avatar">${initial}</div>
        <h2>${firstName}</h2>
        <p style="opacity: 0.5;">ID: ${id}</p>
        
        <div class="stats-row">
           <div class="stat-item">
             <span style="font-size:18px; font-weight:bold;">1.1.0</span>
             <small>Liquid Ver</small>
           </div>
           <div class="stat-item">
             <span style="font-size:18px; font-weight:bold;">PRO</span>
             <small>Status</small>
           </div>
        </div>
      </div>
      
      <div class="glass-card" style="text-align:center">
         <p>Настройки уведомлений и приватности скоро появятся.</p>
      </div>
    `;
  }

  // =================================================================================
  // 3. API ACTIONS
  // =================================================================================
  
  // Утилитная функция для кнопок
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
      // Используем нативный confirm телеграма если есть, или браузерный
      const confirmed = confirm("Убрать эту вещь из гардероба?");
      if (!confirmed) return;
      
      try {
        await window.apiDelete('/api/wardrobe/delete', { item_id: id });
        renderWardrobe();
      } catch (e) { alert("Ошибка удаления: " + e.message); }
  };

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    const name = document.getElementById("market-name").value; // ТЕПЕРЬ ЧИТАЕМ ИМЯ
    
    if (!url) return alert("Нужна ссылка!");
    
    const btn = document.querySelector("#populate-content .btn");
    setBtnLoading(btn, true, "Парсинг...");

    try {
      // Отправляем name, если пользователь его ввел, иначе бэкенд придумает сам (если умеет)
      await window.apiPost('/api/wardrobe/add-marketplace', { 
          url, 
          name: name || "Новая покупка" 
      });
      loadSection('wardrobe');
    } catch (e) { 
        alert("Ошибка: " + e.message); 
        setBtnLoading(btn, false);
    }
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
    
    // Навигация
    menuBtns.forEach(btn => {
      btn.onclick = () => loadSection(btn.dataset.section);
    });

    // Дефолтная секция
    loadSection('wardrobe');

    // Прогрев
    const isUp = await window.waitForBackend();
    if (isUp) {
      // Авторизация
      if (tg && tg.initData) {
          try {
             const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
             if (res && res.access_token) window.setToken(res.access_token);
          } catch(e) { console.error("Login failed", e); }
      }
      
      // Если мы все еще в гардеробе, обновим его (появится токен - появятся вещи)
      if (document.querySelector('.wardrobe-grid') || document.querySelector('.loader')) {
          renderWardrobe();
      }
    }
  }

  startApp();
})();
