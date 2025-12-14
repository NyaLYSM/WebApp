// js/app.js
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  
  // USER_ID теперь используется только для первичной отправки initData
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0; 

  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  
  // palettes from earlier code — omitted here for brevity; keep same as previously used.
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:$("#121216"), text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Rose Gold", bg:"#160c11", card:"#22161b", text:"#ffffff", accent:"#ff70a6", waveStart:"#ff9a8b", waveEnd:"#ff70a6" }
  ];

  // ---------------------------------------------------------------------------------
  // НОВАЯ ФУНКЦИЯ: Авторизация WebApp
  // ---------------------------------------------------------------------------------
  async function tgLogin() {
    // 1. Проверяем, есть ли уже токен
    if (window.getToken()) {
      console.log("Токен уже есть. Пропускаем логин.");
      return true; 
    }
    
    if (!tg?.initData) {
      console.warn("Нет initData. Запуск вне Telegram - для отладки.");
      // Оставьте это предупреждение, но не добавляйте тестовый токен в прод
      return true; 
    }
    
    console.log("Авторизация через Telegram...");
    try {
      // 2. Отправляем initData на бэкенд
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
      tg?.showAlert("Ошибка: " + e.message);
      tg?.MainButton.hide();
      return false;
    }
  }

  // ---------------------------------------------------------------------------------
  // ... Остальной код `app.js`
  // ---------------------------------------------------------------------------------

  // Helper: Load Section
  function loadSection(section) {
    // ... (unchanged)
  }

  // Page: Wardrobe
  async function wardrobePage() {
    content.innerHTML = '<p class="loading-msg">Загрузка гардероба...</p>';
    try {
      // USER_ID удален, теперь используется JWT
      const data = await apiGet("/api/wardrobe/list"); 
      
      if (data.items.length === 0) {
        content.innerHTML = '<p class="empty-msg">В гардеробе пока пусто. Добавьте первую вещь!</p>';
        return;
      }
      // ... (unchanged rendering logic)
      
    } catch(err) {
      if (err.message.includes("401 Unauthorized")) {
        content.innerHTML = '<p class="error-msg">Сессия истекла. Пожалуйста, перезапустите бота для повторной авторизации.</p>';
        return;
      }
      console.error(err);
      content.innerHTML = '<p class="error-msg">Ошибка загрузки гардероба: ' + (err.message || err) + '</p>';
    }
  }

  // Page: Populate (Form Logic)
  function populatePage() {
    // ... (unchanged form setup)
    
    // 5. Логика отправки
    sendBtn.addEventListener("click", async ()=>{
      const name = nameEl.value.trim();
      const url = urlEl.value.trim();

      if(!name) return alert("Укажите название вещи");

      if(currentFile){
        // ОТПРАВКА ФАЙЛА
        if(currentFile.size > 5*1024*1024) return alert("Файл слишком большой (макс 5 МБ)");
        const fd = new FormData();
        // УДАЛЕНО: fd.append("user_id", USER_ID); 
        fd.append("name", name);
        fd.append("image", currentFile, currentFile.name); // Используйте 'image' для соответствия wardrobe.py
        
        statusEl.textContent = "Загрузка файла...";
        try {
          await apiUpload("/api/wardrobe/upload", fd);
          statusEl.textContent = "Готово — вещь добавлена";
          wardrobePage();
        } catch(err){
          console.error(err);
          statusEl.textContent = "Ошибка: " + (err.message || err);
        }
      } else if (url) {
        // ОТПРАВКА ССЫЛКИ НА ФОТО
        statusEl.textContent = "Проверка и добавление ссылки...";
        try {
          // УДАЛЕНО: user_id: USER_ID
          await apiPost("/api/wardrobe/add", { name, image_url: url }); 
          statusEl.textContent = "Готово — вещь добавлена";
          wardrobePage();
        } catch(err){
          console.error(err);
          statusEl.textContent = "Ошибка: " + (err.message || err);
        }
      } else {
        alert("Выберите файл или вставьте ссылку");
      }
    });

    // ... (unchanged file/url toggles and initial display)
  }

  // ... (looksPage, profilePage - unchanged)

  // Main function
  function main() {
    // ... (unchanged event listeners and initial load)
  }
  
  // ---------------------------------------------------------------------------------
  // ИСПРАВЛЕННАЯ ЛОГИКА ЗАПУСКА
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
