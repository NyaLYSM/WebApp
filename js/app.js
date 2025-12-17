// js/app.js - FIX: Race Conditions & Palette & Cache

(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");

  // --- GLOBAL STATE ---
  let currentTab = 'marketplace'; 
  let activeSection = null; // ВАЖНО: Для отслеживания текущей секции и предотвращения ошибок

  // =================================================================================
  // 1. ПАЛИТРА (ИСПРАВЛЕННАЯ)
  // =================================================================================
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


async function startApp() {
    initNavigation(); // Кнопки теперь работают сразу!

    // Показываем что-то пользователю немедленно
    loadSection('wardrobe'); 

    // В фоновом режиме пытаемся разбудить бэкенд и авторизоваться
    try {
        await window.waitForBackend();
        if (tg && tg.initData && !window.getToken()) {
            const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
            if (res && res.access_token) {
                window.setToken(res.access_token);
                loadSection('wardrobe'); // Перезагружаем уже с данными
            }
        }
    } catch (err) {
        console.warn("Backend startup issue:", err);
    }
  }

  // Запуск при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }

  function initNavigation() {
    menuBtns.forEach(btn => {
      btn.onclick = (e) => {
        const section = e.currentTarget.dataset.section;
        loadSection(section);
      };
    });
    setupPalette();
  }

  function setupPalette() {
      // 1. Генерация сетки цветов
      if (paletteGrid) {
          paletteGrid.innerHTML = PALETTES.map((p, i) => `
            <div class="palette-swatch" 
                 data-index="${i}" 
                 style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%); width: 100%; height: 50px; border-radius: 8px; cursor: pointer; border: 2px solid transparent;" 
                 title="${p.name}">
            </div>
          `).join('');
          
          paletteGrid.addEventListener('click', (e) => {
            const swatch = e.target.closest('.palette-swatch');
            if (swatch) {
              applyPalette(PALETTES[swatch.dataset.index]);
              closePalette();
            }
          });
      }

      // 2. Обработчики событий (с проверками)
      if (paletteBtn) {
          paletteBtn.addEventListener('click', () => {
              console.log("Palette clicked");
              openPalette();
          });
      } else {
          console.error("Кнопка палитры не найдена в HTML!");
      }

      if (closeBtn) closeBtn.addEventListener('click', closePalette);
      if (autoBtn) autoBtn.addEventListener('click', resetPalette);
      
      // Загрузка сохраненной
      const saved = localStorage.getItem('selectedPalette');
      if (saved) try { applyPalette(JSON.parse(saved)); } catch(e){}
  }

  function openPalette() {
    if(overlay) {
        overlay.hidden = false;
        overlay.style.display = 'flex'; // Принудительно ставим flex, если CSS шалит
    }
  }

  function closePalette() {
    if(overlay) {
        overlay.hidden = true;
        overlay.style.display = 'none';
    }
  }

  function applyPalette(p) {
    const root = document.documentElement.style;
    root.setProperty('--bg', p.bg);
    root.setProperty('--card', p.card);
    root.setProperty('--text', p.text);
    root.setProperty('--accent', p.accent);
    root.setProperty('--wave-start', p.waveStart);
    root.setProperty('--wave-end', p.waveEnd);
    localStorage.setItem('selectedPalette', JSON.stringify(p));
    if(window.updateWavesColors) window.updateWavesColors();
  }
  
  function resetPalette() {
    localStorage.removeItem("selectedPalette");
    document.documentElement.style.cssText = ""; 
    if(window.updateWavesColors) window.updateWavesColors();
    closePalette();
  }

  // =================================================================================
  // 2. API ФУНКЦИИ (ADD)
  // =================================================================================

  async function handleAddItem(e) {
      e.preventDefault(); 
      const form = e.currentTarget;
      const type = form.dataset.type;
      const messageBox = document.getElementById('add-item-message');
      const submitBtn = form.querySelector('button[type="submit"]');
      const name = form.querySelector('[name="name"]').value;
      
      messageBox.className = 'message-box'; 
      messageBox.textContent = 'Обработка...';
      submitBtn.disabled = true;

      if (!name) {
          showError(messageBox, 'Введите название вещи!');
          submitBtn.disabled = false;
          return;
      }

      try {
          let response;
          if (type === 'marketplace') {
              const url = form.querySelector('[name="url"]').value;
              if (!url) throw new Error('Введите ссылку!');
              response = await window.apiPost('/api/wardrobe/add-marketplace', { name, url });
          } else {
              const fileInput = document.getElementById('hidden-file-input');
              const urlInput = document.getElementById('manual-source-input');
              
              if (fileInput.files.length > 0) {
                  const fileData = new FormData();
                  fileData.append('name', name);
                  fileData.append('file', fileInput.files[0]);
                  response = await window.apiUpload('/api/wardrobe/add-file', fileData);
              } else if (urlInput.value) {
                  response = await window.apiPost('/api/wardrobe/add-manual-url', { name, url: urlInput.value });
              } else {
                  throw new Error('Выберите фото или ссылку!');
              }
          }
          
          messageBox.textContent = `✅ Добавлено!`;
          messageBox.className = 'message-box success';
          form.reset();
          if(type === 'manual') resetManualInput();
          setTimeout(() => loadSection('wardrobe'), 1000);
          
      } catch (error) {
          console.error("Add error:", error);
          showError(messageBox, error.message || "Ошибка");
          submitBtn.disabled = false;
      }
  }

  function showError(box, msg) {
      box.textContent = msg;
      box.className = 'message-box error';
  }

  function resetManualInput() {
      const urlInput = document.getElementById('manual-source-input');
      const fileInput = document.getElementById('hidden-file-input');
      const clearBtn = document.getElementById('clear-manual-btn');
      urlInput.value = '';
      urlInput.readOnly = false;
      fileInput.value = ''; 
      clearBtn.classList.remove('visible');
  }

  // =================================================================================
  // 3. ГЛАВНАЯ ЛОГИКА (loadSection)
  // =================================================================================
  
async function loadSection(section) {
    console.log("Loading section:", section);
    content.innerHTML = '<div class="loader">Загрузка...</div>';

    if (section === 'wardrobe') {
        try {
            const items = await window.apiGet('/api/wardrobe/items');
            if (!items || items.length === 0) {
                content.innerHTML = '<div class="empty-msg">Гардероб пуст. Добавьте первую вещь!</div>';
            } else {
                content.innerHTML = '<div class="grid" id="wardrobe-grid"></div>';
                const grid = document.getElementById('wardrobe-grid');
                items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'card-item';
                    div.innerHTML = `
                        <img src="${window.BACKEND_URL}${item.image_url}" alt="${item.name}">
                        <p>${item.name}</p>
                    `;
                    grid.appendChild(div);
                });
            }
        } catch (e) {
            content.innerHTML = `<div class="error-msg">Ошибка бэкенда. Убедитесь, что сервер запущен.</div>`;
        }

    } else if (section === 'profile') {
        const displayID = (tg?.initDataUnsafe?.user?.id) || "Локальный пользователь";
        content.innerHTML = `
            <div class="profile-container" style="padding: 20px; text-align: center;">
                <h2 style="margin-bottom: 20px;">⚙️ Профиль</h2>
                <div class="card-item" style="padding: 15px; background: var(--card); border-radius: 12px;">
                    <p style="color: var(--muted); font-size: 0.9rem;">Ваш ID:</p>
                    <b style="font-size: 1.4rem; color: var(--accent);">${displayID}</b>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `<h2>${section}</h2><p>Этот раздел скоро появится.</p>`;
    }
  }

  // --- УТИЛИТЫ ---
  async function handleDeleteItem(e) {
      if(!confirm("Удалить?")) return;
      try {
          await window.apiDelete('/api/wardrobe/delete', { item_id: e.currentTarget.dataset.itemId });
          loadSection('wardrobe'); 
      } catch (error) { alert(error.message); }
  }


  async function authenticate() {
    try {
      const res = await window.apiPost('/api/auth/tg-login', { initData: tg.initData });
      window.setToken(res.access_token);
      return true;
    } catch (e) {
      console.error("Auth failed");
      return false;
    }
  }

  // Запуск
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();  
