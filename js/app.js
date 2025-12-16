// js/app.js
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  // USER_ID теперь используется только для первичной отправки initData
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 

  // Основные переменные, которые используются во всем файле
  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");

  // Критические фиксы: используем правильные ID из index.html
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
    // Гарантируем скрытие элемента (убираем hidden после анимации или сразу)
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
    // Сброс темы (Авто)
    localStorage.removeItem("selectedPalette");
    document.documentElement.style.cssText = ""; // Сброс инлайн-стилей к дефолтам из CSS
    if(window.updateWavesColors) window.updateWavesColors();
    closePalette();
  }

  function setupPalette() {
    // 1. Применяем сохраненную тему при старте
    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      try {
        applyPalette(JSON.parse(saved));
      } catch(e) {
        console.error("Ошибка парсинга сохраненной темы", e);
      }
    }

    // 2. Генерация цветных прямоугольников (градиент)
    if (paletteGrid) {
      paletteGrid.innerHTML = PALETTES.map((p, i) => `
        <div class="palette-swatch" 
             data-index="${i}" 
             style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%); cursor: pointer;" 
             title="${p.name}">
        </div>
      `).join('');
    
      // Обработчик кликов по палитрам
      paletteGrid.addEventListener('click', (e) => {
        const swatch = e.target.closest('.palette-swatch');
        if (swatch) {
          const idx = swatch.dataset.index;
          applyPalette(PALETTES[idx]);
          closePalette();
        }
      });
    }

    // 3. Назначение обработчиков кнопок
    
    // Кнопка открытия 🎨
    if (paletteBtn) {
      paletteBtn.addEventListener('click', openPalette);
    }

    // Кнопка "Авто (по теме)"
    if (autoBtn) {
      autoBtn.addEventListener('click', resetPalette);
    }

    // Кнопка "Закрыть" (ФИКС: Используется ID="palette-close")
    if (closeBtn) {
      closeBtn.addEventListener('click', closePalette);
    } else {
        console.error("Кнопка закрытия palette-close не найдена!");
    }

    // Клик по фону (за границей карточки)
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closePalette();
        }
      });
    }
    
    // Гарантируем, что оверлей скрыт при запуске
    if (overlay) closePalette(); 
  }

  // =================================================================================
  // ЛОГИКА НАВИГАЦИИ
  // =================================================================================
  
