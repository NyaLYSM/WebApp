// js/app.js
(function(){
  const tg = window.Telegram && window.Telegram.WebApp;
  try{ if(tg) tg.expand(); }catch(e){}

  const palettes = [
    { bg:"#111", card:"#1b1b1b", text:"#fff", accent:"#6c5ce7", waveA:"#6dd3ff", waveB:"#7b61ff" },
    { bg:"#1a0f1f", card:"#241327", text:"#fff", accent:"#d13cff", waveA:"#ff7cfa", waveB:"#b43bff" },
    { bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveA:"#5affcc", waveB:"#00a579" },
    { bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveA:"#77a6ff", waveB:"#4d6aff" },
    { bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveA:"#ff8b8b", waveB:"#ff5252" },
    { bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveA:"#6bbcff", waveB:"#0077ff" }
  ];

  function applyPalette(p){
    document.documentElement.style.setProperty("--bg", p.bg);
    document.documentElement.style.setProperty("--card", p.card);
    document.documentElement.style.setProperty("--text", p.text);
    document.documentElement.style.setProperty("--accent", p.accent);
    document.documentElement.style.setProperty("--wave-start", p.waveA);
    document.documentElement.style.setProperty("--wave-end", p.waveB);
    localStorage.setItem("palette", JSON.stringify(p));
    if(window.startWaves) startWaves();
  }

  // init palette and menu
  const pBtn = document.getElementById("palette-btn");
  const pMenu = document.getElementById("palette-menu");
  pBtn.addEventListener("click", ()=>{
    pMenu.classList.toggle("hidden");
    if(!pMenu.classList.contains("hidden")) renderPaletteMenu();
  });

  function renderPaletteMenu(){
    pMenu.innerHTML = "";
    palettes.forEach((p, idx)=>{
      const sw = document.createElement("div"); sw.className="palette-swatch";
      sw.style.background = `linear-gradient(135deg, ${p.waveA}, ${p.waveB})`;
      sw.title = "Палитра " + (idx+1);
      sw.onclick = ()=>{ applyPalette(p); pMenu.classList.add("hidden"); };
      pMenu.appendChild(sw);
    });
  }

  // load saved palette
  const saved = localStorage.getItem("palette");
  if(saved) applyPalette(JSON.parse(saved)); else applyPalette(palettes[0]);

  // nav handlers
  function clearContent(){ document.getElementById("content").innerHTML = ""; }
  document.querySelectorAll(".btn[data-section]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const s = btn.dataset.section;
      if(s === "wardrobe") loadWardrobe();
      if(s === "add") loadAddItem();
      if(s === "looks") loadLooks();
    });
  });

  // import button (already had handler)
  document.getElementById("import-btn").addEventListener("click", async ()=>{
    const url = prompt("Вставьте ссылку на товар (Ozon / Wildberries / Market):");
    if(!url) return;
    try{
      const data = await apiPost("/api/import/fetch", { url });
      if(!data || !data.candidates || data.candidates.length === 0) { alert("Кандидаты не найдены"); return; }
      showCandidates(data.candidates);
    }catch(e){ console.error(e); alert("Ошибка: не удалось получить кандидатов"); }
  });

  // simple page renderers (replace with full features later)
  function loadWardrobe(){
    clearContent();
    const c = document.getElementById("content");
    c.innerHTML = '<div class="section-title">Ваш гардероб</div><div id="wardrobe-list">Загрузка...</div>';
    // fetch wardrobe
    (async()=>{
      try{
        const user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.id : 0;
        const resp = await apiGet("/api/wardrobe/" + user);
        const list = resp.items || [];
        const wrap = document.getElementById("wardrobe-list");
        wrap.innerHTML = "";
        if(list.length===0) { wrap.innerHTML = "<div>Гардероб пуст</div>"; return; }
        list.forEach(it=>{
          const el = document.createElement("div"); el.className="item-card";
          el.innerHTML = `<img src="${it.photo_url}" alt=""><div class="item-meta"><strong>${it.item_name||"Вещь"}</strong><div style="font-size:13px;color:rgba(255,255,255,0.7)">${it.item_type||""}</div></div>`;
          wrap.appendChild(el);
        });
      }catch(e){ console.error(e); document.getElementById("wardrobe-list").innerHTML = "Ошибка загрузки"; }
    })();
  }

  function loadAddItem(){
    clearContent();
    const c = document.getElementById("content");
    c.innerHTML = `<div class="section-title">Добавить вещь</div>
      <input id="fileUrl" class="input" placeholder="Ссылка на изображение (или оставьте пустой для загрузки)">
      <button id="uploadBtn" class="btn">Добавить</button>
      <div id="preview"></div>`;
    document.getElementById("uploadBtn").addEventListener("click", async ()=>{
      const url = document.getElementById("fileUrl").value.trim();
      const user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.id : 0;
      if(url){
        try{
          const res = await apiPost("/api/wardrobe/add_by_link", { user_id: user, url: url });
          if(res && res.item && res.item.image){
            document.getElementById("preview").innerHTML = `<h4>Предпросмотр</h4><img class="preview-img" src="${res.item.image}">`;
          } else alert("Добавлено (нет превью)");
        }catch(e){ console.error(e); alert("Ошибка добавления"); }
      } else {
        alert("Пока что поддерживается только добавление по ссылке");
      }
    });
  }

  function loadLooks(){
    clearContent();
    const c = document.getElementById("content");
    c.innerHTML = `<div class="section-title">Генерация луков</div><div>Эта функция в разработке</div>`;
  }

  // helper to show candidates
  function showCandidates(list){
    clearContent();
    const c = document.getElementById("content");
    c.innerHTML = "<div class='section-title'>Выберите изображение</div><div id='candidates'></div>";
    const wrap = document.getElementById("candidates");
    list.forEach(it=>{
      const img = document.createElement("img"); img.src = it.url; img.className = "candidate-img";
      img.addEventListener("click", async ()=>{
        const name = prompt("Название вещи:");
        if(!name) return;
        try{
          const user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.id : 0;
          const r = await apiPost("/api/import/add", { user_id: user, image_url: it.url, name: name });
          alert("Вещь добавлена");
          loadWardrobe();
        }catch(e){ console.error(e); alert("Ошибка добавления"); }
      });
      wrap.appendChild(img);
    });
  }

  // initial view
  loadWardrobe();

  // expose for debug
  window._app = { loadWardrobe, loadAddItem, loadLooks, applyPalette };
})();
