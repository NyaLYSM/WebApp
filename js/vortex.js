// js/vortex.js — TRUE CINEMATIC TORNADO
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

  const RINGS = [];
  const RING_COUNT = 90;

  class VortexRing {
    constructor(level) {
      this.level = level; // 0 (низ) -> 1 (верх)
      this.angle = Math.random() * TWO_PI;
      this.speed = 0.002 + (1 - level) * 0.006;

      this.points = 8 + Math.floor(Math.random() * 6);
      this.noise = Math.random() * 1000;

      const style = getComputedStyle(document.documentElement);
      this.color =
        style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    update() {
      this.angle += this.speed;
      this.noise += 0.01;
    }

    draw() {
      const cx = w / 2;
      const baseY = h * (1 - this.level);

      // радиус увеличивается кверху
      const maxRadius = Math.min(w, h) * 0.45;
      const radius =
        maxRadius * (0.1 + this.level * this.level);

      const perspective = 0.6 + this.level * 0.8;

      ctx.save();
      ctx.translate(cx, baseY);
      ctx.rotate(this.angle);

      ctx.beginPath();

      for (let i = 0; i <= this.points; i++) {
        const p = i / this.points;
        const a = p * TWO_PI;

        // неровность, как пыль / мусор
        const jitter =
          Math.sin(a * 3 + this.noise) * radius * 0.15;

        const r = radius + jitter;

        // имитация 3D (сплющивание по Y)
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * perspective;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();

      const alpha =
        this.level < 0.15
          ? this.level * 6
          : this.level > 0.85
          ? (1 - this.level) * 6
          : 1;

      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha * 0.25;
      ctx.lineWidth = 2 + (1 - this.level) * 3;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;

      ctx.stroke();
      ctx.restore();
    }
  }

  function init() {
    RINGS.length = 0;
    for (let i = 0; i < RING_COUNT; i++) {
      RINGS.push(new VortexRing(i / RING_COUNT));
    }
  }

  function animate() {
    time++;

    ctx.clearRect(0, 0, w, h);

    // лёгкий туман
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);

    RINGS.forEach(r => {
      r.update();
      r.draw();
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