// ---------------------------------------------------------------------------------
  // ГЛАВНАЯ ЛОГИКА ЗАГРУЗКИ СЕКЦИЙ (loadSection)
  // ---------------------------------------------------------------------------------
  async function loadSection(section) {
      // Подсвечиваем активную кнопку
      menuBtns.forEach(btn => {
          if (btn.dataset.section === section) {
              btn.classList.add('active');
          } else {
              btn.classList.remove('active');
          }
      });

      // Обновляем URL
      window.history.pushState(null, null, `#${section}`);

      // Очистка контента
      content.innerHTML = '';
      
      // Логика загрузки разделов
      if (section === 'wardrobe') {
          content.innerHTML = `
              <h2>👗 Мой гардероб</h2>
              <div class="card-list" id="wardrobe-list">
                  <p>Загрузка вещей...</p>
              </div>
          `;
          try {
              // Запрос может быть долгим из-за холодного старта Render
              const items = await window.apiGet('/api/wardrobe/items');
              
              const list = document.getElementById('wardrobe-list');
              list.innerHTML = ''; 
              
              if (items && items.length > 0) {
                  items.forEach(item => {
                      list.innerHTML += `
                          <div class="card-item">
                              <img src="${item.image_url}" alt="${item.name}" class="item-img">
                              <p class="item-name">${item.name}</p>
                              <button class="small-btn delete-btn" data-item-id="${item.id}">❌</button>
                          </div>
                      `;
                  });

                  document.querySelectorAll('.delete-btn').forEach(btn => {
                      btn.addEventListener('click', handleDeleteItem);
                  });
              } else {
                   list.innerHTML = "<p>Ваш гардероб пока пуст. Добавьте первую вещь!</p>";
              }

          } catch (e) {
              // Критично: показываем ошибку 404, чтобы пользователь понял, что сломан бэкенд
              content.innerHTML = `<h2>Ошибка загрузки</h2><p>Не удалось загрузить гардероб (Wardrobe): **${e.message || e}**</p>`;
          }
          

      } else if (section === 'populate') {
          // Секция добавления вещей (Восстановлен внешний вид кнопок)
          content.innerHTML = `
              <h2>➕ Добавить вещь</h2>
              <form id="add-item-form" class="form">
                  <div class="form-group">
                      <label for="item-name">Название:</label>
                      <input type="text" id="item-name" name="name" required>
                  </div>
                  <div class="form-group">
                      <label for="item-url">Ссылка на изображение (URL):</label>
                      <input type="url" id="item-url" name="url">
                      <p class="form-hint">Или</p>
                  </div>
                  <div class="form-group">
                      <label for="item-file">Файл изображения:</label>
                      <input type="file" id="item-file" name="file" accept="image/*">
                  </div>
                  <button type="submit" class="btn primary-btn" id="submit-item-btn">Добавить в гардероб</button>
              </form>
              <div id="add-item-message" class="message-box"></div>
          `;

          const form = document.getElementById('add-item-form');
          if (form) {
              form.addEventListener('submit', handleAddItem); 
          }


      } else if (section === 'looks') {
          // Секция образов
          content.innerHTML = `<h2>✨ Создать образ</h2><p>Функционал создания образов в разработке.</p>`;
          
      } else if (section === 'profile') {
          // Секция профиля (Упрощена: только ID)
          content.innerHTML = `<h2>⚙️ Профиль</h2>
              <p>Ваш уникальный ID:</p>
              <p class="profile-id-box"><span class="highlight">${USER_ID}</span></p>
              <p class="form-hint">Используйте этот ID для отладки или поддержки.</p>
          `;
          
          // Кнопка выхода удалена.
          
      } else {
          loadSection('wardrobe');
      }
  }
  
  // =================================================================================
  // ФУНКЦИИ СТРАНИЦ
  // =================================================================================

