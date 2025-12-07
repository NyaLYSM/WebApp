// js/waves.js
import { getSavedTheme } from "./theme.js";

const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let w=0,h=0, DPR = Math.max(1, window.devicePixelRatio || 1);
let waves = [];
let raf = null;

function resize(){
  w = Math.max(window.innerWidth, 600) * DPR;
  h = window.innerHeight * DPR;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}
window.addEventListener("resize", ()=>{
  resize();
});

function rand(min,max){ return Math.random()*(max-min)+min; }

class Wave {
  constructor(options={}){
    this.amp = options.amp || rand(40,120);
    this.length = options.length || rand(0.0025,0.006);
    this.speed = options.speed || rand(0.0008, 0.002);
    this.phase = options.phase || rand(0,Math.PI*2);
    this.offsetX = options.offsetX || rand(-0.5,0.5) * w;
    this.colorA = options.colorA;
    this.colorB = options.colorB;
    this.widthFactor = options.widthFactor || rand(0.8,1.1);
  }
  render(t){
    ctx.save();
    ctx.translate(0,0);
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createLinearGradient(0,0,w,0);
    grad.addColorStop(0, this.colorA);
    grad.addColorStop(1, this.colorB);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h/2);
    const segs = 80;
    for(let i=0;i<=segs;i++){
      const x = (i/segs) * w;
      const px = x / DPR;
      const theta = (t * this.speed) + (x * this.length) + this.phase;
      const y = Math.sin(theta) * this.amp * (1 + Math.sin(t * 0.0005 + i*0.01)*0.15) + (h/2) + Math.sin(i*0.2 + t*0.0003)*10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.restore();
  }
}

function initWaves(){
  resize();
  waves = [];
  // get theme colors from CSS variables if set
  const cs = getComputedStyle(document.documentElement);
  const a = cs.getPropertyValue('--wave-start') || "#6dd3ff";
  const b = cs.getPropertyValue('--wave-end') || "#7b61ff";

  for(let i=0;i<4;i++){
    waves.push(new Wave({
      amp: 60 + i*30,
      length: 0.003 + i*0.0008,
      speed: 0.0007 + i*0.0006,
      phase: i * 1.1,
      colorA: hexToRgba(a.trim(), 0.9 - i*0.12),
      colorB: hexToRgba(b.trim(), 0.8 - i*0.1),
      widthFactor: 0.9 + i*0.1
    }));
  }
}

function hexToRgba(hex, alpha=1){
  hex = hex.replace("#","").trim();
  if(hex.length === 3) hex = hex.split("").map(c=>c+c).join("");
  const r = parseInt(hex.substr(0,2),16);
  const g = parseInt(hex.substr(2,2),16);
  const b = parseInt(hex.substr(4,2),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function loop(t){
  ctx.clearRect(0,0,w,h);
  for(const wave of waves){
    wave.render(t);
  }
  raf = requestAnimationFrame(loop);
}

export function startWaves(){
  cancelAnimationFrame(raf);
  initWaves();
  raf = requestAnimationFrame(loop);
}

window.addEventListener("load", ()=>{
  // small delay to allow theme CSS variables to apply
  setTimeout(()=> startWaves(), 120);
});
