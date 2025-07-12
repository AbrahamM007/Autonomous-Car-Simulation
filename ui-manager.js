class UIManager {
    constructor() {
        this.setupEventListeners();
        this.chartData = [];
        this.autoEvolve = false;
        this.simulationSpeed = 1;
    }
    
    setupEventListeners() {
        // Population size control
        const popSizeSlider = document.getElementById('population-size');
        const popSizeValue = document.getElementById('pop-size-value');
        popSizeSlider.addEventListener('input', (e) => {
            popSizeValue.textContent = e.target.value;
            if (window.geneticAlgorithm) {
                window.geneticAlgorithm.populationSize = parseInt(e.target.value);
            }
        });
        
        // Mutation rate control
        const mutationSlider = document.getElementById('mutation-rate');
        const mutationValue = document.getElementById('mutation-rate-value');
        mutationSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            mutationValue.textContent = value + '%';
            if (window.geneticAlgorithm) {
                window.geneticAlgorithm.mutationRate = value / 100;
            }
        });
        
        // Simulation speed control
        const speedSlider = document.getElementById('simulation-speed');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            speedValue.textContent = value + 'x';
            this.simulationSpeed = value;
        });
        
        // Control buttons
        document.getElementById('save-btn').addEventListener('click', () => this.saveBest());
        document.getElementById('load-btn').addEventListener('click', () => this.loadBest());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('auto-evolve-btn').addEventListener('click', () => this.toggleAutoEvolve());
    }
    
    updateStats(stats) {
        document.getElementById('generation').textContent = `Generation: ${stats.generation}`;
        document.getElementById('alive-count').textContent = `Alive: ${stats.aliveCount}`;
        document.getElementById('best-distance').textContent = `${Math.round(stats.bestDistance)}m`;
        document.getElementById('best-fitness').textContent = Math.round(stats.bestFitness);
        document.getElementById('avg-speed').textContent = `${Math.round(stats.avgFitness / 10)} km/h`;
        document.getElementById('success-rate').textContent = `${Math.round(stats.successRate * 100)}%`;
        
        // Update chart
        this.updateChart(stats);
    }
    
    updateChart(stats) {
        this.chartData.push({
            generation: stats.generation,
            bestFitness: stats.bestFitness,
            avgFitness: stats.avgFitness
        });
        
        // Keep only last 30 generations for chart
        if (this.chartData.length > 30) {
            this.chartData.shift();
        }
        
        this.drawChart();
    }
    
    drawChart() {
        const canvas = document.getElementById('chartCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.chartData.length < 2) return;
        
        const maxFitness = Math.max(...this.chartData.map(d => d.bestFitness));
        const minFitness = Math.min(...this.chartData.map(d => d.bestFitness));
        const range = maxFitness - minFitness || 1;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = (canvas.height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Draw best fitness line
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.chartData.length; i++) {
            const x = (canvas.width / (this.chartData.length - 1)) * i;
            const y = canvas.height - ((this.chartData[i].bestFitness - minFitness) / range) * canvas.height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw average fitness line
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < this.chartData.length; i++) {
            const x = (canvas.width / (this.chartData.length - 1)) * i;
            const y = canvas.height - ((this.chartData[i].avgFitness - minFitness) / range) * canvas.height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#00ff88';
        ctx.font = '12px Orbitron';
        ctx.fillText(`Max: ${Math.round(maxFitness)}`, 5, 15);
        ctx.fillText(`Min: ${Math.round(minFitness)}`, 5, canvas.height - 5);
    }
    
    saveBest() {
        if (window.bestCar && window.bestCar.brain) {
            localStorage.setItem("bestBrain", JSON.stringify(window.bestCar.brain));
            this.showNotification("Best brain saved!", '#00ff88');
        }
    }
    
    loadBest() {
        const saved = localStorage.getItem("bestBrain");
        if (saved) {
            window.savedBrain = JSON.parse(saved);
            this.showNotification("Brain loaded!", '#00ccff');
            // Trigger reset to apply loaded brain
            this.reset();
        } else {
            this.showNotification("No saved brain found!", '#ff6b6b');
        }
    }
    
    reset() {
        if (window.resetSimulation) {
            window.resetSimulation();
            this.chartData = [];
            this.showNotification("Simulation reset!", '#ffd93d');
        }
    }
    
    toggleAutoEvolve() {
        this.autoEvolve = !this.autoEvolve;
        const btn = document.getElementById('auto-evolve-btn');
        if (this.autoEvolve) {
            btn.classList.add('active');
            btn.textContent = '⏸️ Stop Auto';
            this.showNotification("Auto evolution enabled!", '#00ff88');
        } else {
            btn.classList.remove('active');
            btn.textContent = '🧬 Auto Evolve';
            this.showNotification("Auto evolution disabled!", '#ff6b6b');
        }
    }
    
    showNotification(message, color) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${color};
            padding: 20px 30px;
            border-radius: 10px;
            border: 2px solid ${color};
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: fadeInOut 2s ease-in-out;
        `;
        notification.textContent = message;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 2000);
    }
    
    shouldAutoEvolve() {
        return this.autoEvolve;
    }
    
    getSimulationSpeed() {
        return this.simulationSpeed;
    }
}