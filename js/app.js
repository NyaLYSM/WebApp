// js/app.js - ФИНАЛЬНАЯ ЧИСТАЯ ВЕРСИЯ

(function(){
  // 1. Инициализация Telegram
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  // USER_ID используется только для отображения в профиле
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 

  // DOM Элементы
  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  const closeBtn = document.getElementById("palette-close"); 
  const autoBtn = document.getElementById("palette-auto");
  
  // Конфигурация палитр
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Orange", bg:"#1a150f", card:"#241e13", text:"#ffffff", accent:"#ff8c00", waveStart:"#ffb04f", waveEnd:"#ff6f3f" },
    { name:"Green", bg:"#0e1a0f", card:"#122413", text:"#ffffff", accent:"#00d14b", waveStart:"#00ff96", waveEnd:"#00aa60" },
    { name:"Light Mode", bg:"#f0f2f5", card:"#ffffff", text:"#333", accent:"#4285f4", waveStart:"#89caff", waveEnd:"#4285f4" },
  ];

  // =================================================================================
  // 2. ЛОГИКА ПАЛИТРЫ
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
             style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%);" 
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
  // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (ADD / DELETE)
  // =================================================================================

  // Удаление вещи
  async function handleDeleteItem(e) {
      const btn = e.currentTarget;
      const itemId = btn.dataset.itemId;
      
      if(!confirm("Удалить эту вещь?")) return;

      btn.disabled = true;
      btn.textContent = '...';

      try {
          // Вызов API удаления
          await window.apiDelete('/api/wardrobe/delete', { item_id: itemId });
          // Перезагрузка текущей секции
          loadSection('wardrobe'); 
      } catch (error) {
          alert(`Ошибка: ${error.message}`);
          btn.disabled = false;
          btn.textContent = '❌';
      }
  }

  // Добавление вещи (Обработчик формы)
  async function handleAddItem(e) {
      e.preventDefault(); 

      const form = e.currentTarget;
      const formData = new FormData(form);
      const messageBox = document.getElementById('add-item-message');
      const submitBtn = document.getElementById('submit-item-btn');
      
      const name = formData.get('name');
      const url = formData.get('url'); 
      const fileInput = form.querySelector('#item-file');
      const file = fileInput.files[0];
      
      messageBox.className = 'message-box'; 
      messageBox.textContent = 'Обработка...';
      submitBtn.disabled = true;

      if (!name) {
          messageBox.textContent = 'Введите название!';
          messageBox.className = 'message-box error';
          submitBtn.disabled = false;
          return;
      }
      if (!url && !file) {
          messageBox.textContent = 'Укажите URL или выберите файл!';
          messageBox.className = 'message-box error';
          submitBtn.disabled = false;
          return;
      }
      
      try {
          let response;
          
          if (file) {
              // 1. Загрузка файла
              const fileData = new FormData();
              fileData.append('name', name);
              fileData.append('file', file);
              
              messageBox.textContent = 'Загрузка файла...';
              response = await window.apiUpload('/api/wardrobe/add-file', fileData);
              
          } else if (url) {
              // 2. Загрузка по URL (Синхронизировано с wardrobe.py: /add-manual-url)
              messageBox.textContent = 'Загрузка по URL...';
              response = await window.apiPost('/api/wardrobe/add-manual-url', { 
                  name: name, 
                  url: url 
              });
          }
          
          messageBox.textContent = `✅ Успешно!`;
          messageBox.className = 'message-box success';
          
          form.reset();
          
          // Автоматический переход в гардероб через 1 сек
          setTimeout(() => {
              loadSection('wardrobe');
          }, 1000);
          
      } catch (error) {
          console.error("Add error:", error);
          const detail = error.message || "Ошибка сервера";
          messageBox.textContent = `❌ ${detail}`;
          messageBox.className = 'message-box error';
          submitBtn.disabled = false;
      }
  }

  // =================================================================================
  // 4. ГЛАВНАЯ ЛОГИКА НАВИГАЦИИ (loadSection)
  // =================================================================================
  
  async function loadSection(section) {
      // 1. UI: Подсветка кнопок
      menuBtns.forEach(btn => {
          if (btn.dataset.section === section) btn.classList.add('active');
          else btn.classList.remove('active');
      });

      window.history.pushState(null, null, `#${section}`);
      content.innerHTML = '';
      
      // 2. ЛОГИКА СЕКЦИЙ
      
      // --- ГАРДЕРОБ ---
      if (section === 'wardrobe') {
          content.innerHTML = `
              <h2>👗 Мой гардероб</h2>
              <div class="card-list" id="wardrobe-list">
                  <p>Загрузка вещей...</p>
              </div>
          `;
          try {
              // Запрос списка вещей
              const items = await window.apiGet('/api/wardrobe/items');
              const list = document.getElementById('wardrobe-list');
              list.innerHTML = ''; 
              
              if (items && items.length > 0) {
                  items.forEach(item => {
                      list.innerHTML += `
                          <div class="card-item">
                              <img src="${item.image_url}" alt="${item.name}" class="item-img">
                              <div class="item-actions" style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                                <p class="item-name" style="margin:0; font-weight:500;">${item.name}</p>
                                <button class="small-btn delete-btn" data-item-id="${item.id}" style="background:#d32f2f; color:#fff;">🗑</button>
                              </div>
                          </div>
                      `;
                  });

                  // Навешиваем обработчики удаления
                  document.querySelectorAll('.delete-btn').forEach(btn => {
                      btn.addEventListener('click', handleDeleteItem);
                  });
              } else {
                   list.innerHTML = "<p>Гардероб пуст.</p>";
              }

          } catch (e) {
              content.innerHTML = `<h2>Ошибка</h2><p>Не удалось загрузить гардероб: ${e.message}</p>`;
          }
          

      // --- ДОБАВИТЬ ВЕЩЬ ---
      } else if (section === 'populate') {
          content.innerHTML = `
              <h2>➕ Добавить вещь</h2>
              <form id="add-item-form" class="form">
                  <div class="form-group">
                      <label for="item-name">Название:</label>
                      <input type="text" id="item-name" name="name" class="input" placeholder="Например: Синие джинсы" required>
                  </div>
                  <div class="form-group">
                      <label for="item-url">Ссылка (URL):</label>
                      <input type="url" id="item-url" name="url" class="input" placeholder="https://...">
                      <p class="form-hint" style="text-align:center; margin: 5px 0;">ИЛИ</p>
                  </div>
                  <div class="form-group">
                      <label for="item-file">Файл:</label>
                      <input type="file" id="item-file" name="file" accept="image/*" class="input">
                  </div>
                  <button type="submit" class="btn primary-btn" id="submit-item-btn" style="width:100%; margin-top:10px;">Добавить</button>
              </form>
              <div id="add-item-message" class="message-box"></div>
          `;

          const form = document.getElementById('add-item-form');
          if (form) {
              form.addEventListener('submit', handleAddItem); 
          }


      // --- ОБРАЗЫ ---
      } else if (section === 'looks') {
          content.innerHTML = `<h2>✨ Образы</h2><p>Этот раздел в разработке.</p>`;
          
      // --- ПРОФИЛЬ ---
      } else if (section === 'profile') {
          content.innerHTML = `
              <h2>⚙️ Профиль</h2>
              <div class="card-item">
                <p>Ваш ID:</p>
                <h3 style="margin-top:0; color:var(--accent);">${USER_ID}</h3>
              </div>
          `;
          
      } else {
          loadSection('wardrobe');
      }
  }

  // =================================================================================
  // 5. АВТОРИЗАЦИЯ
  // =================================================================================
  async function authenticate() {
      const initData = (tg && tg.initData) || '';
      if (!initData) return false;
      
      try {
          const response = await window.apiPost('/api/auth/tg-login', { initData: initData });
          window.setToken(response.access_token);
          return true;
      } catch (e) {
          console.error("Auth failed:", e);
          return false;
      }
  }

  // Функция запуска приложения
  function main() {
    setupPalette();

    // Навигация по клику меню
    menuBtns.forEach(btn => {
      btn.addEventListener("click", (e) => loadSection(e.currentTarget.dataset.section));
    });

    // Загрузка первой секции
    loadSection('wardrobe');

    if (tg && tg.MainButton.isVisible) tg.MainButton.hide(); 
  }
  
  // =================================================================================
  // 6. СТАРТ
  // =================================================================================
  if (tg && tg.initData && !window.getToken()) {
      // Если есть данные ТГ, но нет токена -> Пробуем войти
      authenticate().then(() => main()).catch(() => main());
  } else {
      // Иначе запускаем сразу (токен уже есть или тестируем в браузере)
      main();
  }

})();
