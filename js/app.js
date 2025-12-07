// js/app.js
import { registerUser, getWardrobe, addWardrobeItem } from "./api.js";
import { initThemeUI, applyThemeById, getSavedTheme } from "./theme.js";
import { startWaves } from "./waves.js";

const content = document.getElementById("content");
const menu = document.getElementById("menu");
const topScroll = document.getElementById("topScroll");

let USER_ID = null;

// init theme UI and apply saved theme
initThemeUI();
const saved = getSavedTheme();
if(saved) applyThemeById(saved);

// init waves (also will re-read CSS vars)
startWaves();

// populate top scroll categories
const categories = ["⭐ Избранное","🧥 Верх","👚 Топы","👖 Низ","👟 Обувь","🎒 Аксессуары"];
topScroll.innerHTML = categories.map(c=>`<button class="top-item">${c}</button>`).join("");

// Telegram WebApp init
const tg = window.Telegram?.WebApp;
if(tg){
  try{
    tg.expand();
    const data = tg.initDataUnsafe || {};
    const user = data.user || null;
    if(user && user.id){
      USER_ID = user.id;
      // register on backend (non-blocking)
      registerUser(USER_ID, user.username || null, user.first_name || null).catch(e=>{
        console.warn("registerUser error", e);
      });
    }
  }catch(e){
    console.warn("tg init error", e);
  }
}

// helper
function showError(msg){
  content.innerHTML = `<div class="section-title">Ошибка</div><div class="muted">${msg}</div>`;
}

function renderWardrobe(items){
  if(!items || items.length === 0){
    content.innerHTML = `<h3 class="section-title">👗 Ваши вещи</h3><p class="muted">Пока пусто — добавьте первую вещь.</p>`;
    return;
  }
  const html = items.map(it=>`
    <div class="item-card">
      <img src="${escapeHtml(it.photo_url || '')}" alt="photo" />
      <div class="item-meta">
        <b>${escapeHtml(it.item_name || it.item_type || "Вещь")}</b>
        <small>${escapeHtml(it.item_type || "")}</small>
      </div>
    </div>
  `).join("");
  content.innerHTML = `<h3 class="section-title">👗 Ваши вещи</h3>${html}`;
}

function escapeHtml(str){
  if(!str) return "";
  return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

/* render add form */
function renderAddForm(){
  content.innerHTML = `
    <h3 class="section-title">📸 Добавить вещь</h3>
    <p class="muted">Загрузите фото (файл) или вставьте URL.</p>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <input id="photoUrl" placeholder="https://... (опционально)" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--card-bg);color:var(--text)"/>
      <input id="fileInput" class="file-input" type="file" accept="image/*" style="display:none"/>
      <button id="pickFile" class="card-btn" style="min-width:120px;padding:10px">Выбрать файл</button>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <input id="iname" placeholder="Имя вещи (опционально)" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--card-bg);color:var(--text)"/>
      <input id="itype" placeholder="Тип (рубашка, платье)" style="width:160px;padding:10px;border-radius:10px;border:none;background:var(--card-bg);color:var(--text)"/>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
      <button id="submitAdd" class="card-btn" style="min-width:160px;padding:10px">Добавить</button>
      <div id="addStatus" style="color:var(--muted)"></div>
    </div>
  `;
  const fileInput = document.getElementById("fileInput");
  const pickFile = document.getElementById("pickFile");
  const submit = document.getElementById("submitAdd");

  pickFile.onclick = ()=> fileInput.click();

  fileInput.onchange = async (ev)=>{
    const f = ev.target.files[0];
    if(!f) return;
    document.getElementById("addStatus").textContent = "Конвертация...";
    try{
      const dataUrl = await fileToDataUrl(f);
      document.getElementById("photoUrl").value = dataUrl;
      document.getElementById("addStatus").textContent = "Файл готов";
    }catch(e){
      document.getElementById("addStatus").textContent = "Ошибка конвертации";
      console.error(e);
    }
  };

  submit.onclick = async ()=>{
    const urlVal = document.getElementById("photoUrl").value.trim();
    const name = document.getElementById("iname").value.trim() || "Вещь";
    const type = document.getElementById("itype").value.trim() || "Другое";
    if(!urlVal){
      alert("Пожалуйста, выберите файл или вставьте URL изображения.");
      return;
    }
    if(!USER_ID){
      alert("Откройте мини-приложение через бота, чтобы сохранить вещь в вашем гардеробе.");
      return;
    }
    document.getElementById("addStatus").textContent = "Отправка...";
    try{
      await addWardrobeItem(USER_ID, name, type, urlVal);
      document.getElementById("addStatus").textContent = "Добавлено!";
      // обновим список
      const data = await getWardrobe(USER_ID);
      renderWardrobe(data.items || []);
    }catch(err){
      console.error(err);
      document.getElementById("addStatus").textContent = "Ошибка при отправке";
      alert("Ошибка при добавлении: " + (err.message || err));
    }
  };
}

function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = ()=> reject(new Error("file read error"));
    r.readAsDataURL(file);
  });
}

/* handlers for menu */
menu.querySelectorAll(".card-btn").forEach(btn=>{
  btn.addEventListener("click", async ()=>{
    const section = btn.dataset.section;
    try{
      if(section === "wardrobe"){
        if(!USER_ID) return showError("Откройте мини-приложение через бота.");
        content.innerHTML = `<h3 class="section-title">Загрузка...</h3>`;
        try{
          const data = await getWardrobe(USER_ID);
          renderWardrobe(data.items || []);
        }catch(e){
          console.error(e);
          showError("Не удалось загрузить гардероб: " + e.message);
        }
      } else if(section === "add"){
        renderAddForm();
      } else if(section === "looks"){
        content.innerHTML = `<h3 class="section-title">🎨 Генерация луков</h3><p class="muted">Скоро — AI-генерация образов на основе вашего гардероба.</p>`;
      } else if(section === "profile"){
        // simple profile card (can be enhanced with backend)
        const registered = USER_ID ? `ID: ${USER_ID}` : "Откройте через бота";
        content.innerHTML = `<h3 class="section-title">⚙️ Профиль</h3>
          <p class="muted">${registered}</p>
          <div style="margin-top:10px;display:flex;gap:8px">
            <button id="trialBtn" class="small-btn">Активация пробного</button>
            <button id="upgradeBtn" class="small-btn">Улучшить</button>
          </div>
        `;
        document.getElementById("trialBtn").onclick = ()=> alert("Пробный период можно активировать через бота (реализация в backend).");
        document.getElementById("upgradeBtn").onclick = ()=> alert("Платежи пока не подключены.");
      }
    }catch(e){
      console.error(e);
      showError("Ошибка: " + e.message);
    }
  });
});

// top items (filters) click
topScroll.addEventListener("click", (e)=>{
  const item = e.target.closest(".top-item");
  if(!item) return;
  content.innerHTML = `<h3 class="section-title">${item.textContent}</h3><p class="muted">Фильтр по категории: ${item.textContent.trim()}</p>`;
});

// initial small welcome
(function init(){
  // ensure theme applied to waves
  setTimeout(()=> startWaves(), 150);
})();
