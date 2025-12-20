// js/vortex.js — CINEMATIC HURRICANE VORTEX
(function () {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h;
  let streams = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const TWO_PI = Math.PI * 2;

  class AirStream {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.progress = initial ? Math.random() : 0;
      this.speed = 0.0006 + Math.random() * 0.001;
      this.baseAngle = Math.random() * TWO_PI;

      this.radiusBase =
        Math.min(w, h) * (0.15 + Math.random() * 0.35);

      this.length = 120 + Math.random() * 180;
      this.width = 6 + Math.random() * 10;

      this.noiseOffset = Math.random() * 1000;

      const style = getComputedStyle(document.documentElement);
      this.color =
        style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    update() {
      this.progress += this.speed;
      this.noiseOffset += 0.01;

      if (this.progress > 1.15) {
        this.reset();
      }
    }

    draw() {
      const t = this.progress;

      // вертикальное движение снизу вверх
      const yBase = h - t * h;

      // мягкое дыхание радиуса
      const pulse =
        Math.sin(t * Math.PI * 2 + this.noiseOffset) * 0.08;

      const radius =
        this.radiusBase * (1 - t * 0.7 + pulse);

      // закручивание
      const angle =
        this.baseAngle + t * 6 + Math.sin(t * 4) * 0.3;

      const cx = w / 2;
      const xBase = cx + Math.cos(angle) * radius;

      // затухание
      let alpha = 1;
      if (t < 0.1) alpha = t * 10;
      else if (t > 0.9) alpha = 1 - (t - 0.9) * 10;

      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const p = i / segments;

        const sway =
          Math.sin(
            p * 4 + this.noiseOffset + t * 3
          ) * radius * 0.12;

        const localAngle =
          angle + p * 1.2 + sway * 0.002;

        const r =
          radius - p * this.length * 0.35;

        const x =
          cx + Math.cos(localAngle) * r;

        const y =
          yBase - p * this.length;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  function init() {
    streams = [];
    const count = Math.floor(
      Math.min(w, h) / 18
    );
    for (let i = 0; i < count; i++) {
      streams.push(new AirStream());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    streams.forEach(s => {
      s.update();
      s.draw();
    });
    requestAnimationFrame(animate);
  }

  init();
  animate();

  window.initWaves = () => {
    resize();
    init();
  };
})();
