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
            this.radius = Math.random() * w * 0.7; // Широкий размах
            this.y = Math.random() * h;
            this.speed = 0.002 + Math.random() * 0.008;
            this.vY = 0.5 + Math.random() * 1.5;
            this.size = 1.5 + Math.random() * 2.5;
            
            // Получаем акцентный цвет из CSS
            const style = getComputedStyle(document.documentElement);
            const accent = style.getPropertyValue('--accent').trim();
            this.color = accent || "#6c5ce7";
        }
        draw() {
            this.angle += this.speed;
            this.y -= this.vY;
            if (this.y < -20) this.reset();
            
            const x = w/2 + Math.cos(this.angle) * this.radius * (this.y / h);
            const opacity = (this.y / h) * 0.5; // Чем выше, тем прозрачнее
            
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = opacity;
            ctx.arc(x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for(let i=0; i<100; i++) particles.push(new Particle());
    }
    initParticles();

    function animate() {
        // Очищаем полностью (прозрачный фон)
        ctx.clearRect(0, 0, w, h);
        
        // Рисуем частицы
        particles.forEach(p => p.draw());
        requestAnimationFrame(animate);
    }
    animate();

    window.initWaves = () => {
        resize();
        initParticles();
    };
})();
