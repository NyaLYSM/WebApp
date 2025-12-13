// js/app.js
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}
  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0;

  const content = document.getElementById("content");
  const menuBtns = document.querySelectorAll(".menu .btn");
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  
  // palettes from earlier code — omitted here for brevity; keep same as previously used.
  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Midnight", bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveStart:"#7bd3ff", waveEnd:"#6a6bff" },
    { name:"Warm", bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveStart:"#ffb199", waveEnd:"#ff6b6b" },
    { name:"Aurora", bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveStart:"#00f0ff", waveEnd:"#7b61ff" }
  ];

  function applyPalette(p){
    if(!p) return;
    const root = document.documentElement;
    root.style.setProperty("--bg", p.bg);
    root.style.setProperty("--card", p.card);
    root.style.setProperty("--text", p.text);
    root.style.setProperty("--accent", p.accent);
    root.style.setProperty("--wave-start", p.waveStart);
    root.style.setProperty("--wave-end", p.waveEnd);
    try { localStorage.setItem("stylist_palette", JSON.stringify(p)); } catch(e){}
    if(window.updateWavesColors) window.updateWavesColors();
  }
  function loadSavedPalette(){ const raw = localStorage.getItem("stylist_palette"); if(raw) applyPalette(JSON.parse(raw)); else applyPalette(PALETTES[0]); }
  
  // *** ИСПРАВЛЕНО: Генерация элементов палитры с правильными классами ***
  function buildPaletteGrid(){ 
    paletteGrid.innerHTML=""; 
    PALETTES.forEach(p=>{ 
        const el=document.createElement("div"); 
        el.className="palette-swatch"; 
        el.style.background=`linear-gradient(90deg, ${p.waveStart}, ${p.waveEnd})`; 
        el.title = p.name;
        el.onclick=()=>{ 
            applyPalette(p); 
            overlay.hidden=true; 
            overlay.style.display='none'; 
        }; 
        paletteGrid.appendChild(el); 
    }); 
  }
  
  // *** ИСПРАВЛЕНО: Логика инициализации палитры (объединена и очищена) ***
  paletteBtn.addEventListener("click", ()=> { 
    overlay.hidden=false; 
    overlay.style.display='flex'; 
  });

  (function initPalette(){ 
    buildPaletteGrid(); 
    loadSavedPalette(); 
    const close=document.getElementById("palette-close"); 
    const auto=document.getElementById("palette-auto"); 
    
    if(close) close.addEventListener("click", ()=>{ 
        overlay.hidden=true; 
        overlay.style.display='none'; 
    }); 
    if(auto) auto.addEventListener("click", ()=>{ 
        applyPalette(PALETTES[0]); 
        overlay.hidden=true; 
        overlay.style.display='none'; 
    }); 
    overlay.addEventListener("click",(e)=>{ 
        if(e.target===overlay){ 
            overlay.hidden=true; 
            overlay.style.display='none'; 
        } 
    }); 

    // Добавляем инпут для файла в DOM, но скрытым, чтобы управлять им через JS
    const fileEl = document.createElement("input");
    fileEl.type = "file";
    fileEl.accept = "image/*";
    fileEl.id = "hidden-file-input";
    fileEl.style.display = "none";
    document.body.appendChild(fileEl);

  })();

  // routing
  const pages = {
    populate: populatePage,
    wardrobe: wardrobePage,
    looks: looksPage,
    profile: profilePage
  };

  menuBtns.forEach(b => b.addEventListener("click", ()=>{
    const sec = b.dataset.section;
    if(sec && pages[sec]) {
      pages[sec]();
      menuBtns.forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    }
  }));

  // default
  document.querySelector('.btn[data-section="wardrobe"]')?.classList.add("active");
  wardrobePage();

  // ---------- PAGES ----------

  async function wardrobePage(){
    content.innerHTML = `<h2>Ваши вещи</h2><div id="wardrobe-list"><p>Загрузка...</p></div>`;
    const listEl = document.getElementById("wardrobe-list");
    try {
      const data = await apiGet("/api/wardrobe/list", { user_id: USER_ID });
      const items = data?.items || [];
      if(items.length===0){ listEl.innerHTML = `<p>Гардероб пуст — пополните.</p>`; return; }
      listEl.innerHTML = "";
      items.forEach(it=>{
        const el = document.createElement("div"); el.className="item-card";
        const img = it.image_url || it.photo_url || "";
        const name = it.name || it.item_name || "Вещь";
        const type = it.item_type || "";
        el.innerHTML = `
          ${img ? `<img src="${img}" alt="${name}">` : ''}
          <div><strong>${name}</strong></div>
          <div style="color:var(--muted); font-size:13px;">${type}</div>
          <div class="row" style="margin-top:8px;">
            <button class="small-btn delete" data-id="${it.id}">Удалить</button>
          </div>
        `;
        listEl.appendChild(el);
      });

      // attach delete listeners
      document.querySelectorAll(".delete").forEach(btn=>{
        btn.addEventListener("click", (e)=>{
          const id = +btn.dataset.id;
          confirmDelete(id);
        });
      });
    } catch(err){
      console.error(err);
      listEl.innerHTML = `<p>Ошибка: ${err.message || err}</p>`;
    }
  }

  function confirmDelete(itemId){
    content.innerHTML = `
      <div class="confirm-wrap">
        <h3>Вы уверены, что хотите удалить вещь?</h3>
        <div class="confirm-actions">
          <button id="del-yes" class="small-btn delete" style="background:#d32f2f; color:#fff;">Да, удалить</button>
          <button id="del-no" class="btn">Отмена</button>
        </div>
      </div>
    `;
    document.getElementById("del-no").addEventListener("click", wardrobePage);
    document.getElementById("del-yes").addEventListener("click", async ()=>{
      try {
        await fetch((window.BACKEND_URL || "") + `/api/wardrobe/${itemId}?user_id=${USER_ID}`, { method: "DELETE" });
        alert("Удалено");
        wardrobePage();
      } catch(e){
        alert("Ошибка при удалении: " + (e.message || e) + ". Проверьте, что сервер разрешает метод DELETE.");
        wardrobePage();
      }
    });
  }

  function looksPage(){
    content.innerHTML = `<h2>Образы</h2><p>Здесь будет лента вдохновения и генератор образов (пока пусто).</p>`;
  }
  function profilePage(){
    content.innerHTML = `<h2>Профиль</h2><p>ID: ${USER_ID}</p>`;
  }

  // ---------- POPULATE (new combined) ----------
  function populatePage(){
    content.innerHTML = `
      <h2>Пополнить гардероб</h2>
      <div class="row" style="margin-bottom:10px; gap:8px;">
        <button id="tab-url" class="btn" style="flex:1">По ссылке</button>
        <button id="tab-file" class="btn" style="flex:1">Загрузить фото</button>
      </div>
      <div id="populate-body"></div>
    `;
    document.getElementById("tab-url").addEventListener("click", showUrlForm);
    document.getElementById("tab-file").addEventListener("click", showFileForm);
    // *** ИСПРАВЛЕНО: Показываем форму по ссылке по умолчанию, как раньше ***
    showUrlForm(); 
  }

  // URL form (import from product page -> show candidates -> save)
  async function showUrlForm(){
    const b = document.getElementById("populate-body");
    b.innerHTML = `
      <h3>Добавить по ссылке (Маркетплейс)</h3>
      <input id="prod-url" class="input" placeholder="Ссылка на страницу товара (Wildberries, Lamoda...)">
      <button id="find-btn" class="btn" style="margin-top:8px">Найти изображения</button>
      <div id="candidates"></div>
    `;
    document.getElementById("find-btn").addEventListener("click", async ()=>{
      const url = document.getElementById("prod-url").value.trim();
      if(!url) return alert("Вставьте ссылку");
      b.querySelector("#candidates").innerHTML = "<p>Ищу изображения...</p>";
      try {
        const data = await apiPost("/api/import/fetch", { url });
        const list = data.candidates || [];
        if(!list.length) { b.querySelector("#candidates").innerHTML = "<p>Картинки не найдены</p>"; return; }
        const ctn = b.querySelector("#candidates");
        ctn.innerHTML = "<h4>Выберите изображение:</h4>";
        list.forEach(c=>{
          const img = document.createElement("img");
          img.src = c.url;
          img.className = "candidate-img";
          img.onclick = ()=> chooseCandidateToSave(c.url);
          ctn.appendChild(img);
        });
      } catch(err){
        alert("Ошибка при поиске изображений: " + (err.message || err));
        b.querySelector("#candidates").innerHTML = "";
      }
    });
  }

  async function chooseCandidateToSave(url){
    const name = prompt("Название вещи (например: Белая футболка):");
    if(!name) return;
    try {
      await apiPost("/api/wardrobe/add", { user_id: USER_ID, name, image_url: url, item_type: "import" });
      alert("Добавлено");
      wardrobePage();
    } catch(e){
      alert("Ошибка при сохранении: " + (e.message || e));
    }
  }

