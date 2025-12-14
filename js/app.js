// js/app.js
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  // USER_ID теперь используется только для первичной отправки initData (но не для API-вызовов)
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 

  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  
  // Palettes (оставлено для полноты)
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Rose Gold", bg:"#160c11", card:"#22161b", text:"#ffffff", accent:"#ff70a6", waveStart:"#ff9a8b", waveEnd:"#ff70a6" }
  ];

  // ---------------------------------------------------------------------------------
  // НОВАЯ ФУНКЦИЯ: Авторизация WebApp
  // ---------------------------------------------------------------------------------
  async function tgLogin() {
    if (window.getToken()) {
      console.log("Токен уже есть. Пропускаем логин.");
      return true; 
    }
    
    if (!tg?.initData) {
      console.warn("Нет initData. Запуск вне Telegram - для отладки. (⚠️ Запустите в Telegram!)");
      // !!! ВАЖНО: УДАЛИТЕ ЭТУ СТРОКУ ПЕРЕД ПРОДАКШЕНОМ:
      // window.setToken("ТЕСТОВЫЙ_ТОКЕН_ДЛЯ_ОТЛАДКИ"); 
      // return true; 
      return false; // Запрещаем запуск без токена
    }
    
    console.log("Авторизация через Telegram...");
    try {
      // 2. Отправляем initData на бэкенд для обмена на JWT
      const data = await apiPost("/api/auth/tg-login", { 
        init_data: tg.initData 
      });
      
      // 3. Сохраняем полученный токен
      window.setToken(data.access_token);
      console.log("Успешный логин! Токен сохранен.");
      return true;

    } catch (e) {
      console.error("Ошибка авторизации Telegram:", e);
      content.innerHTML = `<p class="error-msg">Ошибка авторизации: ${e.message}. Пожалуйста, перезапустите бота.</p>`;
      tg?.MainButton.hide();
      return false;
    }
  }

  // Helper: Load Section
  function loadSection(section) {
    menuBtns.forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`.menu .btn[data-section="${section}"]`);
    activeBtn && activeBtn.classList.add("active");

    switch(section){
      case 'wardrobe':
        wardrobePage();
        break;
      case 'populate':
        populatePage();
        break;
      case 'looks':
        looksPage();
        break;
      case 'profile':
        profilePage();
        break;
      default:
        wardrobePage();
    }
    window.location.hash = section;
  }

  // Helper: Palettes
  function setupPalette(){
    // ... (unchanged palette logic)
    function applyPalette(palette){
      document.documentElement.style.setProperty('--bg', palette.bg);
      document.documentElement.style.setProperty('--card', palette.card);
      document.documentElement.style.setProperty('--text', palette.text);
      document.documentElement.style.setProperty('--accent', palette.accent);
      window.setWaveColors(palette.waveStart, palette.waveEnd);
      localStorage.setItem('palette', JSON.stringify(palette));
    }

    PALETTES.forEach(p => {
      const swatch = document.createElement("button");
      swatch.className = "palette-swatch";
      swatch.style.backgroundColor = p.bg;
      swatch.style.borderColor = p.accent;
      swatch.setAttribute('aria-label', p.name);
      swatch.onclick = () => {
        applyPalette(p);
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
      };
      paletteGrid.appendChild(swatch);
    });

    paletteBtn.onclick = () => {
      overlay.hidden = !overlay.hidden;
      overlay.setAttribute('aria-hidden', overlay.hidden ? 'true' : 'false');
    };
    overlay.onclick = (e) => {
      if(e.target === overlay){
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
      }
    };

    try {
      const savedPalette = JSON.parse(localStorage.getItem('palette'));
      if(savedPalette){
        applyPalette(savedPalette);
      } else {
        applyPalette(PALETTES[0]);
      }
    } catch (e) {
      applyPalette(PALETTES[0]);
    }
  }


  // Page: Wardrobe
  async function wardrobePage() {
    content.innerHTML = '<p class="loading-msg">Загрузка гардероба...</p>';
    try {
      // user_id не передаем, он берется из JWT
      const data = await apiGet("/api/wardrobe/list"); 
      
      if (data.items.length === 0) {
        content.innerHTML = '<p class="empty-msg">В гардеробе пока пусто. Добавьте первую вещь!</p>';
        return;
      }

      // Рендеринг списка
      const listHtml = data.items.map(item => `
        <div class="wardrobe-item">
          <img src="${item.image_url}" alt="${item.name}" loading="lazy" />
          <div class="details">
            <span class="name">${item.name}</span>
            <span class="type">${item.item_type || 'не указан'}</span>
          </div>
          <button class="small-btn delete-btn" data-id="${item.id}" aria-label="Удалить">🗑️</button>
        </div>
      `).join('');
      content.innerHTML = `<div class="wardrobe-list">${listHtml}</div>`;

      // Добавляем обработчики удаления
      content.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
          const itemId = e.currentTarget.dataset.id;
          if (tg) {
            tg.showConfirm(`Вы уверены, что хотите удалить вещь #${itemId}?`, async (ok) => {
              if (ok) {
                try {
                  // user_id не передаем
                  await apiPost("/api/wardrobe/delete", { item_id: itemId });
                  wardrobePage(); // Перезагружаем список
                } catch (err) {
                  tg.showAlert('Ошибка удаления: ' + err.message);
                }
              }
            });
          }
        };
      });

    } catch(err) {
      if (err.message.includes("401 Unauthorized")) {
        content.innerHTML = '<p class="error-msg">Сессия истекла. Пожалуйста, перезапустите бота для повторной авторизации.</p>';
        window.clearToken();
        return;
      }
      console.error(err);
      content.innerHTML = '<p class="error-msg">Ошибка загрузки гардероба: ' + (err.message || err) + '</p>';
    }
  }

  // Page: Populate (Form Logic)
  function populatePage() {
    let currentFile = null;

    // HTML-шаблон для страницы Populate
    content.innerHTML = `
      <form id="populate-form">
        <label for="item-name">Название вещи:</label>
        <input type="text" id="item-name" placeholder="Например, синяя джинсовая куртка">
        
        <label>Добавить фото:</label>
        <div class="radio-toggle">
          <input type="radio" id="upload-file-radio" name="input-mode" value="file" checked>
          <label for="upload-file-radio">Файл</label>
          <input type="radio" id="upload-url-radio" name="input-mode" value="url">
          <label for="upload-url-radio">Ссылка</label>
        </div>
        
        <div id="file-input-group" class="input-group">
          <input type="file" id="item-file" accept="image/*" hidden>
          <input type="text" id="file-name-display" placeholder="Файл не выбран" readonly>
          <button type="button" id="file-trigger-btn" class="file-select-btn" aria-label="Выбрать файл">📁</button>
        </div>
        
        <div id="url-input-group" class="input-group" hidden>
          <input type="url" id="item-url" placeholder="Вставьте прямую ссылку на фото (http://...)">
        </div>

        <p id="status-message" class="status-msg"></p>
        <button type="button" id="send-btn" class="main-btn">Добавить в гардероб</button>
      </form>
    `;

    const form = document.getElementById("populate-form");
    const nameEl = document.getElementById("item-name");
    const fileEl = document.getElementById("item-file");
    const urlEl = document.getElementById("item-url");
    const fileNameDisplay = document.getElementById("file-name-display");
    const fileTriggerBtn = document.getElementById("file-trigger-btn");
    const fileInputGroup = document.getElementById("file-input-group");
    const urlInputGroup = document.getElementById("url-input-group");
    const sendBtn = document.getElementById("send-btn");
    const statusEl = document.getElementById("status-message");
    const radioFile = document.getElementById("upload-file-radio");
    const radioUrl = document.getElementById("upload-url-radio");

    // Обработчики переключения
    radioFile.addEventListener('change', () => {
      if (radioFile.checked) {
        fileInputGroup.hidden = false;
        urlInputGroup.hidden = true;
        urlEl.value = ''; // Очищаем поле URL
      }
    });
    radioUrl.addEventListener('change', () => {
      if (radioUrl.checked) {
        fileInputGroup.hidden = true;
        urlInputGroup.hidden = false;
        fileEl.value = ''; // Очищаем выбранный файл
        fileNameDisplay.value = 'Файл не выбран';
        currentFile = null;
      }
    });

    // Обработчик кнопки выбора файла
    fileTriggerBtn.onclick = () => fileEl.click();
    
    // Обработчик выбора файла
    fileEl.addEventListener("change", (e)=>{
      currentFile = e.target.files[0];
      if(currentFile){
        fileNameDisplay.value = currentFile.name;
        if(currentFile.size > 5*1024*1024) {
          fileNameDisplay.value += " (слишком большой!)";
          fileTriggerBtn.disabled = true;
        } else {
          fileTriggerBtn.disabled = false;
        }
      } else {
        fileNameDisplay.value = "Файл не выбран";
        fileTriggerBtn.disabled = false;
      }
    });

    // 5. Логика отправки
    sendBtn.addEventListener("click", async ()=>{
      const name = nameEl.value.trim();
      const url = urlEl.value.trim();

      if(!name) return alert("Укажите название вещи");
      statusEl.textContent = "";

      if(radioFile.checked && currentFile){
        // ОТПРАВКА ФАЙЛА
        if(currentFile.size > 5*1024*1024) return alert("Файл слишком большой (макс 5 МБ)");
        const fd = new FormData();
        // user_id удален из API-вызовов
        fd.append("name", name);
        fd.append("image", currentFile, currentFile.name); // Используйте 'image' для соответствия wardrobe.py
        
        statusEl.textContent = "Загрузка файла...";
        try {
          await apiUpload("/api/wardrobe/upload", fd);
          statusEl.textContent = "Готово — вещь добавлена";
          // Очистка формы
          nameEl.value = "";
          fileEl.value = "";
          fileNameDisplay.value = "Файл не выбран";
          currentFile = null;
          wardrobePage(); // Переход на страницу гардероба
        } catch(err){
          console.error(err);
          statusEl.textContent = "Ошибка: " + (err.message || err);
        }
      } else if (radioUrl.checked && url) {
        // ОТПРАВКА ССЫЛКИ НА ФОТО
        statusEl.textContent = "Проверка и добавление ссылки...";
        try {
          // user_id удален из API-вызовов
          await apiPost("/api/wardrobe/add", { name, image_url: url }); 
          statusEl.textContent = "Готово — вещь добавлена";
          // Очистка формы
          nameEl.value = "";
          urlEl.value = "";
          wardrobePage(); // Переход на страницу гардероба
        } catch(err){
          console.error(err);
          statusEl.textContent = "Ошибка: " + (err.message || err);
        }
      } else {
        alert("Выберите файл или вставьте ссылку");
      }
    });
  }

  // Page: Looks
  async function looksPage() {
    content.innerHTML = '<p class="loading-msg">Загрузка образов...</p>';
    try {
      // user_id не передаем, он берется из JWT
      const data = await apiGet("/api/looks/"); 
      
      if (data.looks.length === 0) {
        content.innerHTML = '<p class="empty-msg">У вас пока нет сохраненных образов.</p>';
        return;
      }
      
      // Рендеринг списка образов
      const listHtml = data.looks.map(look => `
        <div class="look-item card">
          <h4>${look.look_name || 'Образ без названия'}</h4>
          <img src="${look.image_url}" alt="${look.look_name}" loading="lazy" />
          <p>Повод: ${look.occasion || 'Любой'}</p>
          <p class="description">${look.description || ''}</p>
        </div>
      `).join('');
      content.innerHTML = `<div class="looks-list">${listHtml}</div>`;

    } catch(err) {
      console.error(err);
      content.innerHTML = '<p class="error-msg">Ошибка загрузки образов: ' + (err.message || err) + '</p>';
    }
  }

  // Page: Profile
  async function profilePage() {
    content.innerHTML = '<p class="loading-msg">Загрузка профиля...</p>';
    try {
      // user_id не передаем, он берется из JWT
      const data = await apiGet("/api/profile/"); 
      const user = data.user;
      
      // Форматируем дату подписки
      const subUntil = user.subscription_until 
        ? new Date(user.subscription_until).toLocaleDateString() 
        : 'Нет';

      // Рендеринг профиля
      let html = `
        <div class="profile-card">
          <p><strong>Telegram ID:</strong> ${user.tg_id}</p>
          <p><strong>Username:</strong> ${user.username || 'Не указан'}</p>
          <p><strong>Имя:</strong> ${user.first_name || 'Не указано'}</p>
          <p><strong>Статус подписки:</strong> 
            <span class="${user.subscription_type === 'premium' ? 'premium-status' : 'free-status'}">
              ${user.subscription_type === 'premium' ? 'Премиум ✨' : 'Бесплатный'}
            </span>
          </p>
          <p><strong>Подписка до:</strong> ${subUntil}</p>
          <p><strong>Дата регистрации:</strong> ${new Date(user.registered_at).toLocaleDateString()}</p>
          
          <p class="separator">— — —</p>
          <h3>Последние анализы (5 шт)</h3>
      `;

      if (data.latest_analyses.length === 0) {
        html += '<p>Нет сохраненных анализов.</p>';
      } else {
        const analysesHtml = data.latest_analyses.map(a => `
          <div class="analysis-item">
            <p><strong>Дата:</strong> ${new Date(a.created_at).toLocaleDateString()}</p>
            <p><strong>Photo ID:</strong> ${a.photo_id}</p>
            <details>
              <summary>Показать текст анализа</summary>
              <pre>${a.analysis_text}</pre>
            </details>
          </div>
        `).join('');
        html += `<div class="analyses-list">${analysesHtml}</div>`;
      }
      
      html += '</div>';
      content.innerHTML = html;

    } catch(err) {
      console.error(err);
      content.innerHTML = '<p class="error-msg">Ошибка загрузки профиля: ' + (err.message || err) + '</p>';
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
  // ИСПРАВЛЕННАЯ ЛОГИКА ЗАПУСКА: Сначала авторизация, затем main()
  // ---------------------------------------------------------------------------------
  window.onload = async function() {
    // Сначала проходим авторизацию
    const isLoggedIn = await tgLogin(); 
    if (isLoggedIn) {
      // Если авторизация успешна, запускаем основной код
      main();         
    }
  };

})();
