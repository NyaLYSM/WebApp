// js/vortex.js — GEOMETRIC STORM (OPTIMIZED)
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
  const CENTER_X = () => w / 2;

  const FORMS = [];
  const FORM_COUNT = 16;

  function createShapePoints(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TWO_PI;
      const r = 0.7 + Math.random() * 0.4;
      pts.push({ a, r });
    }
    return pts;
  }

  class VortexForm {
    constructor(index) {
      this.index = index;
      this.reset();

      this.points = createShapePoints(12 + Math.floor(Math.random() * 6));

      const style = getComputedStyle(document.documentElement);
      this.color =
        style.getPropertyValue("--accent").trim() || "#6c5ce7";
    }

    reset() {
      this.y = h + Math.random() * h;
      this.level = Math.random();
      this.angle = Math.random() * TWO_PI;
      this.rotationSpeed = 0.001 + Math.random() * 0.002;
      this.riseSpeed = 0.15 + Math.random() * 0.25;
    }

    update() {
      this.y -= this.riseSpeed;
      this.angle += this.rotationSpeed;

      if (this.y < -h * 0.3) {
        this.reset();
      }
    }

    draw() {
      const t = 1 - this.y / h;

      const radius =
        Math.min(w, h) * (0.12 + t * 0.35);

      const squash = 0.4 + t * 0.6;

      ctx.save();
      ctx.translate(CENTER_X(), this.y);
      ctx.rotate(this.angle);

      ctx.beginPath();

      this.points.forEach((p, i) => {
        const r = radius * p.r;
        const x = Math.cos(p.a) * r;
        const y = Math.sin(p.a) * r * squash;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.closePath();

      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.12 + t * 0.25;
      ctx.lineWidth = 2 + (1 - t) * 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.stroke();
      ctx.restore();
    }
  }

  function init() {
    FORMS.length = 0;
    for (let i = 0; i < FORM_COUNT; i++) {
      FORMS.push(new VortexForm(i));
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);

    FORMS.forEach(f => {
      f.update();
      f.draw();
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
