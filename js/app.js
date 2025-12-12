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
  const paletteClose = document.getElementById("palette-close");
  const paletteAuto = document.getElementById("palette-auto");

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
  function buildPaletteGrid(){ paletteGrid.innerHTML=""; PALETTES.forEach(p=>{ const el=document.createElement("div"); el.className="palette-swatch"; el.style.background=`linear-gradient(90deg, ${p.waveStart}, ${p.waveEnd})`; el.onclick=()=>{ applyPalette(p); overlay.hidden=true; overlay.style.display='none'; }; paletteGrid.appendChild(el); }); }

  paletteBtn.addEventListener("click", ()=> { overlay.hidden=false; overlay.style.display='flex'; });
  (function initPalette(){ buildPaletteGrid(); loadSavedPalette(); const close=document.getElementById("palette-close"); if(close) close.addEventListener("click", ()=>{ overlay.hidden=true; overlay.style.display='none'; }); const auto=document.getElementById("palette-auto"); if(auto) auto.addEventListener("click", ()=>{ applyPalette(PALETTES[0]); overlay.hidden=true; overlay.style.display='none'; }); overlay.addEventListener("click",(e)=>{ if(e.target===overlay){ overlay.hidden=true; overlay.style.display='none'; } }); })();

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
          <button id="del-yes" class="small-btn">Да, удалить</button>
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
        alert("Ошибка при удалении");
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
    showUrlForm();
  }

  // URL form (import from product page -> show candidates -> save)
  async function showUrlForm(){
    const b = document.getElementById("populate-body");
    b.innerHTML = `
      <h3>Добавить по ссылке</h3>
      <input id="prod-url" class="input" placeholder="Ссылка на страницу товара (например wildberries)">
      <button id="find-btn" class="btn" style="margin-top:8px">Добавить</button>
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

  // File upload form
  function showFileForm(){
    const b = document.getElementById("populate-body");
    b.innerHTML = `
      <h3>Загрузить фото</h3>
      <input id="upload-name" class="input" placeholder="Название вещи (например: Синяя куртка)">
      <div style="display:flex; gap:8px; align-items:center;">
        <input id="upload-file" type="file" accept="image/*" style="flex:1" />
        <button id="upload-send" class="btn">Загрузить</button>
      </div>
      <div id="upload-status" style="margin-top:8px"></div>
    `;

    document.getElementById("upload-send").addEventListener("click", async ()=>{
      const name = document.getElementById("upload-name").value.trim();
      const fileEl = document.getElementById("upload-file");
      if(!name) return alert("Укажите название вещи");
      if(!fileEl.files || !fileEl.files[0]) return alert("Выберите файл");
      const file = fileEl.files[0];
      if(file.size > 5*1024*1024) return alert("Файл слишком большой (макс 5 МБ)");
      const fd = new FormData();
      fd.append("user_id", USER_ID);
      fd.append("name", name);
      fd.append("file", file, file.name);

      const status = document.getElementById("upload-status");
      status.textContent = "Загрузка...";
      try {
        await apiUpload("/api/wardrobe/upload", fd);
        status.textContent = "Готово — вещь добавлена";
        wardrobePage();
      } catch(err){
        console.error(err);
        status.textContent = "Ошибка: " + (err.message || err);
      }
    });
  }

})();
