// js/waves.js (slower)
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
window.addEventListener("resize", ()=> resize());

function rand(min,max){ return Math.random()*(max-min)+min; }

class Wave {
  constructor(options={}){
    this.amp = options.amp || rand(30,80);                // <- уменьшена амплитуда
    this.length = options.length || rand(0.001,0.004);    // <- чуть длиннее волны
    this.speed = options.speed || rand(0.00025, 0.0007);  // <- значительно медленнее
    this.phase = options.phase || rand(0,Math.PI*2);
    this.colorA = options.colorA;
    this.colorB = options.colorB;
  }
  render(t){
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
      const x = (i/segs) * w;
      const theta = (t * this.speed) + (x * this.length) + this.phase;
      const y = Math.sin(theta) * this.amp * (1 + Math.sin(t * 0.0003 + i*0.008)*0.08) + (h*0.5) + Math.sin(i*0.18 + t*0.0002)*6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.restore();
  }
}

function initWaves(){
  resize();
  waves = [];
  const cs = getComputedStyle(document.documentElement);
  const a = cs.getPropertyValue('--wave-start') || "#6dd3ff";
  const b = cs.getPropertyValue('--wave-end') || "#7b61ff";

  for(let i=0;i<4;i++){
    waves.push(new Wave({
      amp: 40 + i*18,
      length: 0.0025 + i*0.0005,
      speed: 0.00025 + i*0.0003,
      phase: i * 1.0,
      colorA: hexToRgba(a.trim(), 0.95 - i*0.12),
      colorB: hexToRgba(b.trim(), 0.85 - i*0.08)
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
  for(const wave of waves) wave.render(t);
  raf = requestAnimationFrame(loop);
}

export function startWaves(){
  cancelAnimationFrame(raf);
  initWaves();
  raf = requestAnimationFrame(loop);
}

window.addEventListener("load", ()=> setTimeout(()=> startWaves(), 120));
