// js/vortex.js — HURRICANE RIBBON VORTEX
(function () {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h;
  let ribbons = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class VortexRibbon {
    constructor() {
      this.reset();
      this.progress = Math.random();
    }

    reset() {
      this.progress = 0;
      this.speed = 0.0008 + Math.random() * 0.0015;
      this.angle = Math.random() * Math.PI * 2;
      this.radiusBase = w * (0.3 + Math.random() * 0.25);
      this.length = 10 + Math.floor(Math.random() * 8);
      this.width = 6 + Math.random() * 10;

      const style = getComputedStyle(document.documentElement);
      this.color = style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    update() {
      this.progress += this.speed;
      this.angle += 0.01 + this.progress * 0.02;
      if (this.progress > 1.2) this.reset();
    }

    draw() {
      const cx = w / 2;
      const baseY = h - this.progress * h;
      const baseRadius = this.radiusBase * (1 - this.progress * 0.7);

      let points = [];

      for (let i = 0; i < this.length; i++) {
        const t = i / this.length;
        const twist = this.angle + t * 2.5;
        const r = baseRadius - t * 40;
        const x = cx + Math.cos(twist) * r;
        const y = baseY - t * 60;

        points.push({ x, y, w: this.width * (1 - t) });
      }

      const fade =
        this.progress < 0.15
          ? this.progress * 6
          : this.progress > 0.85
          ? 1 - (this.progress - 0.85) * 6
          : 1;

      ctx.globalAlpha = fade * 0.45;
      ctx.fillStyle = this.color;

      ctx.beginPath();
      points.forEach((p, i) => {
        const nx = Math.cos(this.angle + i) * p.w;
        const ny = Math.sin(this.angle + i) * p.w;
        i === 0 ? ctx.moveTo(p.x + nx, p.y + ny) : ctx.lineTo(p.x + nx, p.y + ny);
      });
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const nx = Math.cos(this.angle + i + Math.PI) * p.w;
        const ny = Math.sin(this.angle + i + Math.PI) * p.w;
        ctx.lineTo(p.x + nx, p.y + ny);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  function init() {
    ribbons = [];
    for (let i = 0; i < 22; i++) ribbons.push(new VortexRibbon());
  }
  init();

  function animate() {
    ctx.clearRect(0, 0, w, h);
    ribbons.forEach(r => {
      r.update();
      r.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();

  window.initWaves = () => {
    resize();
    init();
  };
})();
