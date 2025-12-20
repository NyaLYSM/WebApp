// js/vortex.js — CINEMATIC SPIRAL HURRICANE
(function () {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const TWO_PI = Math.PI * 2;
  let time = 0;

  const STREAMS = [];

  const STREAM_COUNT = 120;
  const CENTER_PULL = 0.72;

  class SpiralStream {
    constructor(layer) {
      this.layer = layer; // глубина
      this.seed = Math.random() * 1000;
      this.offset = Math.random() * TWO_PI;
      this.speed = 0.0004 + layer * 0.0006;
      this.width = 1.2 + layer * 3.5;
      this.length = 160 + layer * 240;

      const style = getComputedStyle(document.documentElement);
      this.color =
        style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    draw(t) {
      const cx = w / 2;
      const cy = h * 0.55;

      const progress = (t * this.speed + this.offset) % 1;

      ctx.save();
      ctx.beginPath();

      const segments = 28;

      for (let i = 0; i <= segments; i++) {
        const p = i / segments;

        // вертикальное движение
        const y =
          h - progress * h - p * this.length;

        // радиус с перспективой
        const baseRadius =
          Math.min(w, h) *
          (0.05 + this.layer * 0.45);

        const spiralT =
          progress * 6 + p * 2 + this.seed;

        const radius =
          baseRadius *
          (1 - progress * CENTER_PULL) *
          (1 - p * 0.4);

        // СПИРАЛЬ
        const angle =
          spiralT * TWO_PI +
          Math.sin(p * 3 + t * 0.002) * 0.4;

        const x =
          cx + Math.cos(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const alpha =
        progress < 0.1
          ? progress * 10
          : progress > 0.9
          ? 1 - (progress - 0.9) * 10
          : 1;

      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha * (0.08 + this.layer * 0.22);
      ctx.lineWidth = this.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // glow
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18 * this.layer;

      ctx.stroke();
      ctx.restore();
    }
  }

  function init() {
    STREAMS.length = 0;

    for (let i = 0; i < STREAM_COUNT; i++) {
      const layer = i / STREAM_COUNT;
      STREAMS.push(new SpiralStream(layer));
    }
  }

  function animate() {
    time++;

    ctx.clearRect(0, 0, w, h);

    // мягкий туман
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, w, h);

    STREAMS.forEach(s => s.draw(time));

    requestAnimationFrame(animate);
  }

  init();
  animate();

  window.initWaves = () => {
    resize();
    init();
  };
})();
