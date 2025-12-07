// js/app.js
import { registerUser, getWardrobe, addWardrobeItem } from "./api.js";

const content = document.getElementById("content");
const userBadge = document.getElementById("tg-user");
const menuButtons = document.querySelectorAll(".card-btn");
const topItems = document.querySelectorAll(".top-item");

let USER_ID = null;

// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
if(tg){
  try{
    tg.expand(); // попытка развернуть
    const data = tg.initDataUnsafe || {};
    const user = data.user || null;
    if(user && user.id){
      USER_ID = user.id;
      userBadge.textContent = `ID: ${USER_ID}`;
      userBadge.title = `ID: ${USER_ID}`;
      // регистрируем пользователя на бекенде (не критично)
      registerUser(USER_ID, user.username || null, user.first_name || null).catch(e=>{
        console.warn("registerUser error", e);
      });
    } else {
      userBadge.textContent = "Открой через бота";
    }
  }catch(e){
    console.warn("tg init error", e);
  }
} else {
  userBadge.textContent = "Не в WebApp";
}

/* helper: show error */
function showError(msg){
  content.innerHTML = `<div class="section-title">Ошибка</div><div class="muted">${msg}</div>`;
}

/* render wardrobe list */
function renderWardrobeList(items){
  if(!items || !Array.isArray(items) || items.length === 0){
    content.innerHTML = `<h3 class="section-title">👗 Ваши вещи</h3><p class="muted">Гардероб пока пуст. Нажмите «Добавить» чтобы загрузить фото.</p>`;
    return;
  }

  const html = items.map(it=>`
    <div class="item-card">
      <img src="${escapeHtml(it.photo_url || '')}" alt="photo" onerror="this.style.opacity=.5">
      <div class="item-meta">
        <b>${escapeHtml(it.item_name || it.item_type || "Вещь")}</b>
        <small>${escapeHtml(it.item_type || "")}</small>
      </div>
      <div class="item-actions">
        <button class="card-btn" style="min-width:88px;padding:8px;border-radius:10px" onclick="window.__deleteItem(${it.id})">Удалить</button>
      </div>
    </div>
  `).join("");
  content.innerHTML = `<h3 class="section-title">👗 Ваши вещи</h3>${html}`;
  // register global delete helper
  window.__deleteItem = async (id)=>{
    try{
      const url = (await import("./api.js")).default; // noop to avoid bundling linter - not used
    }catch(e){}
    // сделать DELETE через fetch напрямую
    try{
      const res = await fetch((await import("./api.js")).then(m=>m) /* no-op */);
    }catch(e){}
    // simple: show message (implement deletion endpoint if backend supports)
    alert("Удаление пока не реализовано в UI. Можно добавить при необходимости.");
  };
}

function escapeHtml(str){
  if(!str) return "";
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

/* render add form */
function renderAddForm(){
  content.innerHTML = `
    <h3 class="section-title">📸 Добавить вещь</h3>
    <p class="muted">Загрузите фото или вставьте URL. Изображение будет отправлено в ваш гардероб.</p>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <input id="photoUrl" placeholder="https://... (опционально)" style="flex:1;padding:10px;border-radius:10px;border:none;background:rgba(255,255,255,0.03);color:var(--text)"/>
      <input id="fileInput" class="file-input" type="file" accept="image/*"/>
      <button id="pickFile" class="card-btn" style="min-width:120px;padding:10px">Загрузить файл</button>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <input id="iname" placeholder="Имя вещи (опционально)" style="flex:1;padding:10px;border-radius:10px;border:none;background:rgba(255,255,255,0.03);color:var(--text)"/>
      <input id="itype" placeholder="Тип (рубашка, платье)" style="width:160px;padding:10px;border-radius:10px;border:none;background:rgba(255,255,255,0.03);color:var(--text)"/>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button id="submitAdd" class="card-btn" style="min-width:160px;padding:10px">Добавить вещь</button>
      <div id="addStatus" style="align-self:center;color:var(--muted)"></div>
    </div>
  `;

  const fileInput = document.getElementById("fileInput");
  const pickFile = document.getElementById("pickFile");
  const submit = document.getElementById("submitAdd");

  pickFile.onclick = ()=> fileInput.click();

  fileInput.onchange = async (ev)=>{
    const f = ev.target.files[0];
    if(!f) return;
    document.getElementById("addStatus").textContent = "Конвертация изображения...";
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
      alert("Пожалуйста, откройте мини-приложение через бота (чтобы получить ID).");
      return;
    }
    document.getElementById("addStatus").textContent = "Отправка...";
    try{
      await addWardrobeItem(USER_ID, name, type, urlVal);
      document.getElementById("addStatus").textContent = "Добавлено!";
      // обновим список автоматически
      const data = await getWardrobe(USER_ID);
      renderWardrobeList(data.items || []);
    }catch(err){
      console.error(err);
      document.getElementById("addStatus").textContent = "Ошибка при отправке";
      alert("Ошибка при добавлении: " + (err.message || err));
    }
  };
}

/* helper convert file to dataURL */
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = ()=> reject(new Error("file read error"));
    r.readAsDataURL(file);
  });
}

/* event for menu buttons */
menuButtons.forEach(btn=>{
  btn.addEventListener("click", async ()=>{
    const section = btn.dataset.section;
    try{
      if(section === "wardrobe"){
        if(!USER_ID) return showError("Открой мини-приложение через бота, чтобы получить доступ к гардеробу.");
        content.innerHTML = `<h3 class="section-title">Загрузка...</h3>`;
        try{
          const data = await getWardrobe(USER_ID);
          renderWardrobeList(data.items || []);
        }catch(e){
          console.error(e);
          showError("Не удалось загрузить гардероб: " + e.message);
        }
      } else if(section === "add"){
        renderAddForm();
      } else if(section === "looks"){
        content.innerHTML = `<h3 class="section-title">🎨 Генерация луков</h3><p class="muted">Скоро появится генерация образов по вашим вещам.</p>`;
      } else if(section === "profile"){
        content.innerHTML = `<h3 class="section-title">⚙️ Профиль</h3><p class="muted">ID: ${USER_ID || "неизвестен"}</p>`;
      }
    }catch(e){
      console.error(e);
      showError("Ошибка: " + e.message);
    }
  });
});

/* top scroll buttons quick filter (просто пример) */
document.querySelectorAll(".top-item").forEach(el=>{
  el.addEventListener("click", ()=>{
    // просто подсказываем пользователю, можно подключить фильтр
    const txt = el.textContent.trim();
    content.innerHTML = `<h3 class="section-title">${escapeHtml(txt)}</h3><p class="muted">Фильтр: ${escapeHtml(txt)} (реализация фильтра возможна через API)</p>`;
  });
});

/* initial */
(function init(){
  // show welcome card already present
})();
