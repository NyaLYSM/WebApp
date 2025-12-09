// js/waves.js
(function(){
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
  let raf = null;
  let waves = [];

  function resize(){
    w = Math.max(window.innerWidth, 300) * DPR;
    h = Math.max(window.innerHeight, 300) * DPR;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  window.addEventListener("resize", resize);

  function hexToRgba(hex, alpha){
    if(!hex) hex = "#7b61ff";
    hex = hex.replace("#","").trim();
    if(hex.length === 3) hex = hex.split("").map(c=>c+c).join("");
    const r = parseInt(hex.substr(0,2),16);
    const g = parseInt(hex.substr(2,2),16);
    const b = parseInt(hex.substr(4,2),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function readWaveColors(){
    const cs = getComputedStyle(document.documentElement);
    const a = cs.getPropertyValue("--wave-start").trim() || "#6dd3ff";
    const b = cs.getPropertyValue("--wave-end").trim() || "#7b61ff";
    return {a,b};
  }

  function Wave(opts){
    this.amp = opts.amp || (40 + Math.random()*20);
    this.length = opts.length || (0.0025 + Math.random()*0.001);
    this.speed = opts.speed || (0.0002 + Math.random()*0.0004);
    this.phase = opts.phase || Math.random()*Math.PI*2;
    this.colorA = opts.colorA;
    this.colorB = opts.colorB;
  }
  Wave.prototype.render = function(t){
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createLinearGradient(0,0,w,0);
    grad.addColorStop(0, this.colorA);
    grad.addColorStop(1, this.colorB);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h*0.55);
    const segs = 80;
    for(let i=0;i<=segs;i++){
      const x = (i/segs)*w;
      const theta = (t*this.speed) + (x*this.length) + this.phase;
      const y = Math.sin(theta) * this.amp * (1 + Math.sin(t*0.0003 + i*0.008)*0.06) + (h*0.5) + Math.sin(i*0.18 + t*0.0002)*6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.globalAlpha = 0.18;
    ctx.fill();
    ctx.restore();
  };

  function initWaves(){
    resize();
    const colors = readWaveColors();
    waves = [];
    for(let i=0;i<4;i++){
      waves.push(new Wave({
        amp: 30 + i*14,
        length: 0.0025 + i*0.0005,
        speed: 0.00014 + i*0.00018,
        phase: i * 1.0,
        colorA: hexToRgba(colors.a, 0.95 - i*0.12),
        colorB: hexToRgba(colors.b, 0.85 - i*0.08)
      }));
    }
  }

  function loop(t){
    ctx.clearRect(0,0,w,h);
    for(const wave of waves) wave.render(t || 0);
    raf = requestAnimationFrame(loop);
  }

  window.startWaves = function(){
    cancelAnimationFrame(raf);
    initWaves();
    raf = requestAnimationFrame(loop);
  };

  // allow external trigger when palette changes
  window.updateWavesColors = function(){
    initWaves();
  };

  window.addEventListener("load", ()=>{
    setTimeout(()=> {
      try{ startWaves(); }catch(e){}
    }, 80);
    window.addEventListener("visibilitychange", ()=>{
      if (document.hidden) cancelAnimationFrame(raf);
      else startWaves();
    });
  });

})();