// Стаб для addItemPage - Страница добавления вещи
async function addItemPage() {
    // currentFile должен быть null при каждом новом вызове
    let currentFile = null; 
    
    content.innerHTML = `
        <h2>Добавить в Гардероб</h2>
        
        <div class="mode-switch">
            <button class="small-btn active" id="mode-marketplace">Маркетплейс</button>
            <button class="small-btn" id="mode-manual">Ручное</button>
        </div>

        <form id="add-item-form">
            <div id="mode-marketplace-content" class="add-content">
                <div class="input-wrap">
                    <input type="text" id="marketplace-name" class="input" placeholder="Название (например, 'Летнее платье')" required>
                </div>
                <div class="input-wrap">
                    <input type="url" id="marketplace-url" class="input" placeholder="Ссылка на товар (URL)" required>
                </div>
                <button type="submit" class="btn primary" data-mode="marketplace">Добавить из Маркетплейса</button>
            </div>

            <div id="mode-manual-content" class="add-content hidden">
                <div class="input-wrap">
                    <input type="text" id="manual-name" class="input" placeholder="Название (например, 'Мои любимые джинсы')" required>
                </div>
                
                <div class="input-group">
                    <div class="input-file-wrap">
                        <input type="url" id="manual-url" class="input file-input-like" placeholder="Ссылка на фото (URL)">
                        <button type="button" class="file-clear-btn hidden" id="file-clear-manual" aria-label="Очистить">&times;</button>
                    </div>
                    <button type="button" class="file-select-btn" id="file-btn-manual">
                        <span id="file-icon">🖼️</span>
                    </button>
                    <input type="file" id="manual-file" accept="image/*" class="hidden"> 
                </div>
                
                <button type="submit" class="btn primary" data-mode="manual">Добавить в Гардероб</button>
            </div>
            
            <p id="status-message" class="muted-text" style="margin-top: 10px; min-height: 1.2em;"></p>
        </form>
    `;

    const statusEl = document.getElementById("status-message");

    // --- Логика переключения вкладок ---
    const marketplaceBtn = document.getElementById('mode-marketplace');
    const manualBtn = document.getElementById('mode-manual');
    const marketplaceContent = document.getElementById('mode-marketplace-content');
    const manualContent = document.getElementById('mode-manual-content');
    const formEl = document.getElementById('add-item-form');
    
    // Элементы ручного ввода
    const manualUrlInput = document.getElementById('manual-url');
    const manualFileInput = document.getElementById('manual-file');
    const fileBtnManual = document.getElementById('file-btn-manual');
    const fileClearManual = document.getElementById('file-clear-manual'); // Получаем элемент

    
    const switchMode = (mode) => {
        if (mode === 'marketplace') {
            marketplaceBtn.classList.add('active');
            manualBtn.classList.remove('active');
            marketplaceContent.classList.remove('hidden');
            manualContent.classList.add('hidden');
        } else {
            manualBtn.classList.add('active');
            marketplaceBtn.classList.remove('active');
            manualContent.classList.remove('hidden');
            marketplaceContent.classList.add('hidden');
        }
        statusEl.textContent = '';
        if (fileClearManual) fileClearManual.click(); // Безопасный сброс
    };
    
    switchMode('marketplace');

    marketplaceBtn.addEventListener('click', () => switchMode('marketplace'));
    manualBtn.addEventListener('click', () => switchMode('manual'));

    // --- Логика загрузки файла и очистки (для Manual Mode) ---
    fileBtnManual.addEventListener('click', () => manualFileInput.click());
    
    manualFileInput.addEventListener('change', (e) => {
        currentFile = e.target.files[0] || null;
        if (currentFile) {
            manualUrlInput.value = currentFile.name;
            manualUrlInput.disabled = true;
            fileClearManual.classList.remove('hidden');
        } else {
            manualUrlInput.disabled = false;
            manualUrlInput.placeholder = "Ссылка на фото (URL)";
            fileClearManual.classList.add('hidden');
        }
    });
    
    fileClearManual.addEventListener('click', () => {
        currentFile = null;
        manualFileInput.value = '';
        manualUrlInput.value = '';
        manualUrlInput.disabled = false;
        manualUrlInput.placeholder = "Ссылка на фото (URL)";
        fileClearManual.classList.add('hidden');
    });

    // --- Логика отправки формы ---
    formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.submitter;
        const mode = submitBtn.dataset.mode;
        
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        statusEl.textContent = 'Обработка запроса...';

        try {
            let name, url;
            let path; 
            
            if (mode === 'marketplace') {
                name = document.getElementById('marketplace-name').value.trim();
                url = document.getElementById('marketplace-url').value.trim();
                path = '/api/wardrobe/add-marketplace'; 
                
                if (!name || !url) throw new Error("Заполните все поля Маркетплейса.");
                
                await window.apiPost(path, { name, url });

            } else { // Manual Mode
                name = document.getElementById('manual-name').value.trim();
                url = document.getElementById('manual-url').value.trim();
                
                if (!name) throw new Error("Заполните название предмета.");
                
                if (currentFile) {
                    // --- Отправка ФАЙЛА (UPLOAD) ---
                    const formData = new FormData();
                    formData.append('name', name);
                    formData.append('image', currentFile);
                    path = '/api/wardrobe/upload';
                    
                    await window.apiUpload(path, formData);
                    
                } else if (url) {
                    // --- Отправка URL (POST) ---
                    path = '/api/wardrobe/add-url'; 
                    
                    await window.apiPost(path, { name, url });

                } else {
                    throw new Error("Добавьте ссылку на фото или загрузите файл.");
                }
            }

            // Успех: переходим в гардероб
            formEl.reset();
            
            // ИСПРАВЛЕНИЕ БАГА: Безопасный сброс полей после успешного запроса
            if (fileClearManual) {
                 fileClearManual.click(); 
            }
            
            statusEl.textContent = `Успешно добавлено! Переход в гардероб...`; 
            
            setTimeout(() => {
                loadSection('wardrobe'); 
            }, 1500);

        } catch (error) {
            statusEl.textContent = `Ошибка: ${error.message || error}`;
            console.error('Add Item Error:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            // Убеждаемся, что поле URL снова активно, если оно было отключено
            if (manualUrlInput) manualUrlInput.disabled = false; 
        }
    });
}

