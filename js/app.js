(function(){

  const tg = window.Telegram?.WebApp || null;
  try { tg?.expand(); } catch(e){}

  const content = document.getElementById('content');
  const menuBtns = document.querySelectorAll('.menu .btn');

  /* ===== ПАЛИТРА ===== */

  const paletteBtn   = document.getElementById('palette-btn');
  const overlay      = document.getElementById('palette-overlay');
  const paletteGrid  = document.getElementById('palette-grid');
  const closeBtn     = document.getElementById('palette-close');
  const autoBtn      = document.getElementById('palette-auto');

  const PALETTES = [
    { bg:'#0b0b12', card:'#121216', text:'#fff', accent:'#6c5ce7', waveStart:'#6dd3ff', waveEnd:'#7b61ff' },
    { bg:'#1a0f1f', card:'#241327', text:'#fff', accent:'#d13cff', waveStart:'#ff6fd8', waveEnd:'#b06cff' },
    { bg:'#f0f2f5', card:'#fff', text:'#333', accent:'#4285f4', waveStart:'#89caff', waveEnd:'#4285f4' },
  ];

  function applyPalette(p){
    const s = document.documentElement.style;
    s.setProperty('--bg',p.bg);
    s.setProperty('--card',p.card);
    s.setProperty('--text',p.text);
    s.setProperty('--accent',p.accent);
    s.setProperty('--wave-start',p.waveStart);
    s.setProperty('--wave-end',p.waveEnd);
    localStorage.setItem('palette', JSON.stringify(p));
    window.updateWavesColors?.();
  }

  function resetPalette(){
    localStorage.removeItem('palette');
    ['--bg','--card','--text','--accent','--wave-start','--wave-end']
      .forEach(v => document.documentElement.style.removeProperty(v));
    window.updateWavesColors?.();
    overlay.hidden = true;
  }

  function initPalette(){
    overlay.hidden = true;

    const saved = localStorage.getItem('palette');
    if(saved) applyPalette(JSON.parse(saved));

    paletteGrid.innerHTML = PALETTES.map((p,i)=>`
      <div class="palette-swatch" data-i="${i}"
        style="background:linear-gradient(135deg,${p.bg},${p.accent})">
      </div>
    `).join('');

    paletteGrid.onclick = e=>{
      const el = e.target.closest('.palette-swatch');
      if(!el) return;
      applyPalette(PALETTES[el.dataset.i]);
      overlay.hidden = true;
    };

    paletteBtn.onclick = ()=> overlay.hidden = false;
    closeBtn.onclick   = ()=> overlay.hidden = true;
    autoBtn.onclick    = resetPalette;

    overlay.onclick = e=>{
      if(e.target === overlay) overlay.hidden = true;
    };
  }

  /* ===== НАВИГАЦИЯ ===== */

  function loadSection(name){
    menuBtns.forEach(b=>b.classList.remove('active'));
    document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
    content.innerHTML = `<h2>${name}</h2>`;
  }

  function initNav(){
    menuBtns.forEach(btn=>{
      btn.onclick = ()=> loadSection(btn.dataset.section);
    });
    loadSection('wardrobe');
  }

  /* ===== START ===== */

  function start(){
    initPalette();
    initNav();
  }

  start();

})();
