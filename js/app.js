// js/app.js
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  // USER_ID теперь используется только для первичной отправки initData
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 

  // Основные переменные
  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  
  const closeBtn = document.getElementById("palette-close"); 
  const autoBtn = document.getElementById("palette-auto");
  
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Orange", bg:"#1a150f", card:"#241e13", text:"#ffffff", accent:"#ff8c00", waveStart:"#ffb04f", waveEnd:"#ff6f3f" },
    { name:"Green", bg:"#0e1a0f", card:"#122413", text:"#ffffff", accent:"#00d14b", waveStart:"#00ff96", waveEnd:"#00aa60" },
    { name:"Light Mode", bg:"#f0f2f5", card:"#ffffff", text:"#333", accent:"#4285f4", waveStart:"#89caff", waveEnd:"#4285f4" },
  ];

  // =================================================================================
  // ЛОГИКА ПАЛИТРЫ
  // =================================================================================

  function openPalette() {
    if(!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closePalette() {
    if(!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true; 
  }

  function applyPalette(palette) {
    const root = document.documentElement.style;
    root.setProperty('--bg', palette.bg);
    root.setProperty('--card', palette.card);
    root.setProperty('--text', palette.text);
    root.setProperty('--accent', palette.accent);
    root.setProperty('--wave-start', palette.waveStart);
    root.setProperty('--wave-end', palette.waveEnd);
    localStorage.setItem('selectedPalette', JSON.stringify(palette));
    
    if(window.updateWavesColors) window.updateWavesColors();
  }
  
  function resetPalette() {
    localStorage.removeItem("selectedPalette");
    document.documentElement.style.cssText = "";
    if(window.updateWavesColors) window.updateWavesColors();
    closePalette();
  }

  function setupPalette() {
    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      try { applyPalette(JSON.parse(saved)); } catch(e) { console.error(e); }
    }

    if (paletteGrid) {
      paletteGrid.innerHTML = PALETTES.map((p, i) => `
        <div class="palette-swatch" 
             data-index="${i}" 
             style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%); cursor: pointer;" 
             title="${p.name}">
        </div>
      `).join('');
    
      paletteGrid.addEventListener('click', (e) => {
        const swatch = e.target.closest('.palette-swatch');
        if (swatch) {
          const idx = swatch.dataset.index;
          applyPalette(PALETTES[idx]);
          closePalette();
        }
      });
    }

    if (paletteBtn) paletteBtn.addEventListener('click', openPalette);
    if (autoBtn) autoBtn.addEventListener('click', resetPalette);
    if (closeBtn) closeBtn.addEventListener('click', closePalette);
    
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePalette();
      });
      closePalette(); 
    }
  }

  // =================================================================================
  // ЛОГИКА НАВИГАЦИИ
  // =================================================================================
  
  function loadSection(sectionName) {
    menuBtns.forEach(btn => btn.classList.remove('active'));

    switch(sectionName) {
      case 'populate':
        populatePage();
        document.querySelector('[data-section="populate"]').classList.add('active');
        break;
      case 'looks':
        looksPage();
        document.querySelector('[data-section="looks"]').classList.add('active');
        break;
      case 'profile':
        profilePage();
        document.querySelector('[data-section="profile"]').classList.add('active');
        break;
      case 'wardrobe':
      default:
        wardrobePage();
        document.querySelector('[data-section="wardrobe"]').classList.add('active');
        break;
    }
    window.location.hash = sectionName;
  }
  
  // =================================================================================
  // ФУНКЦИИ СТРАНИЦ
  // =================================================================================

  function populatePage() {
    let currentFile = null;
    content.innerHTML = `
        <div id="populate-body">
            <h2>Добавить вещь</h2>
            <p>Загрузите фото или укажите ссылку на товар.</p>

            <form id="add-item-form">
                <div class="input-group">
                    <div class="input-file-wrap">
                        <input type="text" id="item-url" class="input" placeholder="URL фото или товара" />
                        <button type="button" class="file-clear-btn" aria-label="Очистить URL" style="display:none">&times;</button>
                    </div>
                    <button type="button" class="file-select-btn" id="file-trigger-btn">
                        <span id="file-icon">🖼️</span>
                    </button>
                </div>
                
                <input type="file" id="item-file" accept="image/*" hidden />
                <input type="text" id="item-name" class="input" placeholder="Название (например: Голубая рубашка)" required />
                
                <button type="submit" id="send-btn" class="btn">Добавить в гардероб</button>
                <p id="status-message" class="muted-text" style="margin-top: 10px; min-height: 1.2em;"></p>
            </form>
        </div>
    `;

    const fileInput = document.getElementById("item-file");
    const fileTriggerBtn = document.getElementById("file-trigger-btn");
    const urlEl = document.getElementById("item-url");
    const clearUrlBtn = document.querySelector(".file-clear-btn");
    const form = document.getElementById("add-item-form");
    const nameEl = document.getElementById("item-name");
    const sendBtn = document.getElementById("send-btn");
    const statusEl = document.getElementById("status-message");

    if(fileTriggerBtn) fileTriggerBtn.addEventListener("click", () => fileInput.click());
    
    if(fileInput) fileInput.addEventListener("change", (e) => {
        if(e.target.files.length > 0) {
            currentFile = e.target.files[0];
            urlEl.value = currentFile.name;
            urlEl.disabled = true;
            clearUrlBtn.style.display = 'block';
        }
    });

    if(clearUrlBtn) clearUrlBtn.addEventListener("click", () => {
        currentFile = null;
        fileInput.value = "";
        urlEl.value = "";
        urlEl.disabled = false;
        clearUrlBtn.style.display = 'none';
        nameEl.value = "";
    });
    
    // TODO: Добавить обработчик submit для отправки формы через apiUpload или apiPost
    if(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            statusEl.innerText = "Отправка...";
            // Здесь будет логика отправки
            setTimeout(() => statusEl.innerText = "Функция в разработке", 500);
        });
    }
  }

  async function wardrobePage() {
    content.innerHTML = '<h2>Ваш гардероб</h2><p>Загрузка...</p>';
    try {
      // Адрес соответствует main.py prefix="/api/wardrobe"
      const res = await window.apiGet('/api/wardrobe/list'); 
      let html = '';
      
      if (res.items && res.items.length > 0) {
        html = '<div class="item-grid">';
        res.items.forEach(item => {
          html += `
            <div class="item-card" data-id="${item.id}">
              <img src="${item.image_url}" alt="${item.name}" loading="lazy" />
              <p>${item.name}</p>
            </div>
          `;
        });
        html += '</div>';
      } else {
        html = '<p class="muted-text">Ваш гардероб пуст. Добавьте первую вещь!</p>';
      }
      content.innerHTML = '<h2>Ваш гардероб</h2>' + html;
    } catch (err) {
      content.innerHTML = `<h2>Гардероб</h2><p class="error-msg">Ошибка загрузки: ${err.message || err}</p>`;
    }
  }

  async function looksPage() {
    content.innerHTML = '<h2>Ваши образы</h2><p>Загрузка...</p>';
    try {
      // Адрес соответствует main.py prefix="/api/looks"
      const res = await window.apiGet('/api/looks/'); 
      let html = '';
      
      if (res.looks && res.looks.length > 0) {
        html = '<div class="looks-list">';
        res.looks.forEach(look => {
          html += `<div class="look-card"><h3>${look.look_name}</h3><p>${look.occasion || 'Нет повода'}</p></div>`;
        });
        html += '</div>';
      } else {
        html = '<p class="muted-text">У вас пока нет сохраненных образов.</p>';
      }
      content.innerHTML = '<h2>Ваши образы</h2>' + html;
    } catch (err) {
      content.innerHTML = `<h2>Образы</h2><p class="error-msg">Ошибка загрузки: ${err.message || err}</p>`;
    }
  }

  async function profilePage() {
    content.innerHTML = '<h2>Профиль</h2><p>Загрузка...</p>';
    try {
      // Адрес соответствует main.py prefix="/api/profile"
      const res = await window.apiGet('/api/profile/'); 
      
      let analysesHtml = '';
      if (res.latest_analyses && res.latest_analyses.length > 0) {
        analysesHtml = '<h3>Последние анализы</h3><ul class="analyses-list">';
        res.latest_analyses.forEach(a => {
            analysesHtml += `<li><details><summary>Анализ от ${new Date(a.timestamp).toLocaleDateString()}</summary><pre>${a.analysis_text}</pre></details></li>`;
        });
        analysesHtml += '</ul>';
      }

      content.innerHTML = `
        <h2>Профиль</h2>
        <p>Ваш Telegram ID: <strong>${res.user.tg_id}</strong></p>
        ${analysesHtml}
      `;
    } catch (err) {
      content.innerHTML = `<h2>Профиль</h2><p class="error-msg">Ошибка загрузки профиля: ${err.message || err}</p>`;
    }
  }
  
  // =================================================================================
  // АВТОРИЗАЦИЯ
  // =================================================================================
  async function authenticate() {
      // 1. Проверяем наличие уже сохраненного токена
      const storedToken = window.getToken(); 
      if (storedToken) {
          return true;
      }
      
      // 2. ЧИТ-КОД ДЛЯ ПК: Если мы не в Телеграм, пропускаем авторизацию
      // Это позволит вам видеть интерфейс на ПК, хотя данные не загрузятся.
      if (!tg || !tg.initData) {
          console.warn("⚠️ Режим ПК: Используем фейковую авторизацию для тестов UI");
          // Возвращаем true, чтобы main() запустился
          return true; 
      }
      
      try {
          // 3. Запрос к серверу
          // ИСПРАВЛЕНО: путь '/api/auth/exchange' соответствует prefix="/api/auth" в main.py
          const res = await window.apiPost('/api/auth/exchange', { init_data: tg.initData });
          const access_token = res.access_token;
          
          window.setToken(access_token); 
          return true;

      } catch (e) {
          console.error("Ошибка авторизации:", e);
          content.innerHTML = `
              <h2>Ошибка авторизации</h2>
              <p>Не удалось авторизоваться через Telegram.</p>
              <p class="error-msg">${e.message || e}</p>
          `;
          return false;
      }
  }


  // Main function
  function main() {
    setupPalette();

    menuBtns.forEach(btn => {
      btn.addEventListener("click", (e) => loadSection(e.currentTarget.dataset.section));
    });

    const initialSection = window.location.hash.substring(1) || 'wardrobe';
    loadSection(initialSection);

    if (tg && tg.MainButton.isVisible) {
      tg.MainButton.hide(); 
    }
  }
  
  // ---------------------------------------------------------------------------------
  // ЗАПУСК
  // ---------------------------------------------------------------------------------
  if (tg && tg.ready) {
    tg.ready();
  }

  setTimeout(() => {
    authenticate().then(isAuthenticated => {
      if (isAuthenticated) {
        main();
      }
    }).catch(console.error);
  }, 0);

})();
