// js/app.js (non-module)
(function(){
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  try { tg && tg.expand && tg.expand(); } catch(e){}

  const USER_ID = (tg?.initDataUnsafe?.user?.id) || 0;

  const content = document.getElementById("content");
  const btns = document.querySelectorAll(".btn[data-section]");
  const importBtn = document.getElementById("import-btn");

  /** Palette overlay elements */
  const paletteBtn = document.getElementById("palette-btn");
  const overlay = document.getElementById("palette-overlay");
  const paletteGrid = document.getElementById("palette-grid");
  const paletteClose = document.getElementById("palette-close");
  const paletteAuto = document.getElementById("palette-auto");

  /** Ensure overlay is always hidden on startup */
  overlay.hidden = true;

  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Midnight", bg:"#1b1e29", card:"#232633", text:"#ffffff", accent:"#4d7cff", waveStart:"#7bd3ff", waveEnd:"#6a6bff" },
    { name:"Warm", bg:"#1d1616", card:"#241b1b", text:"#ffeaea", accent:"#ff6b6b", waveStart:"#ffb199", waveEnd:"#ff6b6b" },
    { name:"Aurora", bg:"#101820", card:"#18222c", text:"#e3eef8", accent:"#00aaff", waveStart:"#00f0ff", waveEnd:"#7b61ff" }
  ];

  function getLuminance(hex){
    hex = hex.replace("#","");
    if(hex.length===3) hex = hex.split("").map(c=>c+c).join("");
    const r = parseInt(hex.substr(0,2),16)/255;
    const g = parseInt(hex.substr(2,2),16)/255;
    const b = parseInt(hex.substr(4,2),16)/255;
    const a = [r,g,b].map(v => v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  }

  function applyPalette(p, persist=true){
    if(!p) return;

    const root = document.documentElement;

    root.style.setProperty("--bg", p.bg);
    root.style.setProperty("--card", p.card);
    root.style.setProperty("--text", p.text);
    root.style.setProperty("--accent", p.accent);
    root.style.setProperty("--wave-start", p.waveStart);
    root.style.setProperty("--wave-end", p.waveEnd);

    const lum = getLuminance(p.bg);
    if(lum > 0.6) root.classList.add("root-light");
    else root.classList.remove("root-light");

    if (persist) localStorage.setItem("stylist_palette", JSON.stringify(p));

    if (window.updateWavesColors) window.updateWavesColors();
  }

  function detectAutoPalette(){
    if (tg?.themeParams?.bg_color) {
      const bg = tg.themeParams.bg_color;
      const lum = getLuminance(bg);
      if(lum > 0.6){
        return { bg:"#ffffff", card:"#fbfbfd", text:"#111", accent:"#4d7cff", waveStart:"#dfe9ff", waveEnd:"#b9befe" };
      }
      return PALETTES[0];
    }
    return PALETTES[0];
  }

  function loadSaved(){
    overlay.hidden = true; // <-- FIX: guarantee hidden

    const raw = localStorage.getItem("stylist_palette");
    if(raw){
      try { applyPalette(JSON.parse(raw), false); return; }
      catch(e){}
    }

    applyPalette(detectAutoPalette(), true);
  }

  function buildPaletteGrid(){
    paletteGrid.innerHTML = "";
    PALETTES.forEach(p=>{
      const el = document.createElement("div");
      el.className = "palette-swatch";
      el.style.background = `linear-gradient(90deg, ${p.waveStart}, ${p.waveEnd})`;
      el.title = p.name;
      el.onclick = ()=>{ applyPalette(p); overlay.hidden = true; };
      paletteGrid.appendChild(el);
    });
  }

  /** PALETTE BUTTON */
  paletteBtn.addEventListener("click", ()=> { overlay.hidden = false; });

  /** CLOSE BUTTON */
  paletteClose.addEventListener("click", ()=> { overlay.hidden = true; });

  /** AUTO button */
  paletteAuto.addEventListener("click", ()=> {
    applyPalette(detectAutoPalette());
    overlay.hidden = true;
  });

  /** Clicking outside closes */
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.hidden = true;
  });

  buildPaletteGrid();
  loadSaved();

  if(window.startWaves) window.startWaves();

  const pages = {
    wardrobe: wardrobePage,
    add: addPage,
    looks: looksPage,
    profile: profilePage
  };

  btns.forEach(b => b.addEventListener("click", ()=> {
    const sec = b.dataset.section;
    if(sec && pages[sec]) pages[sec]();
  }));

  importBtn.addEventListener("click", importByUrl);

  wardrobePage();

  // pages …
  // (дальше твои страницы без изменений)
})();
