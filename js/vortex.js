// js/vortex.js — VORTEX STRANDS EDITION
(function () {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h;
  let strands = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  class Strand {
    constructor() {
      this.reset();
      this.yProgress = Math.random();
    }

    reset() {
      this.yProgress = 0;
      this.speed = 0.001 + Math.random() * 0.002;
      this.angle = Math.random() * Math.PI * 2;
      this.radiusBase = w * (0.3 + Math.random() * 0.2);

      const style = getComputedStyle(document.documentElement);
      this.color = style.getPropertyValue("--accent").trim() || "#6c5ce7";

      this.segments = [];
      for (let i = 0; i < 14; i++) {
        this.segments.push({
          offset: (Math.random() - 0.5) * 25,
          y: i * 18
        });
      }
    }

    update() {
      this.yProgress += this.speed;
      this.angle += 0.015;
      if (this.yProgress > 1.15) this.reset();
    }

    draw() {
      const baseY = h - this.yProgress * h;
      const radius = this.radiusBase * (1 - this.yProgress * 0.6);
      const cx = w / 2;

      ctx.beginPath();

      this.segments.forEach((seg, i) => {
        const py = baseY - seg.y;
        const twist = (py / h) * Math.PI * 4;
        const a = this.angle + twist;
        const r = radius + seg.offset;

        const x = cx + Math.cos(a) * r;
        const y = py;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        // отрыв частиц
        if (Math.random() > 0.985) {
          ctx.fillStyle = this.color;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x, y, 2, 2);
        }
      });

      let alpha = 1;
      if (this.yProgress < 0.1) alpha = this.yProgress * 10;
      if (this.yProgress > 0.8) alpha = 1 - (this.yProgress - 0.8) * 5;

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.5;
      ctx.stroke();
    }
  }

  function init() {
    strands = [];
    for (let i = 0; i < 26; i++) strands.push(new Strand());
  }
  init();

  function animate() {
    ctx.clearRect(0, 0, w, h);
    strands.forEach(s => {
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
