// js/app.js - ФИНАЛЬНАЯ ВЕРСИЯ (Fix Add Page & Tabs)

(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 
  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");

  // State
  let currentTab = 'marketplace'; // marketplace | manual

  // =================================================================================
  // 1. API ФУНКЦИИ (ADD)
  // =================================================================================

  async function handleAddItem(e) {
      e.preventDefault(); 
      
      const form = e.currentTarget; // Это текущая активная форма
      const type = form.dataset.type; // 'marketplace' или 'manual'
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
              // Логика Маркетплейса
              const url = form.querySelector('[name="url"]').value;
              if (!url) {
                  showError(messageBox, 'Введите ссылку на маркетплейс!');
                  submitBtn.disabled = false;
                  return;
              }
              
              messageBox.textContent = 'Загрузка с маркетплейса...';
              response = await window.apiPost('/api/wardrobe/add-marketplace', { name, url });

          } else {
              // Логика Ручного ввода (URL или Файл)
              const fileInput = document.getElementById('hidden-file-input');
              const urlInput = document.getElementById('manual-source-input');
              
              if (fileInput.files.length > 0) {
                  // Файл
                  const fileData = new FormData();
                  fileData.append('name', name);
                  fileData.append('file', fileInput.files[0]);
                  
                  messageBox.textContent = 'Загрузка файла...';
                  response = await window.apiUpload('/api/wardrobe/add-file', fileData);
              } else if (urlInput.value) {
                  // URL
                  messageBox.textContent = 'Загрузка по ссылке...';
                  response = await window.apiPost('/api/wardrobe/add-manual-url', { 
                      name, 
                      url: urlInput.value 
                  });
              } else {
                  showError(messageBox, 'Выберите фото или вставьте ссылку!');
                  submitBtn.disabled = false;
                  return;
              }
          }
          
          messageBox.textContent = `✅ Вещь добавлена!`;
          messageBox.className = 'message-box success';
          form.reset();
          if(type === 'manual') resetManualInput(); // Сброс кастомного инпута
          
          setTimeout(() => loadSection('wardrobe'), 1000);
          
      } catch (error) {
          console.error("Add error:", error);
          showError(messageBox, error.message || "Ошибка сервера");
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
      urlInput.placeholder = 'Ссылка на фото...';
      fileInput.value = ''; // Сброс файла
      clearBtn.classList.remove('visible');
  }

  // =================================================================================
  // 2. ГЛАВНАЯ ЛОГИКА (loadSection)
  // =================================================================================
  
  async function loadSection(section) {
      menuBtns.forEach(btn => {
          if (btn.dataset.section === section) btn.classList.add('active');
          else btn.classList.remove('active');
      });

      content.innerHTML = '';
      
      // --- ГАРДЕРОБ ---
      if (section === 'wardrobe') {
          content.innerHTML = `
              <h2>👗 Мой гардероб</h2>
              <div class="card-list" id="wardrobe-list"><p>Загрузка...</p></div>
          `;
          try {
              const items = await window.apiGet('/api/wardrobe/items');
              const list = document.getElementById('wardrobe-list');
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
              content.innerHTML = `<h2>Ошибка</h2><p>${e.message}</p>`;
          }

      // --- ДОБАВИТЬ ВЕЩЬ (ИСПРАВЛЕННЫЙ ИНТЕРФЕЙС) ---
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
                      <input type="url" name="url" class="input" placeholder="https://wildberries.ru/..." required>
                  </div>
                  <button type="submit" class="btn primary-btn" style="width:100%; margin-top:15px;">Добавить</button>
              </form>

              <form id="form-manual" class="tab-content ${currentTab === 'manual' ? 'active' : ''}" data-type="manual">
                  <div class="form-group">
                      <label>Название</label>
                      <input type="text" name="name" class="input" placeholder="Например: Любимая футболка" required>
                  </div>
                  
                  <div class="form-group">
                      <label>Ссылка на фото</label>
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

          // --- ЛОГИКА ТАБОВ ---
          document.querySelectorAll('.tab-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                  currentTab = e.target.dataset.tab;
                  loadSection('populate'); // Перерисовываем с новым табом
              });
          });

          // --- ЛОГИКА ФОРМ ---
          const formMarket = document.getElementById('form-marketplace');
          const formManual = document.getElementById('form-manual');
          if(formMarket) formMarket.addEventListener('submit', handleAddItem);
          if(formManual) formManual.addEventListener('submit', handleAddItem);

          // --- ЛОГИКА КОМБО-ИНПУТА (ГАЛЕРЕЯ) ---
          if (currentTab === 'manual') {
              const galleryBtn = document.getElementById('gallery-btn');
              const fileInput = document.getElementById('hidden-file-input');
              const urlInput = document.getElementById('manual-source-input');
              const clearBtn = document.getElementById('clear-manual-btn');

              // 1. Клик по иконке открывает файл
              galleryBtn.addEventListener('click', () => fileInput.click());

              // 2. Файл выбран
              fileInput.addEventListener('change', () => {
                  if (fileInput.files.length > 0) {
                      const fileName = fileInput.files[0].name;
                      urlInput.value = fileName;
                      urlInput.readOnly = true; // Блокируем ручной ввод
                      clearBtn.classList.add('visible'); // Показываем крестик
                  }
              });

              // 3. Ввод текста в URL (показываем крестик если есть текст)
              urlInput.addEventListener('input', () => {
                  if (urlInput.value.length > 0) clearBtn.classList.add('visible');
                  else clearBtn.classList.remove('visible');
              });

              // 4. Нажатие на крестик
              clearBtn.addEventListener('click', () => {
                  resetManualInput();
              });
          }

      // --- ОБРАЗЫ ---
      } else if (section === 'looks') {
          content.innerHTML = `<h2>✨ Образы</h2><p>В разработке.</p>`;
          
      // --- ПРОФИЛЬ ---
      } else if (section === 'profile') {
          content.innerHTML = `<h2>⚙️ Профиль</h2><div class="card-item"><p>ID: ${USER_ID}</p></div>`;
      }
  }

  // Удаление
  async function handleDeleteItem(e) {
      if(!confirm("Удалить?")) return;
      try {
          await window.apiDelete('/api/wardrobe/delete', { item_id: e.currentTarget.dataset.itemId });
          loadSection('wardrobe'); 
      } catch (error) { alert(error.message); }
  }

  // Старт
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
    menuBtns.forEach(btn => btn.addEventListener("click", (e) => loadSection(e.currentTarget.dataset.section)));
    loadSection('wardrobe');
  }
  
  if (tg && tg.initData && !window.getToken()) {
      authenticate().then(main).catch(main);
  } else {
      main();
  }

})();
