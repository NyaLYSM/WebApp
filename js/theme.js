// js/theme.js
const THEMES = [
  {
    id: "auto",
    name: "Авто (Telegram)",
    palette: null, // handled by auto
    preview: "linear-gradient(90deg,#6dd3ff,#7b61ff)"
  },
  {
    id: "cosmic",
    name: "Cosmic Dark",
    palette: {
      bg1: "#061021",
      bg2: "#0f1630",
      waveStart: "#5ee7df",
      waveEnd: "#7b61ff",
      text: "#eef6ff"
    },
    preview: "linear-gradient(90deg,#5ee7df,#7b61ff)"
  },
  {
    id: "neon",
    name: "Neon Violet",
    palette: {
      bg1:"#08020b",
      bg2:"#1a042b",
      waveStart:"#ff66d9",
      waveEnd:"#7b61ff",
      text:"#fff2ff"
    },
    preview: "linear-gradient(90deg,#ff66d9,#7b61ff)"
  },
  {
    id: "pastel",
    name: "Pastel Light",
    palette: {
      bg1:"#f6f7fb",
      bg2:"#eef3fb",
      waveStart:"#a8e6ff",
      waveEnd:"#ffd6e0",
      text:"#0b1b2b"
    },
    preview: "linear-gradient(90deg,#a8e6ff,#ffd6e0)"
  },
  {
    id: "navy",
    name: "Elegant Navy",
    palette: {
      bg1:"#071428",
      bg2:"#0b2540",
      waveStart:"#60a5fa",
      waveEnd:"#7c3aed",
      text:"#eef6ff"
    },
    preview: "linear-gradient(90deg,#60a5fa,#7c3aed)"
  },
  {
    id: "rose",
    name: "Rose Gold",
    palette: {
      bg1:"#1a0f12",
      bg2:"#2b1418",
      waveStart:"#ffd1c4",
      waveEnd:"#ff8ba7",
      text:"#fff6f6"
    },
    preview: "linear-gradient(90deg,#ffd1c4,#ff8ba7)"
  }
];

const STORAGE_KEY = "stylist_theme_v1";

export function getSavedTheme(){
  try{
    return localStorage.getItem(STORAGE_KEY) || null;
  }catch(e){ return null; }
}

export function saveTheme(id){
  try{ localStorage.setItem(STORAGE_KEY, id); }catch(e){}
}

export function getThemeById(id){
  return THEMES.find(t=>t.id===id) || THEMES[0];
}

export function initThemeUI(){
  const themeBtn = document.getElementById("themeBtn");
  const panel = document.getElementById("themePanel");
  const list = document.getElementById("themeList");
  const close = document.getElementById("themeClose");

  // render theme items
  THEMES.forEach(t=>{
    const el = document.createElement("div");
    el.className = "theme-item";
    el.dataset.id = t.id;
    el.innerHTML = `<div class="theme-swatch" style="background:${t.preview}"></div><div><b>${t.name}</b></div>`;
    list.appendChild(el);
  });

  // open/close
  themeBtn.addEventListener("click", ()=>{
    panel.setAttribute("aria-hidden","false");
  });
  close.addEventListener("click", ()=> panel.setAttribute("aria-hidden","true"));

  // click select
  list.addEventListener("click", (e)=>{
    const item = e.target.closest(".theme-item");
    if(!item) return;
    const id = item.dataset.id;
    applyThemeById(id);
    saveTheme(id);
    panel.setAttribute("aria-hidden","true");
  });

  // apply saved or auto
  const saved = getSavedTheme();
  applyThemeById(saved || "auto");
}

// apply theme: if id === auto -> detect telegram theme
export function applyThemeById(id){
  const theme = getThemeById(id || "auto");
  if(theme.id === "auto"){
    // use Telegram themeParams if available
    const tg = window.Telegram?.WebApp;
    if(tg && tg.themeParams){
      // check bg_color brightness roughly
      const bg = tg.themeParams.bg_color || "#061021";
      const isLight = isColorLight(bg);
      // pick default mapping: if tg light -> pastel, else cosmic
      const pick = isLight ? getThemeById("pastel") : getThemeById("cosmic");
      applyPalette(pick.palette);
      document.documentElement.setAttribute("data-theme", "auto");
      return;
    }else{
      // fallback dark
      applyPalette(getThemeById("cosmic").palette);
      document.documentElement.setAttribute("data-theme", "auto");
      return;
    }
  }else{
    applyPalette(theme.palette);
    document.documentElement.setAttribute("data-theme", theme.id);
  }
}

function applyPalette(p){
  if(!p) return;
  // set CSS variables for palette usage
  document.documentElement.style.setProperty('--bg1', p.bg1);
  document.documentElement.style.setProperty('--bg2', p.bg2);
  document.documentElement.style.setProperty('--wave-start', p.waveStart);
  document.documentElement.style.setProperty('--wave-end', p.waveEnd);
  document.documentElement.style.setProperty('--app-text', p.text);

  // adjust global text color
  document.documentElement.style.setProperty('--text', p.text);
  // if light bg, ensure cards have border and darker text
  const light = isColorLight(p.bg1);
  if(light){
    document.documentElement.style.setProperty('--card-bg','rgba(0,0,0,0.04)');
    document.documentElement.style.setProperty('--muted','rgba(10,20,30,0.6)');
  }else{
    document.documentElement.style.setProperty('--card-bg','rgba(255,255,255,0.03)');
    document.documentElement.style.setProperty('--muted','rgba(238,246,255,0.7)');
  }

  // Update body background with gradient using vars
  document.body.style.background = `radial-gradient(1200px 600px at 10% 10%, ${p.waveStart}20, transparent 8%), linear-gradient(180deg, ${p.bg1}, ${p.bg2})`;
}

// small util: luminance (rough)
function isColorLight(hex){
  if(!hex) return false;
  if(hex.startsWith("rgba") || hex.startsWith("rgb")) return false;
  const c = hex.replace('#','');
  const r = parseInt(c.substr(0,2),16);
  const g = parseInt(c.substr(2,2),16);
  const b = parseInt(c.substr(4,2),16);
  const lum = 0.2126*r + 0.7152*g + 0.0722*b;
  return lum > 160;
}

// export for other modules
export { THEMES, applyPalette };
