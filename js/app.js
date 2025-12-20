// js/app.js - CARAMEL VORTEX EDITION

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

  // =================================================================================
  // 1. WAVE ANIMATION (FIXED ALIGNMENT)
  // =================================================================================
  function moveWave(targetBtn) {
      if(!targetBtn) return;
      
      const parent = document.getElementById('nav-menu');
      const parentRect = parent.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      
      // Вычисляем позицию относительно родителя
      const relX = btnRect.left - parentRect.left;
      const relY = btnRect.top - parentRect.top;
      
      // Учитываем паддинг родителя (6px), чтобы плашка не вылезала
      // Но так как мы используем относительные координаты от края до края кнопки, 
      // просто ставим размеры кнопки.
      
      wave.style.width = btnRect.width + 'px';
      wave.style.height = btnRect.height + 'px';
      wave.style.transform = `translate(${relX}px, ${relY}px)`;
  }

  // =================================================================================
  // 2. THEMES & TEXTURES
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
    r.setProperty('--bg-color', p.bg);
    r.setProperty('--card-bg', p.card);
    r.setProperty('--accent', p.accent);
    r.setProperty('--accent-dark', p.accentDark);
    if (window.initWaves) window.initWaves();
  }

  function setupPalette() {
    const paletteBtn = document.getElementById("palette-btn");
    const overlay = document.getElementById("palette-overlay");
    const grid = document.getElementById("palette-grid");
    const closeBtn = document.getElementById("palette-close");
    const autoBtn = document.getElementById("palette-auto");

  function toggleButtonStyle(style) {
    document.body.classList.toggle(
      'caramel-buttons',
      style === 'caramel'
    );
    localStorage.setItem('buttonStyle', style);
  }

    // 1. Цвета
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

    	grid.querySelectorAll('.p-item')
      	  .forEach(i => i.classList.remove('active'));
    	item.classList.add('active');
  	  };
	});

	  
	document.querySelectorAll('.style-btn').forEach(btn => {
	  btn.onclick = () => {
		const style = btn.dataset.style;
		toggleButtonStyle(style);
		document
		  .querySelectorAll('.style-btn')
		  .forEach(b =>
			b.classList.toggle(
			  'active',
			  b.dataset.style === style
			)
		  );
	  };
	});

	toggleButtonStyle(localStorage.getItem('buttonStyle') || 'normal');
    
    if(autoBtn) {
        autoBtn.onclick = () => {
            applyPalette(PALETTES[0]); 
            overlay.hidden = true;
        }
    }
  }

  // =================================================================================
  // 3. NAVIGATION
  // =================================================================================
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

  // --- ГАРДЕРОБ ---
  async function renderWardrobe() {
    content.innerHTML = `<div class="loader">Синхронизация...</div>`;
    try {
      const items = await window.apiGet('/api/wardrobe/items');
      if (!items || items.length === 0) {
        content.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px 20px;">
                <h3>Пусто</h3>
                <p>Ваш гардероб пока пуст.</p>
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
      content.innerHTML = `<div class="card" style="color:#ff5e57;">Ошибка: ${e.message}</div>`;
    }
  }

  // --- ДОБАВЛЕНИЕ (ПОЛЯ ПЕРЕМЕЩЕНЫ) ---
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
      // ПОМЕНЯЛИ МЕСТАМИ: Теперь Сначала Название, потом Ссылка (так просил пользователь)
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
      // Ручное: Название, потом Ссылка на фото + Кнопка
      container.innerHTML = `
        <div class="input-wrapper">
            <input type="text" id="manual-name" class="input" placeholder="Название вещи">
        </div>
        
        <div class="input-wrapper file-row">
            <input type="text" id="manual-img-url" class="input" placeholder="Ссылка на картинку (если есть)">
            
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
    content.innerHTML = `
      <div class="card profile-card">
        <div class="profile-name">${user.first_name || "Guest"}</div>
        <div class="profile-id">ID: ${user.id || "Unknown"}</div>
        <div class="stats-row">
           <div class="stat-box">PRO</div>
           <div class="stat-box">V. 2.2</div>
        </div>
      </div>
    `;
  }

  // =================================================================================
  // 4. ACTIONS
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

    if (!name || (!fileInp.files[0] && !urlInp)) return alert("Нужно имя и фото");

    const btn = document.querySelector("#populate-form .btn");
    setBtnLoading(btn, true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      if(fileInp.files[0]) {
          formData.append("file", fileInp.files[0]);
      } else {
          formData.append("image_url", urlInp);
      }
      await window.apiUpload('/api/wardrobe/upload', formData);
      loadSection('wardrobe', document.querySelector('[data-section=wardrobe]'));
    } catch (e) { alert(e.message); setBtnLoading(btn, false); }
  };

  // START
  async function startApp() {
    setupPalette();
    
    navButtons.forEach(btn => {
      btn.onclick = () => loadSection(btn.dataset.section, btn);
    });

    // Инит меню
    const startBtn = document.querySelector('[data-section=wardrobe]');
    // Важно: ждем пока отрендерится
    requestAnimationFrame(() => {
        loadSection('wardrobe', startBtn);
        // Еще раз форсим через 100мс для надежности
        setTimeout(() => moveWave(startBtn), 100);
    });

    if (tg && tg.initData) {
  try {
    const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
    if (res && res.access_token) {
      window.setToken(res.access_token);
      renderWardrobe(); 
    }
  } catch(e) {}
}


  startApp();
})();


