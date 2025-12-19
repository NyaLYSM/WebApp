// js/vortex.js — POLYGON VORTEX EDITION
(function () {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h;
  let shapes = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class VortexShape {
    constructor() {
      this.reset();
      this.progress = Math.random();
    }

    reset() {
      this.progress = 0;
      this.speed = 0.001 + Math.random() * 0.002;
      this.angle = Math.random() * Math.PI * 2;
      this.radiusBase = w * (0.25 + Math.random() * 0.25);
      this.sides = 4 + Math.floor(Math.random() * 4); // 4–7 углов
      this.size = 12 + Math.random() * 20;

      const style = getComputedStyle(document.documentElement);
      this.color = style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    update() {
      this.progress += this.speed;
      this.angle += 0.02;
      if (this.progress > 1.2) this.reset();
    }

    draw() {
      const y = h - this.progress * h;
      const radius = this.radiusBase * (1 - this.progress * 0.65);
      const cx = w / 2;

      const x = cx + Math.cos(this.angle) * radius;

      const fade =
        this.progress < 0.1
          ? this.progress * 10
          : this.progress > 0.85
          ? 1 - (this.progress - 0.85) * 6
          : 1;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.angle + this.progress * 4);
      ctx.globalAlpha = fade * 0.5;
      ctx.fillStyle = this.color;

      ctx.beginPath();
      for (let i = 0; i < this.sides; i++) {
        const a = (Math.PI * 2 / this.sides) * i;
        const r = this.size * (0.6 + Math.random() * 0.4);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // мелкие обломки
      if (Math.random() > 0.97) {
        ctx.fillRect(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          2,
          2
        );
      }

      ctx.restore();
    }
  }

  function init() {
    shapes = [];
    for (let i = 0; i < 40; i++) shapes.push(new VortexShape());
  }
  init();

  function animate() {
    ctx.clearRect(0, 0, w, h);
    shapes.forEach(s => {
      s.update();
      s.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();

  window.initWaves = () => {
    resize();
    init();
  };
})();