// ---------------------------------------------------------------------------------
  // ОБРАБОТКА ФОРМЫ ДОБАВЛЕНИЯ ВЕЩИ (handleAddItem)
  // ---------------------------------------------------------------------------------
async function handleAddItem(e) {
      e.preventDefault(); 

      const form = e.currentTarget;
      const formData = new FormData(form);
      const messageBox = document.getElementById('add-item-message');
      
      const name = formData.get('name');
      const url = formData.get('url'); 
      const fileInput = form.querySelector('#item-file');
      const file = fileInput.files[0];
      
      messageBox.className = 'message-box'; 
      messageBox.textContent = 'Обработка...';

      if (!name) {
          messageBox.textContent = 'Пожалуйста, введите название вещи.';
          messageBox.className = 'message-box error';
          return;
      }
      if (!url && !file) {
          messageBox.textContent = 'Пожалуйста, введите URL или выберите файл.';
          messageBox.className = 'message-box error';
          return;
      }
      
      try {
          let response;
          
          if (file) {
              const fileData = new FormData();
              fileData.append('name', name);
              fileData.append('file', file);
              
              messageBox.textContent = 'Загрузка файла...';
              response = await window.apiUpload('/api/wardrobe/add-file', fileData);
              
          } else if (url) {
              messageBox.textContent = 'Загрузка по URL...';
              response = await window.apiPost('/api/wardrobe/add-url', { 
                  name: name, 
                  url: url 
              });
              
          } else {
              return;
          }
          
          messageBox.textContent = `✅ Вещь "${response.name}" успешно добавлена!`;
          messageBox.className = 'message-box success';
          
          form.reset();
          
      } catch (error) {
          console.error("Ошибка при добавлении вещи:", error);
          const detail = error.message || "Неизвестная ошибка сервера.";
          messageBox.textContent = `❌ Ошибка: ${detail}`;
          messageBox.className = 'message-box error';
      }
  }

