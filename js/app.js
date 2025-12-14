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
  // !!! ИСПРАВЛЕНИЕ: Кнопка закрытия оверлея палитры
  const closeBtn = document.getElementById("palette-close-btn"); 
  
  // Palettes - Восстановлено для работоспособности (отвечает за цветные прямоугольники)
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Light Mode", bg:"#f0f2f5", card:"#ffffff", text:"#333", accent:"#4285f4", waveStart:"#89caff", waveEnd:"#4285f4" },
  ];

  // =================================================================================
  // ЛОГИКА ПАЛИТРЫ
  // =================================================================================

  function setupPalette() {
  console.log("Инициализация палитры...");

  // 1. ЖЕСТКО получаем элементы по правильным ID из HTML
  const overlay = document.getElementById("palette-overlay");
  const grid = document.getElementById("palette-grid");
  const openBtn = document.getElementById("palette-btn"); // Кнопка 🎨 в шапке
  const closeBtn = document.getElementById("palette-close"); // Кнопка Закрыть
  const autoBtn = document.getElementById("palette-auto"); // Кнопка Авто

  // Если оверлея нет, выходим (защита от ошибок)
  if (!overlay) {
    console.error("Ошибка: Не найден palette-overlay в HTML");
    return;
  }

  // --- Локальные функции управления ---
  
  function openOverlay() {
    overlay.hidden = false;
    // Небольшой тайм-аут для работы CSS transition (плавность)
    setTimeout(() => {
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open'); // Добавляем класс для CSS анимаций, если они есть
    }, 10);
  }

  function closeOverlay() {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('open');
    // Ждем окончания анимации (300мс) перед скрытием
    setTimeout(() => {
        overlay.hidden = true;
    }, 300);
  }

  function applyTheme(palette) {
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

  function resetTheme() {
    localStorage.removeItem("selectedPalette");
    document.documentElement.style.cssText = ""; // Сброс инлайн-стилей
    if(window.updateWavesColors) window.updateWavesColors();
    closeOverlay();
  }

  // --- 2. Генерация прямоугольников (СЕТКА) ---
  if (grid) {
    grid.innerHTML = PALETTES.map((p, i) => `
      <div class="palette-swatch" 
           data-index="${i}" 
           style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%); cursor: pointer;" 
           title="${p.name}">
      </div>
    `).join('');

    // Делегирование клика по сетке (выбор цвета)
    grid.onclick = (e) => {
      const swatch = e.target.closest('.palette-swatch');
      if (swatch) {
        const idx = swatch.dataset.index;
        applyTheme(PALETTES[idx]);
        closeOverlay();
      }
    };
  }

  // --- 3. Навешивание событий (КНОПКИ) ---

  // Кнопка открытия 🎨
  if (openBtn) {
    openBtn.onclick = (e) => {
        e.preventDefault();
        openOverlay();
    };
  } else {
    console.warn("Кнопка открытия palette-btn не найдена");
  }

  // Кнопка Закрыть
  if (closeBtn) {
    closeBtn.onclick = (e) => {
        e.preventDefault(); // Важно предотвратить стандартное поведение
        closeOverlay();
    };
  } else {
    console.error("Кнопка закрытия palette-close не найдена (проверьте ID в HTML)");
  }

  // Кнопка Авто
  if (autoBtn) {
    autoBtn.onclick = (e) => {
        e.preventDefault();
        resetTheme();
    };
  }

  // Клик по фону (за границей карточки)
  overlay.onclick = (e) => {
    // Если кликнули прямо по оверлею (а не по карточке внутри)
    if (e.target === overlay) {
      closeOverlay();
    }
  };

  // --- 4. Применение сохраненной темы при старте ---
  const saved = localStorage.getItem('selectedPalette');
  if (saved) {
    try {
      applyTheme(JSON.parse(saved));
    } catch(e) { console.error(e); }
  }
}

  // =================================================================================
  // ДАЛЕЕ ДРУГИЕ РАЗДЕЛЫ И ОСНОВНАЯ ЛОГИКА
  // =================================================================================

  function populatePage() {
    let currentFile = null;
    content.innerHTML = `
      <h2>➕ Добавить вещь</h2>
      <p class="error-msg" id="populate-status"></p>
      <form id="populate-form">
        <div class="input-group">
            <input type="text" id="item-name" placeholder="Название (например, 'Синяя джинсовая куртка')" required>
        </div>
        
        <div class="input-group">
            <div class="input-file-wrap">
                <input type="file" id="item-file" accept="image/jpeg,image/png,image/webp" style="display: none;">
                <label for="item-file" class="file-label" id="file-label">Выберите фото или вставьте URL</label>
            </div>
            <button type="button" class="file-select-btn" id="file-trigger-btn" aria-label="Выбрать файл">📁</button>
        </div>
        
        <div class="input-group">
            <input type="url" id="item-url" placeholder="... или вставьте URL фото (если нет файла)">
        </div>

        <button type="submit" class="btn primary-btn" id="send-btn" disabled>Добавить в гардероб</button>
      </form>
    `;

    const nameEl = document.getElementById("item-name");
    const fileEl = document.getElementById("item-file");
    const urlEl = document.getElementById("item-url");
    const sendBtn = document.getElementById("send-btn");
    const fileTriggerBtn = document.getElementById("file-trigger-btn");
    const fileLabel = document.getElementById("file-label");
    const statusEl = document.getElementById("populate-status");
    const formEl = document.getElementById("populate-form");

    // Обработка выбора файла
    fileTriggerBtn.addEventListener("click", () => {
      if (fileEl.files.length === 0 && !urlEl.value.trim()) {
          fileEl.click();
      } else {
          // Сброс всего
          fileEl.value = null;
          urlEl.value = "";
          currentFile = null;
          fileLabel.textContent = "Выберите фото или вставьте URL";
          sendBtn.disabled = true;
          statusEl.textContent = "";
      }
    });

    fileEl.addEventListener("change", () => {
        const file = fileEl.files[0];
        if (file) {
            currentFile = file;
            urlEl.value = "";
            fileLabel.textContent = `Выбран файл: ${file.name}`;
            sendBtn.disabled = false;
        }
    });

    urlEl.addEventListener("input", () => {
      if (urlEl.value.trim()) {
          currentFile = null;
          fileEl.value = null;
          fileLabel.textContent = "Введен URL";
          sendBtn.disabled = false;
      } else if (!currentFile) {
          fileLabel.textContent = "Выберите фото или вставьте URL";
          sendBtn.disabled = true;
      }
    });


    // 5. Логика отправки
    formEl.addEventListener("submit", async (e)=>{
      e.preventDefault();
      
      const name = nameEl.value.trim();
      const url = urlEl.value.trim();

      if(!name) return alert("Укажите название вещи");

      sendBtn.disabled = true;

      if(currentFile){
        // ОТПРАВКА ФАЙЛА
        if(currentFile.size > 5*1024*1024) {
             alert("Файл слишком большой (макс 5 МБ)");
             sendBtn.disabled = false;
             return;
        }
        const fd = new FormData();
        // На бэкенде в FastAPI используется Form(name="name") и File(name="image")
        fd.append("name", name);
        fd.append("image", currentFile, currentFile.name); 

        statusEl.textContent = "Загрузка файла...";
        try {
          // apiUpload из api.js (для multipart/form-data)
          await apiUpload("/api/wardrobe/upload", fd); 
          statusEl.textContent = "✅ Готово — вещь добавлена";
          // Переключаемся на гардероб
          setTimeout(wardrobePage, 1000); 
        } catch(err){
          console.error(err);
          statusEl.textContent = "❌ Ошибка: " + (err.message || err);
          sendBtn.disabled = false;
        }
      } else if (url) {
        // ОТПРАВКА ССЫЛКИ НА ФОТО
        statusEl.textContent = "Проверка и добавление ссылки...";
        try {
          await apiPost("/api/wardrobe/add-url", { name, image_url: url }); 
          statusEl.textContent = "✅ Готово — вещь добавлена";
          setTimeout(wardrobePage, 1000);
        } catch(err){
          console.error(err);
          statusEl.textContent = "❌ Ошибка: " + (err.message || err);
          sendBtn.disabled = false;
        }
      } else {
        alert("Выберите файл или вставьте URL");
        sendBtn.disabled = false;
      }
      
    });
  }

  async function wardrobePage() {
    content.innerHTML = '<h2>👗 Гардероб</h2><p class="loading-msg">Загрузка вещей...</p>';
    try {
      const data = await apiGet("/api/wardrobe/list");
      const items = data.items || [];

      let html = `
        <h2>👗 Гардероб (${items.length} ${items.length === 1 ? 'вещь' : items.length <= 4 ? 'вещи' : 'вещей'})</h2>
        <div class="wardrobe-grid">
      `;
      
      items.forEach(item => {
        html += `
          <div class="wardrobe-item" data-id="${item.id}">
            <img src="${item.image_url}" alt="${item.name}" loading="lazy">
            <p>${item.name}</p>
            <button class="delete-btn" data-id="${item.id}">❌</button>
          </div>
        `;
      });
      
      html += '</div>';
      content.innerHTML = html;

      // Добавляем обработчики удаления
      document.querySelectorAll(".wardrobe-item .delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const itemId = e.currentTarget.dataset.id;
          if (confirm("Вы уверены, что хотите удалить эту вещь?")) {
            const itemDiv = e.currentTarget.closest(".wardrobe-item");
            itemDiv.style.opacity = '0.5';
            try {
              await apiDelete(`/api/wardrobe/delete?item_id=${itemId}`);
              itemDiv.remove();
              wardrobePage(); // Перезагрузить список для обновления счетчика
            } catch(err) {
              console.error(err);
              alert("Ошибка удаления: " + (err.message || err));
              itemDiv.style.opacity = '1';
            }
          }
        });
      });


    } catch(err) {
      console.error(err);
      content.innerHTML = '<p class="error-msg">Ошибка загрузки гардероба: ' + (err.message || err) + '</p>';
    }
  }

  async function looksPage() {
    content.innerHTML = '<h2>✨ Образы</h2><p class="loading-msg">Загрузка образов...</p>';
    try {
      const data = await apiGet("/api/looks/"); 
      const looks = data.looks || [];

      let html = `
        <h2>✨ Образы (${looks.length} ${looks.length === 1 ? 'образ' : looks.length <= 4 ? 'образа' : 'образов'})</h2>
        <div class="looks-list">
      `;

      looks.forEach(look => {
        html += `
          <div class="look-card" data-id="${look.id}">
            <h3>${look.look_name || 'Без названия'}</h3>
            ${look.image_url ? `<img src="${look.image_url}" alt="${look.look_name}" loading="lazy">` : ''}
            <p><strong>Повод:</strong> ${look.occasion || 'Не указан'}</p>
            <p>${look.description || ''}</p>
          </div>
        `;
      });
      
      html += '</div>';
      content.innerHTML = html;

    } catch(err) {
      console.error(err);
      content.innerHTML = '<p class="error-msg">Ошибка загрузки образов: ' + (err.message || err) + '</p>';
    }
  }

  async function profilePage() {
    content.innerHTML = '<h2>⚙️ Профиль</h2><p class="loading-msg">Загрузка данных...</p>';
    try {
      const data = await apiGet("/api/profile/");
      const user = data.user || {};
      const analyses = data.latest_analyses || [];
      
      const subStatus = user.subscription_type === 'free' 
          ? 'Бесплатный' 
          : user.subscription_type === 'trial' 
              ? `Пробный (до ${new Date(user.subscription_until).toLocaleDateString('ru-RU')})`
              : `Премиум (до ${new Date(user.subscription_until).toLocaleDateString('ru-RU')})`;
      
      // Здесь нужно обновить счетчик анализов в зависимости от наличия подписки,
      // но для простоты возьмем данные как есть из бэкенда.
      const analysesInfo = user.subscription_type === 'free'
        ? `<p><strong>Анализов сегодня:</strong> ${user.free_analyses_today}/${user.free_analyses_per_day}</p>`
        : '<p><strong>Анализов:</strong> Безлимитно</p>';

      let html = `
        <div class="profile-info">
          <h3>Ваш профиль</h3>
          <p><strong>Telegram ID:</strong> ${user.tg_id}</p>
          <p><strong>Имя пользователя:</strong> ${user.username || 'Не указано'}</p>
          <p><strong>Статус подписки:</strong> ${subStatus}</p>
          ${analysesInfo}
          <hr>
          
          <h3>История последних анализов</h3>
      `;
      
      if (analyses.length === 0) {
        html += '<p>Пока нет сохраненных анализов.</p>';
      } else {
        const analysesHtml = analyses.map(a => `
          <div class="analysis-item">
            <p class="date">${new Date(a.created_at).toLocaleDateString('ru-RU')} ${new Date(a.created_at).toLocaleTimeString('ru-RU')}</p>
            <details>
              <summary>Посмотреть текст анализа</summary>
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


  // --- Логика переключения разделов ---

  function loadSection(sectionName) {
    // Сброс активного класса
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
    // Обновляем URL для навигации
    window.location.hash = sectionName;
  }

  // --- ЛОГИКА АВТОРИЗАЦИИ ---
  let auth_token = localStorage.getItem('auth_token');

  async function authenticate() {
      if (auth_token) {
          // Если токен есть, мы полагаемся на логику в api.js, 
          // которая добавляет токен в заголовки.
          return true;
      }
      
      if (!tg || !tg.initData) {
          console.warn("Telegram WebApp не инициализирован. Используется режим заглушки.");
          // Для локальной разработки, где нет Telegram
          // Устанавливаем токен-заглушку, чтобы main() запустилась
          localStorage.setItem('auth_token', 'local_dev_token');
          // В реальном проекте здесь нужно настроить заглушки для API
          return true;
      }

      // 1. Показываем загрузку
      content.innerHTML = '<h2>Авторизация</h2><p>Пожалуйста, подождите, идет авторизация через Telegram...</p>';

      // 2. Отправляем initData на бэкенд
      try {
          const res = await fetch(window.BACKEND_URL + "/api/auth/tg-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ init_data: tg.initData })
          });

          if (!res.ok) {
              const errorText = await res.text();
              throw new Error("Ошибка бэкенда: " + res.status + " - " + errorText);
          }

          const data = await res.json();
          auth_token = data.access_token;
          localStorage.setItem('auth_token', auth_token);
          
          // Обновляем window.api.js для использования токена в будущих запросах
          window.setAuthToken && window.setAuthToken(auth_token); 
          
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
  // ЛОГИКА ЗАПУСКА: Сначала авторизация, затем main()
  // ---------------------------------------------------------------------------------
  authenticate().then(isAuthenticated => {
      if(isAuthenticated) {
          main();
      }
  });

})();