// File upload form (объединенная: загрузка файла ИЛИ прямая ссылка на фото)
  function showFileForm(){
    const b = document.getElementById("populate-body");
    b.innerHTML = `
      <h3>Загрузить фото / Добавить по URL</h3>

      <input id="upload-name" class="input" placeholder="Название вещи (например: Синяя куртка)">

      <div class="input-group">
        <div class="input-file-wrap">
          <input id="upload-url" class="input" placeholder="ИЛИ прямая ссылка на фото (http://example.com/image.jpg)" style="margin-bottom:0;" />
          <button id="file-clear" class="file-clear-btn" style="display:none;">&times;</button>
        </div>
        <button id="file-trigger" class="file-select-btn" aria-label="Выбрать файл">🖼️</button>
      </div>

      <button id="upload-send" class="btn">Добавить в гардероб</button>
      <div id="upload-status" style="margin-top:8px"></div>
    `;

    // Элементы
    const fileEl = document.getElementById("hidden-file-input"); 
    const nameEl = document.getElementById("upload-name");
    const urlEl = document.getElementById("upload-url");
    const clearBtn = document.getElementById("file-clear");
    const statusEl = document.getElementById("upload-status");
    const sendBtn = document.getElementById("upload-send");
    const triggerBtn = document.getElementById("file-trigger");
    let currentFile = null;

    // Сброс поля выбора файла (на случай, если пользователь переключился с этой вкладки)
    fileEl.value = ""; 

    // --- ЛОГИКА ---

    // 1. Логика выбора файла (при нажатии на кнопку)
    triggerBtn.addEventListener("click", ()=> { fileEl.click(); });
    
    // 2. Логика отображения выбранного файла
    fileEl.addEventListener("change", (e)=>{
      currentFile = e.target.files[0] || null;
      if(currentFile){
        urlEl.value = currentFile.name; // Отображаем имя файла в поле URL
        urlEl.disabled = true;          // Блокируем поле URL
        urlEl.placeholder = currentFile.name; // Для сохранения имени
        clearBtn.style.display = "block";
        sendBtn.disabled = false;
      } else {
        // Если файл отменен, восстанавливаем состояние URL
        urlEl.value = "";
        urlEl.disabled = false;
        urlEl.placeholder = "Прямая ссылка на фото (http://example.com/image.jpg)";
        clearBtn.style.display = "none";
      }
    });

    // 3. Логика очистки выбора файла (крестик)
    clearBtn.addEventListener("click", ()=>{
      currentFile = null;
      fileEl.value = ""; // Сброс input[type=file]
      
      urlEl.value = "";
      urlEl.disabled = false;
      urlEl.placeholder = "Прямая ссылка на фото (http://example.com/image.jpg)";
      clearBtn.style.display = "none";
    });

    // 4. Логика ввода URL (отмена режима выбора файла)
    urlEl.addEventListener("input", ()=>{
      if(urlEl.value.trim()){
        // Если что-то введено в URL, сбрасываем файл
        if(currentFile){
          currentFile = null;
          fileEl.value = "";
          clearBtn.click(); // Используем клик по крестику для сброса состояния
        }
        triggerBtn.disabled = true; // Блокируем кнопку выбора файла
        sendBtn.disabled = false;
      } else {
        triggerBtn.disabled = false;
      }
    });

    // 5. Логика отправки
    sendBtn.addEventListener("click", async ()=>{
      const name = nameEl.value.trim();
      const url = urlEl.value.trim();

      if(!name) return alert("Укажите название вещи");

      if(currentFile){
        // ОТПРАВКА ФАЙЛА
        if(currentFile.size > 5*1024*1024) return alert("Файл слишком большой (макс 5 МБ)");
        const fd = new FormData();
        fd.append("user_id", USER_ID);
        fd.append("name", name);
        fd.append("file", currentFile, currentFile.name);

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
          await apiPost("/api/wardrobe/add", { user_id: USER_ID, name, image_url: url, item_type: "url" });
          statusEl.textContent = "Готово — вещь добавлена";
          wardrobePage();
        } catch(e){
          statusEl.textContent = "Ошибка при сохранении: " + (e.message || e);
        }
      } else {
        return alert("Выберите файл ИЛИ вставьте прямую ссылку на фото.");
      }
    });
  }

})();