// ---------------------------------------------------------------------------------
  // ГЛАВНАЯ ЛОГИКА ЗАГРУЗКИ СЕКЦИЙ (loadSection)
  // ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
  // ГЛАВНАЯ ЛОГИКА ЗАГРУЗКИ СЕКЦИЙ (loadSection)
  // ---------------------------------------------------------------------------------
  async function loadSection(section) {
      // Подсвечиваем активную кнопку
      menuBtns.forEach(btn => {
          if (btn.dataset.section === section) {
              btn.classList.add('active');
          } else {
              btn.classList.remove('active');
          }
      });

      // Обновляем URL
      window.history.pushState(null, null, `#${section}`);

      // Очистка контента
      content.innerHTML = '';
      
      // Логика загрузки разделов
      if (section === 'wardrobe') {
          content.innerHTML = `
              <h2>👗 Мой гардероб</h2>
              <div class="card-list" id="wardrobe-list">
                  <p>Загрузка вещей...</p>
              </div>
          `;
          try {
              // Долгая загрузка здесь - это, скорее всего, холодный старт Render
              const items = await window.apiGet('/api/wardrobe/items');
              
              const list = document.getElementById('wardrobe-list');
              list.innerHTML = ''; 
              
              if (items && items.length > 0) {
                  items.forEach(item => {
                      list.innerHTML += `
                          <div class="card-item">
                              <img src="${item.image_url}" alt="${item.name}" class="item-img">
                              <p class="item-name">${item.name}</p>
                              <button class="small-btn delete-btn" data-item-id="${item.id}">❌</button>
                          </div>
                      `;
                  });

                  document.querySelectorAll('.delete-btn').forEach(btn => {
                      // Убедитесь, что эта функция (handleDeleteItem) определена выше
                      btn.addEventListener('click', handleDeleteItem);
                  });
              } else {
                   list.innerHTML = "<p>Ваш гардероб пока пуст. Добавьте первую вещь!</p>";
              }

          } catch (e) {
              // Если загрузка не удалась, показываем ошибку
              content.innerHTML = `<h2>Ошибка загрузки</h2><p>Не удалось загрузить гардероб: ${e.message || e}</p>`;
          }
          

      } else if (section === 'populate') {
          // Секция добавления вещей
          content.innerHTML = `
              <h2>➕ Добавить вещь</h2>
              <form id="add-item-form" class="form">
                  <div class="form-group">
                      <label for="item-name">Название:</label>
                      <input type="text" id="item-name" name="name" required>
                  </div>
                  <div class="form-group">
                      <label for="item-url">Ссылка на изображение (URL):</label>
                      <input type="url" id="item-url" name="url">
                      <p class="form-hint">Или</p>
                  </div>
                  <div class="form-group">
                      <label for="item-file">Файл изображения:</label>
                      <input type="file" id="item-file" name="file" accept="image/*">
                  </div>
                  <button type="submit" class="btn primary-btn" id="submit-item-btn">Добавить в гардероб</button>
              </form>
              <div id="add-item-message" class="message-box"></div>
          `;

          const form = document.getElementById('add-item-form');
          if (form) {
              form.addEventListener('submit', handleAddItem); 
          }


      } else if (section === 'looks') {
          // Секция образов
          content.innerHTML = `<h2>✨ Создать образ</h2><p>Функционал создания образов в разработке.</p>`;
          
      } else if (section === 'profile') {
          // Секция профиля (Упрощена и безопасна)
          content.innerHTML = `<h2>⚙️ Профиль</h2>
              <p>Ваши настройки и информация о системе.</p>
              <p>ID пользователя Telegram: ${USER_ID}</p>
              <p class="form-hint">Выход и сброс авторизации доступны через настройки Telegram Web App.</p>
              <button class="btn secondary-btn" id="logout-btn-debug">Сбросить авторизацию (Debug)</button>
          `;
          
          // Оставляем Debug-кнопку для возможности сброса токена, если нужно
          document.getElementById('logout-btn-debug').addEventListener('click', () => {
             if (confirm("Вы уверены, что хотите сбросить токен авторизации? Приложение перезагрузится.")) {
                 window.clearToken();
                 window.location.reload();
             }
          });
          
      } else {
          loadSection('wardrobe');
      }
  }

  // Стаб для wardrobePage - Отображение гардероба
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
              <div class="item-actions">
                  <p>${item.name}</p>
                  <button class="small-btn delete" data-item-id="${item.id}">❌</button>
              </div>
            </div>
          `;
        });
        html += '</div>';
      } else {
        html = '<p class="muted-text">Ваш гардероб пуст. Добавьте первую вещь!</p>';
      }
      content.innerHTML = '<h2>Ваш гардероб</h2>' + html;
      
      // -----------------------------------------------------------------
      // ЛОГИКА: Обработчик удаления
      // -----------------------------------------------------------------
      document.querySelectorAll('.delete').forEach(button => {
        button.addEventListener('click', async (e) => {
          const itemId = e.currentTarget.dataset.itemId;
          
          if (confirm(`Вы уверены, что хотите удалить предмет ID ${itemId}?`)) {
            try {
              e.currentTarget.disabled = true;
              e.currentTarget.textContent = '...';
              
              // Вызываем DELETE API
              // Роут: /api/wardrobe/delete?item_id=X
              await window.apiDelete('/api/wardrobe/delete', { item_id: itemId }); 
              
              alert('Предмет успешно удален!');
              // Перезагружаем страницу, чтобы обновить список
              loadSection('wardrobe');
              
            } catch (error) {
              alert(`Ошибка при удалении: ${error.message || error}`);
              e.currentTarget.disabled = false;
              e.currentTarget.textContent = '❌';
            }
          }
        });
      });
      // -----------------------------------------------------------------
      
    } catch (err) {
      content.innerHTML = `<h2>Гардероб</h2><p class="error-msg">Ошибка загрузки: ${err.message || err}</p>`;
    }
  }

  // Стаб для looksPage - Отображение образов
  async function looksPage() {
    content.innerHTML = '<h2>Ваши образы</h2><p>Загрузка...</p>';
    try {
      // Адрес соответствует main.py prefix="/api/looks"
      const res = await window.apiGet('/api/looks/'); 
      let html = '';
      
      if (res.looks && res.looks.length > 0) {
        html = '<div class="looks-list">';
        res.looks.forEach(look => {
          // упрощенная отрисовка
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

  // Стаб для profilePage - Отображение профиля
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
  // КРИТИЧЕСКИЙ ФИКС: ЛОГИКА АВТОРИЗАЦИИ
  // =================================================================================
async function authenticate() {
      // 1. Получаем initData из Telegram
      const initData = (tg && tg.initData) || '';

      if (!initData) {
          content.innerHTML = "<h2>Ошибка</h2><p>Не удалось получить данные Telegram. Пожалуйста, перезапустите бота.</p>";
          return false;
      }
      
      try {
          // 2. Отправляем данные для валидации на сервер
          const response = await window.apiPost('/api/auth/tg-login', {
              // 💥 ИСПРАВЛЕНИЕ 422: Имя поля должно быть 'initData' (camelCase), 
              // чтобы соответствовать Pydantic-схеме на бэкенде.
              initData: initData 
          });

          // 3. Сохраняем токен и переходим к основной логике
          window.setToken(response.access_token);
          content.innerHTML = "<h2>Авторизация успешна!</h2><p>Загрузка гардероба...</p>";
          return true;

      } catch (e) {
          // Обработка ошибок
          let detail = e.message || e;
          // Если это 404, дадим специальное сообщение
          if (detail.includes("404")) {
              detail = "Проблема с адресом авторизации на сервере. Проверьте путь: /api/auth/tg-login";
          }

          content.innerHTML = `
              <h2>Ошибка авторизации</h2>
              <p>Не удалось авторизоваться через Telegram.</p>
              <p class="error-msg">${detail}</p>
          `;
          return false;
      }
  }


  // Main function
  function main() {
    // 1. Настройка палитры
    setupPalette();

    // 2. Настройка навигации
    menuBtns.forEach(btn => {
      btn.addEventListener("click", (e) => loadSection(e.currentTarget.dataset.section));
    });

    // 3. Загрузка стартового раздела
    const initialSection = window.location.hash.substring(1) || 'wardrobe';
    loadSection(initialSection);

    // 4. Настройка основной кнопки Telegram (если нужно)
    if (tg && tg.MainButton.isVisible) {
      tg.MainButton.hide(); 
    }
  }
  
  // ---------------------------------------------------------------------------------
  // ЛОГИКА ЗАПУСКА
  // ---------------------------------------------------------------------------------
if (tg && tg.initData && !window.getToken()) {
      // Пытаемся авторизоваться, но гарантируем запуск main() в любом случае.
      authenticate()
          .then(success => {
              main();
          })
          .catch(error => {
              console.error("Критическая ошибка при вызове authenticate:", error);
              main(); 
          });
  } else {
      // Иначе (токен есть или нет данных Telegram), запускаем сразу
      main();
  }
})();
