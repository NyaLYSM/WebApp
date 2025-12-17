// js/app.js - FIX: Race Conditions & Palette & Cache

(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 
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
      // 1. Фиксируем, куда мы переходим
      activeSection = section;

      // 2. UI: Обновляем меню
      menuBtns.forEach(btn => {
          if (btn.dataset.section === section) btn.classList.add('active');
          else btn.classList.remove('active');
      });

      content.innerHTML = ''; // Очистка старого контента
      
      // --- ГАРДЕРОБ ---
      if (section === 'wardrobe') {
          content.innerHTML = `
              <h2>👗 Мой гардероб</h2>
              <div class="card-list" id="wardrobe-list"><p>Загрузка...</p></div>
          `;
          try {
              const items = await window.apiGet('/api/wardrobe/items');
              
              // 💥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ 💥
              // Если пока мы ждали сервер, пользователь нажал другую кнопку,
              // activeSection изменилась. Мы не должны трогать DOM.
              if (activeSection !== 'wardrobe') {
                  console.log("Пользователь ушел со страницы загрузки, отмена рендера.");
                  return; 
              }

              const list = document.getElementById('wardrobe-list');
              // Проверка на случай если элемент все же исчез
              if (!list) return;

              list.innerHTML = ''; 
              
              if (items && items.length > 0) {
                  items.forEach(item => {
                      list.innerHTML += `
                          <div class="card-item">
                              <img src="${item.image_url}" alt="${item.name}" class="item-img">
                              <div class="item-actions">
                                <p class="item-name">${item.name}</p>
                                <button class="small-btn delete-btn" data-item-id="${item.id}">🗑</button>
                              </div>
                          </div>
                      `;
                  });
                  document.querySelectorAll('.delete-btn').forEach(btn => {
                      btn.addEventListener('click', handleDeleteItem);
                  });
              } else {
                   list.innerHTML = "<p>Гардероб пуст.</p>";
              }
          } catch (e) {
              if (activeSection !== 'wardrobe') return;
              content.innerHTML = `<h2>Ошибка</h2><p>${e.message}</p>`;
          }

      // --- ДОБАВИТЬ ---
      } else if (section === 'populate') {
          content.innerHTML = `
              <h2>➕ Добавить вещь</h2>
              <div class="tabs-header">
                  <button class="tab-btn ${currentTab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">🛍️ Маркетплейс</button>
                  <button class="tab-btn ${currentTab === 'manual' ? 'active' : ''}" data-tab="manual">🖐 Ручное</button>
              </div>

              <form id="form-marketplace" class="tab-content ${currentTab === 'marketplace' ? 'active' : ''}" data-type="marketplace">
                  <div class="form-group">
                      <label>Название</label>
                      <input type="text" name="name" class="input" placeholder="Например: Платье Zara" required>
                  </div>
                  <div class="form-group">
                      <label>Ссылка на товар</label>
                      <input type="url" name="url" class="input" placeholder="https://..." required>
                  </div>
                  <button type="submit" class="btn primary-btn" style="width:100%; margin-top:15px;">Добавить</button>
              </form>

              <form id="form-manual" class="tab-content ${currentTab === 'manual' ? 'active' : ''}" data-type="manual">
                  <div class="form-group">
                      <label>Название</label>
                      <input type="text" name="name" class="input" placeholder="Например: Моя футболка" required>
                  </div>
                  <div class="form-group">
                      <label>Фото (Файл или Ссылка)</label>
                      <div class="input-combo">
                          <button type="button" class="gallery-trigger-btn" id="gallery-btn">🖼️</button>
                          <input type="text" id="manual-source-input" class="input-internal" placeholder="Вставьте ссылку...">
                          <button type="button" class="clear-input-btn" id="clear-manual-btn">✖</button>
                          <input type="file" id="hidden-file-input" accept="image/*" hidden>
                      </div>
                  </div>
                  <button type="submit" class="btn primary-btn" style="width:100%; margin-top:15px;">Добавить</button>
              </form>
              <div id="add-item-message" class="message-box"></div>
          `;

          // Логика табов и инпутов
          document.querySelectorAll('.tab-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  currentTab = e.target.dataset.tab;
                  if (activeSection === 'populate') loadSection('populate');
              });
          });

          const formMarket = document.getElementById('form-marketplace');
          const formManual = document.getElementById('form-manual');
          if(formMarket) formMarket.addEventListener('submit', handleAddItem);
          if(formManual) formManual.addEventListener('submit', handleAddItem);

          if (currentTab === 'manual') {
              const galleryBtn = document.getElementById('gallery-btn');
              const fileInput = document.getElementById('hidden-file-input');
              const urlInput = document.getElementById('manual-source-input');
              const clearBtn = document.getElementById('clear-manual-btn');

              if(galleryBtn) galleryBtn.addEventListener('click', () => fileInput.click());
              if(fileInput) fileInput.addEventListener('change', () => {
                  if (fileInput.files.length > 0) {
                      urlInput.value = fileInput.files[0].name;
                      urlInput.readOnly = true;
                      clearBtn.classList.add('visible');
                  }
              });
              if(urlInput) urlInput.addEventListener('input', () => {
                  if (urlInput.value.length > 0) clearBtn.classList.add('visible');
                  else clearBtn.classList.remove('visible');
              });
              if(clearBtn) clearBtn.addEventListener('click', resetManualInput);
          }

      // --- ОБРАЗЫ ---
      } else if (section === 'looks') {
          content.innerHTML = `<h2>✨ Образы</h2><p>В разработке.</p>`;
          
      // --- ПРОФИЛЬ ---
      } else if (section === 'profile') {
          content.innerHTML = `<h2>⚙️ Профиль</h2><div class="card-item"><p>ID: ${USER_ID}</p></div>`;
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
      const initData = (tg && tg.initData) || '';
      if (!initData) return false;
      try {
          const res = await window.apiPost('/api/auth/tg-login', { initData });
          window.setToken(res.access_token);
          return true;
      } catch (e) { return false; }
  }

  function main() {
    setupPalette(); // Инициализация палитры
    menuBtns.forEach(btn => btn.addEventListener("click", (e) => loadSection(e.currentTarget.dataset.section)));
    loadSection('wardrobe');
  }
  
  // Старт приложения
  if (tg && tg.initData && !window.getToken()) {
      authenticate().then(main).catch(main);
  } else {
      main();
  }

})();
