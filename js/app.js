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

  const closeBtn = document.getElementById("palette-close"); 
  const autoBtn = document.getElementById("palette-auto");

  const PALETTES = [
    { name:"Dark Blue", bg:"#0b0b12", card:"#121216", text:"#ffffff", accent:"#6c5ce7", waveStart:"#6dd3ff", waveEnd:"#7b61ff" },
    { name:"Purple", bg:"#1a0f1f", card:"#241327", text:"#ffffff", accent:"#d13cff", waveStart:"#ff6fd8", waveEnd:"#b06cff" },
    { name:"Teal", bg:"#0f1a17", card:"#132421", text:"#e8fff7", accent:"#00c896", waveStart:"#00e6a8", waveEnd:"#00aaff" },
    { name:"Orange", bg:"#1a150f", card:"#241e13", text:"#ffffff", accent:"#ff8c00", waveStart:"#ffb04f", waveEnd:"#ff6f3f" },
    { name:"Green", bg:"#0e1a0f", card:"#122413", text:"#ffffff", accent:"#00d14b", waveStart:"#00ff96", waveEnd:"#00aa60" },
    { name:"Light Mode", bg:"#f0f2f5", card:"#ffffff", text:"#333", accent:"#4285f4", waveStart:"#89caff", waveEnd:"#4285f4" },
  ];

  function openPalette() {
    if(!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closePalette() {
    if(!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
  }

  function applyPalette(palette) {
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

  function resetPalette() {
    localStorage.removeItem("selectedPalette");
    document.documentElement.style.cssText = "";
    if(window.updateWavesColors) window.updateWavesColors();
    closePalette();
  }

  function setupPalette() {
    const saved = localStorage.getItem('selectedPalette');
    if (saved) {
      try { applyPalette(JSON.parse(saved)); } catch(e){}
    }

    if (paletteGrid) {
      paletteGrid.innerHTML = PALETTES.map((p, i) => `
        <div class="palette-swatch"
             data-index="${i}"
             style="background: linear-gradient(135deg, ${p.bg} 0%, ${p.accent} 100%); cursor: pointer;"
             title="${p.name}">
        </div>
      `).join('');

      paletteGrid.addEventListener('click', (e) => {
        const swatch = e.target.closest('.palette-swatch');
        if (swatch) {
          applyPalette(PALETTES[swatch.dataset.index]);
          closePalette();
        }
      });
    }

    paletteBtn?.addEventListener('click', openPalette);
    autoBtn?.addEventListener('click', resetPalette);
    closeBtn?.addEventListener('click', closePalette);

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closePalette();
    });

    closePalette();
  }

  function loadSection(sectionName) {
    menuBtns.forEach(btn => btn.classList.remove('active'));

    switch(sectionName) {
      case 'populate': populatePage(); break;
      case 'looks': looksPage(); break;
      case 'profile': profilePage(); break;
      default: wardrobePage(); break;
    }

    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
    window.location.hash = sectionName;
  }

  async function populatePage() {
    content.innerHTML = `<h2>Добавить вещь</h2>`;
  }

  async function wardrobePage() {
    content.innerHTML = `<h2>Ваш гардероб</h2>`;
  }

  async function looksPage() {
    content.innerHTML = `<h2>Ваши образы</h2>`;
  }

  async function profilePage() {
    content.innerHTML = `<h2>Профиль</h2>`;
  }

  async function authenticate() {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      window.setAuthToken?.(storedToken);
      return true;
    }

    if (!tg || !tg.initData) {
      content.innerHTML = `<h2>Ошибка</h2><p>Запуск вне Telegram</p>`;
      return false;
    }

    try {
      const res = await window.apiPost('/api/tg_auth/exchange', { init_data: tg.initData });
      localStorage.setItem('auth_token', res.access_token);
      window.setAuthToken?.(res.access_token);
      return true;
    } catch {
      return false;
    }
  }

  function main() {
    setupPalette();

    menuBtns.forEach(btn => {
      btn.addEventListener("click", () => loadSection(btn.dataset.section));
    });

    loadSection(location.hash.slice(1) || 'wardrobe');
    tg?.MainButton?.hide();
  }

  authenticate().then(ok => ok && main());

})();
