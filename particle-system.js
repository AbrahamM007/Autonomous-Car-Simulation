class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 100;
    }
    
    addExplosion(x, y, color = '#ff4444') {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(
                x, y,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                color,
                60 + Math.random() * 30
            ));
        }
    }
    
    addSparkle(x, y, color = '#00ff88') {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                color,
                30 + Math.random() * 20
            ));
        }
    }
    
    addTrail(x, y, vx, vy, color = '#00ccff') {
        this.particles.push(new Particle(
            x, y, vx * 0.5, vy * 0.5, color, 20
        ));
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Limit particle count for performance
        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
    }
    
    draw(ctx) {
        ctx.save();
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}