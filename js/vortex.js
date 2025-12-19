// js/vortex.js - ENERGY STORM EDITION
(function() {
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

    // Класс для "Молнии" / Ломаной линии
    class LightningStrand {
        constructor() {
            this.reset();
            // Начинаем со случайной высоты, чтобы не все снизу летели сразу
            this.yProgress = Math.random(); 
        }

        reset() {
            this.yProgress = 0;
            this.speed = 0.001 + Math.random() * 0.003; // Медленное поднятие
            this.angleOffset = Math.random() * Math.PI * 2;
            this.radiusBase = w * 0.4; // Ширина воронки внизу
            
            // Цвет берем из CSS
            const style = getComputedStyle(document.documentElement);
            this.color = style.getPropertyValue('--accent').trim() || "#6c5ce7";
            
            // Параметры "ломаности"
            this.segments = [];
            this.generateSegments();
        }

        generateSegments() {
            // Генерируем форму линии (относительно центра линии)
            this.segments = [];
            let currentX = 0;
            // Создаем 10 сегментов дрожания
            for(let i=0; i<15; i++) {
                this.segments.push({
                    x: (Math.random() - 0.5) * 30, // Дрожание по горизонтали
                    y: i * 20 // Шаг по вертикали локально
                });
            }
        }

        update() {
            this.yProgress += this.speed;
            if (this.yProgress > 1.2) this.reset();
            
            // Вращение
            this.angleOffset += 0.02; 
        }

        draw() {
            // Основная математика вихря
            // Чем выше (yProgress -> 1), тем уже радиус
            const currentYBase = h - (this.yProgress * h); // Движемся снизу вверх
            
            // Радиус сужается к верху
            const currentRadius = this.radiusBase * (1 - this.yProgress * 0.6);
            
            // Центр воронки
            const cx = w / 2;
            
            ctx.beginPath();
            
            // Рисуем ломаную линию
            for (let i = 0; i < this.segments.length; i++) {
                const seg = this.segments[i];
                
                // Координата сегмента в 3D-пространстве вихря
                // Y уменьшается (идет вверх)
                const pointY = currentYBase - seg.y; 
                
                // Угол закручивания зависит от высоты точки
                const twist = (pointY / h) * Math.PI * 4; 
                const angle = this.angleOffset + twist;
                
                // Смещаем сегмент по кругу + добавляем его собственный джиттер (seg.x)
                const r = currentRadius + seg.x;
                
                const x = cx + Math.cos(angle) * r;
                const y = pointY;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            // Прозрачность: исчезает вверху и внизу
            let alpha = 1;
            if (this.yProgress < 0.1) alpha = this.yProgress * 10;
            if (this.yProgress > 0.8) alpha = 1 - (this.yProgress - 0.8) * 5;
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha * 0.6; // Полупрозрачные
            ctx.stroke();
            
            // "Частицы" отлетающие (точки на концах сегментов)
            if (Math.random() > 0.95) {
                ctx.fillStyle = "#fff";
                ctx.fillRect(cx + Math.cos(this.angleOffset)*currentRadius, currentYBase, 2, 2);
            }
        }
    }

    function initStrands() {
        strands = [];
        for(let i=0; i<25; i++) strands.push(new LightningStrand());
    }
    initStrands();

    function animate() {
        ctx.clearRect(0, 0, w, h);
        
        // Рисуем молнии
        strands.forEach(s => {
            s.update();
            s.draw();
        });
        
        requestAnimationFrame(animate);
    }
    animate();

    window.initWaves = () => {
        resize();
        initStrands(); // Пересоздаем, чтобы цвет обновился
    };
})();
