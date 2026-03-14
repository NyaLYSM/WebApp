// js/app.js — FULL VERSION (UI + STABILITY FIXES)

(function() {
  // 1. Инициализация Telegram WebApp
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  
  try { 
    if(tg) {
      tg.expand(); 
      tg.enableClosingConfirmation();
      // Устанавливаем цвета хедера под темную тему по умолчанию
      tg.headerColor = '#0b0b12'; 
      tg.backgroundColor = '#0b0b12';
    }
  } catch(e) {
    console.warn("Telegram API not available", e);
  }

  // Основные элементы
  const content = document.getElementById("content");
  const navButtons = document.querySelectorAll(".menu .btn-nav");
  const wave = document.getElementById("menu-wave");
  let currentTab = 'marketplace'; 

  // --- WAVE ANIMATION (Ваша оригинальная логика) ---
  function moveWave(targetBtn) {
      if(!targetBtn) return;
      const parent = document.getElementById('nav-menu');
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      
      const relX = btnRect.left - parentRect.left;
      const relY = btnRect.top - parentRect.top;
      
      wave.style.width = btnRect.width + 'px';
      wave.style.height = btnRect.height + 'px';
      wave.style.transform = `translate(${relX}px, ${relY}px)`;
  }

  // --- THEMES & PALETTES (Ваша оригинальная логика) ---
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
    r.setProperty('--bg-color', p.bg);
    r.setProperty('--card-bg', p.card);
    r.setProperty('--accent', p.accent);
    r.setProperty('--accent-dark', p.accentDark);
  }

  function toggleButtonStyle(style) {
    document.body.classList.toggle('caramel-buttons', style === 'caramel');
    localStorage.setItem('buttonStyle', style);
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");
    const autoBtn = document.getElementById("palette-auto");

    // Загрузка сохраненной темы
    const saved = localStorage.getItem('selectedPalette');
    const startP = saved ? PALETTES.find(x => x.name === saved) : PALETTES[0];
    applyPalette(startP || PALETTES[0]);

    if (paletteBtn) paletteBtn.onclick = () => overlay.hidden = false;
    if (closeBtn) closeBtn.onclick = () => overlay.hidden = true;
    if (overlay) overlay.onclick = (e) => { if(e.target === overlay) overlay.hidden = true; };

    if (grid) {
        grid.innerHTML = PALETTES.map((p, idx) => `
          <div class="p-item" style="background: linear-gradient(135deg, ${p.accent}, ${p.accentDark});" data-idx="${idx}"></div>
        `).join('');

        grid.querySelectorAll('.p-item').forEach(item => {
          item.onclick = () => {
            const idx = +item.dataset.idx;
            const p = PALETTES[idx];
            applyPalette(p);
            localStorage.setItem('selectedPalette', p.name);
            grid.querySelectorAll('.p-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
          };
        });
    }

    // Стиль кнопок
    const savedStyle = localStorage.getItem('buttonStyle') || 'normal';
    toggleButtonStyle(savedStyle);
    
    document.querySelectorAll('.style-btn').forEach(btn => {
      // Подсветка активной кнопки стиля
      if(btn.dataset.style === savedStyle) btn.classList.add('active');
      
      btn.onclick = () => {
        const style = btn.dataset.style;
        toggleButtonStyle(style);
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    if(autoBtn) {
        autoBtn.onclick = () => { applyPalette(PALETTES[0]); overlay.hidden = true; }
    }
  }

  // --- NAVIGATION SYSTEM ---
  async function loadSection(section, btnElement) {
    // Анимация меню
    if(btnElement) {
        navButtons.forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        moveWave(btnElement);
    }

    // Роутинг
    if (section === 'wardrobe') await renderWardrobe();
    else if (section === 'populate') renderPopulate();
    else if (section === 'looks') {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px 20px;">
                <h3>✨ AI Looks</h3>
                <p>Нейросеть генерирует образы...</p>
                <div style="margin-top:20px; font-size:12px; opacity:0.7;">В разработке</div>
            </div>`;
    } 
    else if (section === 'profile') renderProfile();
  }

  // --- RENDER: WARDROBE (С ФИКСОМ items.map) ---
  async function renderWardrobe() {
    content.innerHTML = `<div class="loader">
        <div style="font-size:24px; margin-bottom:10px;">☁️</div>
        Загрузка гардероба...
    </div>`;
    
    try {
      let items = await window.apiGet('/api/wardrobe/items');
      
      // === CRITICAL FIX ===
      // Если пришел null, undefined или объект ошибки, подменяем на пустой массив,
      // чтобы .map() не вызывал краш всего приложения.
      if (!Array.isArray(items)) {
          console.warn("API returned non-array for wardrobe:", items);
          items = [];
      }
      
      if (items.length === 0) {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px 20px;">
                <h3>Пусто</h3>
                <p>Ваш гардероб пока пуст.</p>
                <button class="btn" onclick="document.querySelector('[data-section=populate]').click()">Добавить первую вещь</button>
            </div>`;
        return;
      }
      
      content.innerHTML = `
        <div class="wardrobe-grid">
          ${items.map(item => `
            <div class="wardrobe-item">
              <img src="${window.resolveUrl(item.image_url)}" alt="${item.name}" loading="lazy">
              <div class="item-footer">
                <div class="item-name">${item.name}</div>
                <button class="delete-icon" onclick="window.appDelete('${item.id}')">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      console.error(e);
      content.innerHTML = `
        <div class="card" style="text-align:center; color:#ff5e57;">
            <h3>Ошибка связи</h3>
            <p style="font-size:11px; margin-bottom:10px;">Не удалось загрузить вещи.</p>
            <button class="btn" onclick="window.renderWardrobe()">Попробовать снова</button>
        </div>`;
    }
  }

  // --- RENDER: POPULATE (ADD ITEMS) ---
  function renderPopulate() {
    content.innerHTML = `
      <div class="card">
        <div class="mode-switch">
          <button class="${currentTab === 'marketplace' ? 'active' : ''}" onclick="window.switchTab('marketplace')">Маркетплейс</button>
          <button class="${currentTab === 'manual' ? 'active' : ''}" onclick="window.switchTab('manual')">Ручное</button>
        </div>
        <div id="populate-form" style="margin-top: 15px;"></div>
      </div>
    `;
    updatePopulateForm();
  }

/**
 * Показывает UI для выбора варианта изображения
 * @param {Object} data - {temp_id, suggested_name, variants: {original, smart_crop, tight_crop, enhanced}}
 */
  function showVariantSelector(data) {
  const { temp_id, suggested_name, variants, total_images } = data;
  
  // Создаём HTML для всех фотографий
  const variantCards = Object.entries(variants).map(([key, imageUrl], index) => {
    return `
      <div class="variant-card" data-variant="${key}">
        <div class="variant-image">
          <img src="${window.resolveUrl(imageUrl)}" alt="Фото ${index + 1}" loading="lazy">
          <div class="variant-check">✓</div>
        </div>
        <div class="variant-info">
          <div class="variant-title">Фото ${index + 1}</div>
        </div>
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div class="variant-selector-container">
      <div class="variant-header">
        <h2>Выберите лучшее фото</h2>
        <p class="variant-subtitle">Найдено ${total_images} ${total_images === 1 ? 'изображение' : 'изображений'} товара</p>
      </div>

      <div class="variant-name-input">
        <label>Название:</label>
        <input 
          type="text" 
          id="variant-name" 
          class="input" 
          value="${suggested_name || ''}" 
          placeholder="Введите название..."
          maxlength="100"
        >
        <p style="font-size: 11px; color: var(--muted); margin-top: 6px;">
          💡 Автоматически извлечено из карточки товара
        </p>
      </div>

      <div class="variant-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));">
        ${variantCards}
      </div>

      <div class="variant-actions">
        <button class="btn btn-secondary" onclick="window.cancelVariantSelection()">
          Отмена
        </button>
        <button class="btn btn-primary" id="save-variant-btn">
          Сохранить выбранное
        </button>
      </div>
    </div>
  `;

  // Логика выбора варианта
  let selectedVariant = Object.keys(variants)[0]; // Первое фото по умолчанию
  
  const variantCards_nodes = document.querySelectorAll('.variant-card');
  variantCards_nodes.forEach(card => {
    card.addEventListener('click', () => {
      variantCards_nodes.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedVariant = card.dataset.variant;
    });
  });

  // Первое фото активно по умолчанию
  if (variantCards_nodes.length > 0) {
    variantCards_nodes[0].classList.add('active');
  }

  // Обработчик сохранения
  document.getElementById('save-variant-btn').onclick = async () => {
    const nameInput = document.getElementById('variant-name');
    const finalName = nameInput.value.trim();

    if (!finalName) {
      alert("Введите название вещи");
      nameInput.focus();
      return;
    }

    const btn = document.getElementById('save-variant-btn');
    btn.disabled = true;
    btn.innerText = "⏳ Сохранение...";

    try {
      const result = await window.apiSelectVariant(temp_id, selectedVariant, finalName);
      
      if (result) {
        alert("✅ Вещь успешно добавлена!");
        document.querySelector('[data-section=wardrobe]').click();
      } else {
        throw new Error("Пустой ответ от сервера");
      }
    } catch (e) {
      alert("❌ Ошибка при сохранении: " + e.message);
      btn.disabled = false;
      btn.innerText = "Сохранить выбранное";
    }
  };
}

  // Функция отмены выбора
  window.cancelVariantSelection = () => {
    if (confirm("Отменить добавление вещи?")) {
      renderPopulate(); // Возвращаемся к форме добавления
    }
  };
  
    window.switchTab = (tab) => {
      currentTab = tab;
      const btns = document.querySelectorAll('.mode-switch button');
      // Безопасная проверка на существование кнопок
      if (btns.length >= 2) {
          btns[0].classList.toggle('active', tab === 'marketplace');
          btns[1].classList.toggle('active', tab === 'manual');
      }
      updatePopulateForm();
    };
    
    function updatePopulateForm() {
        const container = document.getElementById("populate-form");
        if (!container) return;

        if (currentTab === 'marketplace') {
          container.innerHTML = `
            <div class="input-wrapper">
               <input type="text" id="market-url" class="input" placeholder="Ссылка на товар (WB/Ozon)">
            </div>
            <div class="input-wrapper" style="margin-top:10px;">
               <input type="text" id="market-name" class="input" placeholder="Название (необязательно)">
            </div>
            <button class="btn" onclick="window.handleAddMarket()" style="margin-top:15px;">Загрузить</button>
            <p style="font-size:10px; color:var(--muted); margin-top:10px; text-align:center;">
              Поддерживает Wildberries, Lamoda и прямые ссылки на фото.
            </p>
          `;
        } else {
           container.innerHTML = `
             <div class="input-wrapper">
                <input type="text" id="manual-name" class="input" placeholder="Название вещи">
             </div>
           
             <div class="input-wrapper file-input" style="margin-top:10px;">
                <input type="text" id="manual-img-url" class="input" placeholder="Ссылка на картинку">
                <span class="file-reset" onclick="window.resetManualFile()">✕</span>
                <label class="gallery-btn">🖼️
                   <input type="file" id="manual-file" hidden accept="image/*">
                </label>
             </div>
           
             <button class="btn" onclick="window.handleAddManual()" style="margin-top:15px;">Загрузить</button>
             <p style="font-size:10px; color:var(--muted); margin-top:10px; text-align:center;">
               Загрузите файл с устройства или вставьте ссылку.
             </p>
           `;
         
           // Привязываем событие input для файла
           const fileInput = container.querySelector('#manual-file');
           if (fileInput) {
              fileInput.onchange = function () { window.handleManualFile(this); };
           }
        }
    }

    // --- ACTIONS & HANDLERS ---
  
    // Утилита для состояния кнопки загрузки
    function setBtnLoading(btnSelector, isLoading) {
        const btn = document.querySelector(btnSelector);
        if(!btn) return;
      
        if(isLoading) {
            btn.dataset.oldText = btn.innerText;
            btn.innerText = "⏳ Обработка...";
            btn.disabled = true;
            btn.style.opacity = "0.7";
        } else {
            btn.innerText = btn.dataset.oldText || "Готово";
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    }

    // Удаление вещи
    window.appDelete = async (id) => {
        if (!confirm("Удалить эту вещь из гардероба?")) return;
      
        const success = await window.apiDelete('/api/wardrobe/delete', { item_id: id });
        if (success) {
            renderWardrobe();
        } else {
            alert("Не удалось удалить. Попробуйте еще раз.");
        }
    };

    // Обработка выбора файла (визуальная часть)
    window.handleManualFile = (input) => {
      const file = input.files && input.files[0];
      if (!file) return;
    
      const textInput = document.getElementById('manual-img-url');
      const wrapper = textInput.closest('.file-input');
    
      textInput.value = file.name; // Показываем имя файла
      textInput.readOnly = true;   // Блокируем ручной ввод ссылки
      wrapper.classList.add('has-file');
    };

    // Сброс файла
    // ЗАМЕНИТЬ существующую функцию window.handleAddMarket в app.js на эту:

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    const name = document.getElementById("market-name").value;
  
    if (!url) return alert("Пожалуйста, введите ссылку.");

    setBtnLoading("#populate-form .btn", true);

    try {
      // 🆕 НОВЫЙ ЭНДПОИНТ: генерирует варианты
      const res = await window.apiAddMarketplaceWithVariants(url, name || "");
    
      if (res && res.temp_id) {
        // Показываем селектор вариантов
        showVariantSelector(res);
      } else {
        throw new Error("Не удалось обработать изображение");
      }
    
    } catch (e) { 
      alert("Ошибка при добавлении: " + e.message); 
      setBtnLoading("#populate-form .btn", false);
    } finally { 
      // НЕ сбрасываем загрузку здесь, так как переходим на другой экран
    }
  };

    // Добавление: Ручное (Файл или URL)
    window.handleAddManual = async () => {
      const name = document.getElementById("manual-name").value;
      const fileInp = document.getElementById("manual-file");
      const urlInp = document.getElementById("manual-img-url").value;

      if (!name) return alert("Введите название вещи");
      if ((!fileInp.files || !fileInp.files[0]) && !urlInp) {
          return alert("Добавьте фото (файл или ссылку)");
      }

      setBtnLoading("#populate-form .btn", true);

      try {
        // Сценарий 1: Загрузка файла
        if (fileInp.files && fileInp.files[0]) {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("file", fileInp.files[0]);
          await window.apiUpload('/api/wardrobe/add-file', formData);
        } 
        // Сценарий 2: Загрузка ссылки
        else if (urlInp) {
          await window.apiPost('/api/wardrobe/add-manual-url', { name: name, url: urlInp });
        }
      
        alert("Вещь добавлена!");
        document.querySelector('[data-section=wardrobe]').click();
      
      } catch (e) {
          alert("Ошибка: " + e.message);
      } finally {
          setBtnLoading("#populate-form .btn", false);
      }
    };

    // --- RENDER: PROFILE ---
    function renderProfile() {
      const user = tg?.initDataUnsafe?.user || {};
      content.innerHTML = `
        <div class="card profile-card" style="text-align: center;">
          <div style="font-size: 40px; margin-bottom: 10px;">👤</div>
          <div class="profile-name" style="font-size: 18px; font-weight: bold;">${user.first_name || "Гость"}</div>
          <div class="profile-id" style="color: var(--muted); font-size: 12px; margin-bottom: 20px;">ID: ${user.id || "Unknown"}</div>
        
          <div class="stats-row" style="display:flex; gap:10px; justify-content:center;">
             <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:8px 16px; border-radius:8px; font-size:12px;">PRO STATUS</div>
             <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:8px 16px; border-radius:8px; font-size:12px;">V 3.3</div>
          </div>
      `;
    }

    // --- INITIALIZATION (ЗАПУСК С ЗАЩИТОЙ) ---
    async function startApp() {
      setupPalette();
    
      // Навешиваем обработчики меню
      navButtons.forEach(btn => btn.onclick = () => loadSection(btn.dataset.section, btn));

      // 1. Экран подключения
      content.innerHTML = `
          <div class="card" style="text-align:center; padding: 40px 20px;">
              <div style="font-size:40px; margin-bottom:20px;">📡</div>
              <h3>Подключение</h3>
              <p id="conn-log" style="color:var(--muted); font-size:12px; margin-top:10px;">
                  Связываемся с сервером...
              </p>
          </div>
      `;

      // 2. ЦИКЛ ПРОВЕРКИ СЕРВЕРА (Максимум 20 попыток по 2 секунды)
      let serverReady = false;
      const maxRetries = 20;
    
      for(let i = 1; i <= maxRetries; i++) {
          // Обновляем статус на экране
          const statusEl = document.getElementById('conn-log');
          if(statusEl) statusEl.innerText = `Попытка ${i}/${maxRetries}...`;
        
          // Проверяем здоровье (функция из api.js)
          const isHealthy = await window.checkBackendHealth();
        
          if(isHealthy) {
              serverReady = true;
              break; 
          }
        
          // Ждем 2 секунды перед следующей попыткой
          await new Promise(r => setTimeout(r, 2000));
      }

      // Если сервер так и не ответил
      if(!serverReady) {
          content.innerHTML = `
              <div class="card" style="text-align:center;">
                  <h3 style="color:#ff7675">Сервер недоступен</h3>
                  <p>Не удалось подключиться. Возможно, сервер "спит" или обновляется.</p>
                  <button class="btn" onclick="location.reload()" style="margin-top:20px;">
                      Попробовать снова
                  </button>
              </div>`;
          return;
      }

      // 3. АВТОРИЗАЦИЯ (Только если сервер жив)
      let isAuthenticated = false;
    
      // Если есть данные от Телеграма, пробуем залогиниться
      if (tg && tg.initData) {
        try {
          const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
          if (res && res.access_token) {
            window.setToken(res.access_token);
            isAuthenticated = true;
          }
        } catch(e) {
           console.warn("Auth check failed:", e);
        }
      }
    
      // Проверка сохраненного токена, если новый логин не прошел
      if (!isAuthenticated && window.getToken()) {
          isAuthenticated = true; 
      }

      // 4. Если не авторизовались
      if (!isAuthenticated) {
          content.innerHTML = `
              <div class="card" style="text-align:center; padding:30px;">
                  <h3>Вход не выполнен 🔐</h3>
                <p>Сессия истекла. Пожалуйста, перезапустите бота.</p>
                  <button class="btn" onclick="location.reload()">Перезагрузить</button>
              </div>`;
          return; 
      }

      // 5. УСПЕШНЫЙ ЗАПУСК
      const startBtn = document.querySelector('[data-section=wardrobe]');
      if (startBtn) {
          loadSection('wardrobe', startBtn);
          // Небольшая задержка для корректного расчета позиции волны
          setTimeout(() => moveWave(startBtn), 150);
      }
    }

    // Запуск приложения
    startApp();
})();
