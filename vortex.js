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
            this.radius = Math.random() * w * 0.5;
            this.y = Math.random() * h;
            this.speed = 0.005 + Math.random() * 0.01;
            this.vY = 1 + Math.random() * 2;
            this.size = 1 + Math.random() * 2;
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            this.color = accent || "#6c5ce7";
        }
        draw() {
            this.angle += this.speed;
            this.y -= this.vY;
            if (this.y < -10) this.reset();
            
            // Математика вихря (торнадо)
            const x = w/2 + Math.cos(this.angle) * this.radius * (this.y / h);
            const opacity = (this.y / h) * 0.5;
            
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.globalAlpha = opacity;
            ctx.arc(x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for(let i=0; i<150; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, w, h);
        // Фоновый градиент
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#050508");
        grad.addColorStop(1, "#110a1f");
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,w,h);
        
        particles.forEach(p => p.draw());
        requestAnimationFrame(animate);
    }
    animate();
    window.initWaves = resize; // Для совместимости с палитрой
})();
