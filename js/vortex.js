// js/vortex.js — CINEMATIC AIR VORTEX
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

  const TAU = Math.PI * 2;

  class AirStream {
    constructor() {
      this.reset();
      this.offset = Math.random() * 1000;
    }

    reset() {
      this.progress = Math.random();
      this.speed = 0.0006 + Math.random() * 0.0008;
      this.baseAngle = Math.random() * TAU;
      this.radius = w * (0.15 + Math.random() * 0.35);
      this.length = 120 + Math.random() * 220; // ДЛИНА потока
      this.width = 10 + Math.random() * 18;    // ТОЛЩИНА

      const style = getComputedStyle(document.documentElement);
      this.color =
        style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    update() {
      this.progress += this.speed;
      if (this.progress > 1.15) this.reset();
    }

    draw() {
      const y = h - this.progress * h;
      const centerX = w / 2;

      const swirl =
        this.baseAngle +
        this.progress * 6 +
        Math.sin(this.progress * 4 + this.offset) * 0.6;

      const r = this.radius * (1 - this.progress * 0.7);
      const x = centerX + Math.cos(swirl) * r;

      const fade =
        this.progress < 0.15
          ? this.progress / 0.15
          : this.progress > 0.85
          ? (1 - this.progress) / 0.15
          : 1;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(swirl + Math.PI / 2);
      ctx.globalAlpha = fade * 0.25;

      const grad = ctx.createLinearGradient(
        0,
        -this.length / 2,
        0,
        this.length / 2
      );
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, this.color);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(-this.width, -this.length / 2);
      ctx.quadraticCurveTo(
        0,
        0,
        -this.width,
        this.length / 2
      );
      ctx.lineTo(this.width, this.length / 2);
      ctx.quadraticCurveTo(
        0,
        0,
        this.width,
        -this.length / 2
      );
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  function init() {
    streams = [];
    for (let i = 0; i < 60; i++) streams.push(new AirStream());
  }
  init();

  function animate() {
    ctx.clearRect(0, 0, w, h);
    streams.forEach(s => {
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
