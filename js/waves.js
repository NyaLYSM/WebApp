// js/waves.js (non-module, WebView friendly)
(function(){
  var canvas = null, ctx = null, w=0,h=0, DPR = Math.max(1, window.devicePixelRatio||1), raf=null, waves=[];
  function resize(){ w = Math.max(window.innerWidth, 320)*DPR; h = Math.max(window.innerHeight, 320)*DPR; canvas.width=w; canvas.height=h; canvas.style.width = window.innerWidth + "px"; canvas.style.height = window.innerHeight + "px"; }
  function hexToRgba(hex, a){ hex = (hex||"#7b61ff").replace("#","").trim(); if(hex.length===3) hex=hex.split("").map(function(c){return c+c}).join(""); var r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16); return "rgba("+r+","+g+","+b+","+(a||1)+")"; }
  function Wave(opts){ this.amp = opts.amp; this.length = opts.length; this.speed = opts.speed; this.phase = opts.phase; this.colorA = opts.colorA; this.colorB = opts.colorB; }
  Wave.prototype.render = function(t){
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    var grad = ctx.createLinearGradient(0,0,w,0); grad.addColorStop(0,this.colorA); grad.addColorStop(1,this.colorB);
    ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(0,h); ctx.lineTo(0,h*0.55); var segs=80;
    for(var i=0;i<=segs;i++){ var x=(i/segs)*w; var theta=(t*this.speed)+(x*this.length)+this.phase; var y=Math.sin(theta)*this.amp + (h*0.52) + Math.sin(i*0.2)*6; ctx.lineTo(x,y); }
    ctx.lineTo(w,h); ctx.closePath(); ctx.globalAlpha=0.22; ctx.fill(); ctx.restore();
  };
  function init(){
    canvas = document.getElementById("bgCanvas"); if(!canvas) return;
    ctx = canvas.getContext("2d"); window.addEventListener("resize", resize); resize(); startWaves();
  }
  function startWaves(){
    cancelAnimationFrame(raf);
    var cs = getComputedStyle(document.documentElement);
    var a = cs.getPropertyValue("--wave-start") || "#6dd3ff";
    var b = cs.getPropertyValue("--wave-end") || "#7b61ff";
    waves = [];
    for(var i=0;i<4;i++){
      waves.push(new Wave({
        amp:40 + i*18,
        length:0.0025 + i*0.0005,
        speed:0.00015 + i*0.00015,
        phase:i*1.0,
        colorA: hexToRgba(a, 0.9 - i*0.12),
        colorB: hexToRgba(b, 0.8 - i*0.08)
      }));
    }
    loop();
  }
  function loop(t){
    ctx.clearRect(0,0,w,h);
    for(var i=0;i<waves.length;i++) waves[i].render(t||0);
    raf = requestAnimationFrame(loop);
  }
  window.startWaves = startWaves;
  window.addEventListener("load", init);
})();
