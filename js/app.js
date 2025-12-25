// js/app.js — ROBUST START & ERROR HANDLING

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
  const navButtons = document.querySelectorAll(".menu .btn-nav");
  const wave = document.getElementById("menu-wave");
  let currentTab = 'marketplace'; 

  // --- WAVE ANIMATION ---
  function moveWave(targetBtn) {
      if(!targetBtn) return;
      const parent = document.getElementById('nav-menu');
      const parentRect = parent.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      const relX = btnRect.left - parentRect.left;
      const relY = btnRect.top - parentRect.top;
      wave.style.width = btnRect.width + 'px';
      wave.style.height = btnRect.height + 'px';
      wave.style.transform = `translate(${relX}px, ${relY}px)`;
  }

  // --- THEMES ---
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
    if (window.initWaves) window.initWaves();
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

    const saved = localStorage.getItem('selectedPalette');
    const startP = saved ? PALETTES.find(x => x.name === saved) : PALETTES[0];
    applyPalette(startP || PALETTES[0]);

    paletteBtn.onclick = () => overlay.hidden = false;
    closeBtn.onclick = () => overlay.hidden = true;
    overlay.onclick = (e) => { if(e.target === overlay) overlay.hidden = true; };

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

    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.onclick = () => {
        const style = btn.dataset.style;
        toggleButtonStyle(style);
        document.querySelectorAll('.style-btn').forEach(b => b.classList.toggle('active', b.dataset.style === style));
      };
    });
    toggleButtonStyle(localStorage.getItem('buttonStyle') || 'normal');
    if(autoBtn) {
        autoBtn.onclick = () => { applyPalette(PALETTES[0]); overlay.hidden = true; }
    }
  }

  // --- NAVIGATION ---
  async function loadSection(section, btnElement) {
    if(btnElement) {
        navButtons.forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        moveWave(btnElement);
    }

    if (section === 'wardrobe') await renderWardrobe();
    else if (section === 'populate') renderPopulate();
    else if (section === 'looks') {
        content.innerHTML = `
            <div class="card" style="text-align:center;">
                <h3>✨ AI Looks</h3>
                <p>Нейросеть генерирует образы...</p>
                <button class="btn" disabled>Скоро</button>
            </div>`;
    } 
    else if (section === 'profile') renderProfile();
  }

  // --- ГАРДЕРОБ (С ЗАЩИТОЙ ОТ ОШИБОК) ---
  async function renderWardrobe() {
    // 1. Сразу показываем лоадер, чтобы пользователь понял, что процесс пошел
    content.innerHTML = `<div class="loader">
        <div style="font-size:24px; margin-bottom:10px;">☁️</div>
        Загрузка гардероба...
    </div>`;
    
    try {
      // 2. Делаем запрос
      const items = await window.apiGet('/api/wardrobe/items');
      
      // 3. Если успех, но пусто
      if (!items || items.length === 0) {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px 20px;">
                <h3>Пусто</h3>
                <p>Ваш гардероб пока пуст.</p>
                <button class="btn" onclick="document.querySelector('[data-section=populate]').click()">Добавить первую вещь</button>
            </div>`;
        return;
      }
      
      // 4. Если есть вещи
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
      // 5. Если ошибка (сервер упал или нет интернета)
      console.error(e);
      content.innerHTML = `
        <div class="card" style="text-align:center; color:#ff5e57;">
            <h3>Ошибка связи 📡</h3>
            <p style="font-size:13px; color:var(--muted); margin-bottom:15px;">
                Не удалось загрузить вещи. Возможно, сервер просыпается.
            </p>
            <p style="font-size:11px; background:#000; padding:5px; border-radius:4px;">${e.message}</p>
            <button class="btn" onclick="window.renderWardrobe()" style="margin-top:15px;">Попробовать снова</button>
        </div>`;
    }
  }

  // --- ДОБАВЛЕНИЕ ---
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
        container.innerHTML = `
          <div class="input-wrapper">
             <input type="text" id="market-name" class="input" placeholder="Название (например: Брюки)">
          </div>
          <div class="input-wrapper">
             <input type="text" id="market-url" class="input" placeholder="Ссылка на товар (WB/Ozon)">
          </div>
          <button class="btn" onclick="window.handleAddMarket()">Добавить</button>
        `;
      } else {
         container.innerHTML = `
           <div class="input-wrapper">
              <input type="text" id="manual-name" class="input" placeholder="Название вещи">
           </div>
           <div class="input-wrapper file-input">
              <input type="text" id="manual-img-url" class="input" placeholder="Ссылка на картинку">
              <span class="file-reset" onclick="window.resetManualFile()">✕</span>
              <label class="gallery-btn">🖼️
                 <input type="file" id="manual-file" hidden accept="image/*">
              </label>
           </div>
           <button class="btn" onclick="window.handleAddManual()" style="margin-top:10px;">Загрузить</button>
         `;
         const fileInput = container.querySelector('#manual-file');
         if (fileInput) {
            fileInput.onchange = function () { window.handleManualFile(this); };
         }
      }
  }

  // --- ACTIONS ---
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

  window.handleManualFile = (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    const textInput = document.getElementById('manual-img-url');
    const wrapper = textInput.closest('.file-input');
    textInput.value = file.name;
    textInput.readOnly = true;
    wrapper.classList.add('has-file');
  };

  window.resetManualFile = () => {
    const fileInput = document.getElementById('manual-file');
    const textInput = document.getElementById('manual-img-url');
    const wrapper = textInput.closest('.file-input');
    fileInput.value = '';
    textInput.value = '';
    textInput.readOnly = false;
    wrapper.classList.remove('has-file');
  };

  window.handleAddMarket = async () => {
    const url = document.getElementById("market-url").value;
    const name = document.getElementById("market-name").value;
    if (!url) return alert("Введите ссылку");
    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);
    try {
      await window.apiPost('/api/wardrobe/add-marketplace', { url, name: name || "Покупка" });
      alert("Добавлено!");
      document.getElementById("market-url").value = "";
    } catch (e) { alert(e.message); }
    finally { setBtnLoading(btn, false); }
  };

  window.handleAddManual = async () => {
    const name = document.getElementById("manual-name").value;
    const fileInp = document.getElementById("manual-file");
    const urlInp = document.getElementById("manual-img-url").value;

    // Проверка: нужно имя И (файл ИЛИ ссылка)
    if (!name) return alert("Введите название вещи");
    if (!fileInp.files[0] && !urlInp) return alert("Добавьте фото (файл или ссылку)");

    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);

    try {
      // ВАРИАНТ 1: Загрузка файла
      if (fileInp.files[0]) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("file", fileInp.files[0]);
      
        await window.apiUpload('/api/wardrobe/add-file', formData);
      } 
      // ВАРИАНТ 2: Загрузка по URL
      else if (urlInp) {
        await window.apiPost('/api/wardrobe/add-manual-url', { 
          name: name,
          url: urlInp 
        });
      }

    // Успех - переходим в гардероб
    loadSection('wardrobe', document.querySelector('[data-section=wardrobe]'));
  } catch (e) {
    alert("Ошибка: " + e.message);
    setBtnLoading(btn, false);
  }
};

  // --- PROFILE ---
  function renderProfile() {
    const user = tg?.initDataUnsafe?.user || {};
    content.innerHTML = `
      <div class="card profile-card">
        <div class="profile-name">${user.first_name || "Гость"}</div>
        <div class="profile-id">ID: ${user.id || "Unknown"}</div>
        <div class="stats-row" style="display:flex; gap:10px; justify-content:center; margin-top:15px;">
           <div class="stat-box" style="background:#000; padding:8px 16px; border-radius:8px; font-size:12px;">PRO STATUS</div>
           <div class="stat-box" style="background:#000; padding:8px 16px; border-radius:8px; font-size:12px;">V 3.1</div>
    `;
  }

  // --- INITIALIZATION (ГЛАВНЫЙ ФИКС) ---
  async function startApp() {
    setupPalette();

    // Навешиваем обработчики меню
    navButtons.forEach(btn => {
      btn.onclick = () => loadSection(btn.dataset.section, btn);
    });

    // 1. Показываем экран "Просыпаемся"
    content.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px 20px;">
            <div style="font-size:40px; margin-bottom:20px;">☕️</div>
            <h3>Сервер просыпается...</h3>
            <p style="color:var(--muted);">Сервер может спать до 50 секунд. Пожалуйста, подождите.</p>
        </div>
    `;

    // 2. Ждем ответа от сервера (до 60 секунд)
    let serverReady = false;
    for(let i=0; i<30; i++) { // 30 попыток по 2 сек
        if(await window.checkBackendHealth()) {
            serverReady = true;
            break;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if(!serverReady) {
        content.innerHTML = `
            <div class="card" style="text-align:center;">
                <h3>Сервер не отвечает 😴</h3>
                <p>Попробуйте перезагрузить бота позже.</p>
                <button class="btn" onclick="location.reload()">Обновить</button>
            </div>`;
        return;
    }

    // 3. Сервер жив! Пробуем авторизоваться (если есть данные Телеграм)
    if (tg && tg.initData) {
      try {
        const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
        if (res && res.access_token) {
          window.setToken(res.access_token);
        }
      } catch(e) {
         console.warn("Auth failed or already logged in", e);
      }
    }

    // 4. Загружаем гардероб (теперь точно безопасно)
    const startBtn = document.querySelector('[data-section=wardrobe]');
    loadSection('wardrobe', startBtn);
    setTimeout(() => moveWave(startBtn), 100);
  }

  startApp();
})();




