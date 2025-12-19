// js/vortex.js
(function() {
    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles = [];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.angle = Math.random() * Math.PI * 2;
            this.radius = Math.random() * w * 0.6; // Чуть шире радиус
            this.y = Math.random() * h;
            this.speed = 0.005 + Math.random() * 0.01;
            this.vY = 1.5 + Math.random() * 1.5; // Чуть быстрее
            this.size = 2 + Math.random() * 3;   // Чуть крупнее
            
            // Пытаемся взять цвет, если нет - белый
            const style = getComputedStyle(document.documentElement);
            const accent = style.getPropertyValue('--accent').trim();
            this.color = accent || "#6c5ce7";
        }
        draw() {
            this.angle += this.speed;
            this.y -= this.vY;
            if (this.y < -10) this.reset();
            
            // Вихрь
            const x = w/2 + Math.cos(this.angle) * this.radius * (this.y / h);
            // Плавное исчезновение к верху
            const opacity = (this.y / h) * 0.4;
            
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = opacity;
            ctx.arc(x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Создаем частицы
    function initParticles() {
        particles = [];
        for(let i=0; i<120; i++) particles.push(new Particle());
    }
    initParticles();

    function animate() {
        ctx.clearRect(0, 0, w, h);
        // Без fillRect для фона, фон задается через CSS body
        particles.forEach(p => p.draw());
        requestAnimationFrame(animate);
    }
    animate();

    // Экспорт для обновления цвета при смене темы
    window.initWaves = () => {
        resize();
        initParticles();
    };
})();