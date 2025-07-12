// Canvas setup
const carCanvas = document.getElementById("carCanvas");
carCanvas.width = window.innerWidth * 0.7;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = window.innerWidth * 0.3;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

// Initialize systems
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);
const geneticAlgorithm = new GeneticAlgorithm();
const particleSystem = new ParticleSystem();
const uiManager = new UIManager();

// Global variables
let cars = [];
let bestCar = null;
let traffic = [];
let frameCount = 0;
let generationTimer = 0;
let maxGenerationTime = 1200; // 20 seconds at 60fps for faster evolution

// Saved brain for loading
let savedBrain = null;

// Make global for UI access
window.geneticAlgorithm = geneticAlgorithm;
window.bestCar = bestCar;
window.savedBrain = savedBrain;
window.resetSimulation = resetSimulation;

// Initialize simulation
function initializeSimulation() {
    // Create initial population
    cars = generateCars(geneticAlgorithm.populationSize);
    
    // Apply saved brain if available
    if (savedBrain) {
        for (let i = 0; i < cars.length; i++) {
            cars[i].brain = JSON.parse(JSON.stringify(savedBrain));
            if (i !== 0) {
                EnhancedNeuralNetwork.mutate(cars[i].brain, geneticAlgorithm.mutationRate * (1 + i * 0.1));
            }
        }
    }
    
    // Generate traffic
    generateTraffic();
    
    generationTimer = 0;
}

function generateCars(count) {
    const newCars = [];
    for (let i = 0; i < count; i++) {
        newCars.push(new EnhancedCar(road.getLaneCenter(1), 100, 30, 50, "AI"));
    }
    return newCars;
}

function generateTraffic() {
    traffic = [
        new EnhancedCar(road.getLaneCenter(1), -200, 30, 50, "DUMMY", 1.5),
        new EnhancedCar(road.getLaneCenter(0), -400, 30, 50, "DUMMY", 1.8),
        new EnhancedCar(road.getLaneCenter(2), -400, 30, 50, "DUMMY", 1.2),
        new EnhancedCar(road.getLaneCenter(1), -600, 30, 50, "DUMMY", 2),
        new EnhancedCar(road.getLaneCenter(0), -800, 30, 50, "DUMMY", 1.5),
        new EnhancedCar(road.getLaneCenter(2), -800, 30, 50, "DUMMY", 1.8),
        new EnhancedCar(road.getLaneCenter(1), -1000, 30, 50, "DUMMY", 1.2),
        new EnhancedCar(road.getLaneCenter(0), -1200, 30, 50, "DUMMY", 2),
        new EnhancedCar(road.getLaneCenter(2), -1200, 30, 50, "DUMMY", 1.5),
        new EnhancedCar(road.getLaneCenter(1), -1400, 30, 50, "DUMMY", 1.8),
        new EnhancedCar(road.getLaneCenter(0), -1600, 30, 50, "DUMMY", 1.2),
        new EnhancedCar(road.getLaneCenter(2), -1600, 30, 50, "DUMMY", 2),
        new EnhancedCar(road.getLaneCenter(1), -1800, 30, 50, "DUMMY", 1.5),
        new EnhancedCar(road.getLaneCenter(0), -2000, 30, 50, "DUMMY", 1.8),
        new EnhancedCar(road.getLaneCenter(2), -2000, 30, 50, "DUMMY", 1.2),
        new EnhancedCar(road.getLaneCenter(1), -2200, 30, 50, "DUMMY", 2),
        new EnhancedCar(road.getLaneCenter(0), -2400, 30, 50, "DUMMY", 1.5),
        new EnhancedCar(road.getLaneCenter(2), -2600, 30, 50, "DUMMY", 1.8),
        new EnhancedCar(road.getLaneCenter(1), -2800, 30, 50, "DUMMY", 1.2),
        new EnhancedCar(road.getLaneCenter(0), -3000, 30, 50, "DUMMY", 2),
    ];
}

function resetSimulation() {
    initializeSimulation();
    uiManager.chartData = [];
}

function shouldEvolve() {
    const aliveCount = cars.filter(car => !car.damaged).length;
    const timeUp = generationTimer > maxGenerationTime;
    const allDead = aliveCount === 0;
    const autoEvolveReady = uiManager.shouldAutoEvolve() && (timeUp || aliveCount < 5);
    
    return allDead || autoEvolveReady;
}

function evolveGeneration() {
    // Save best brain
    const currentBest = geneticAlgorithm.getBestBrain(cars);
    if (currentBest) {
        savedBrain = currentBest;
        window.savedBrain = savedBrain;
    }
    
    // Create new generation
    cars = geneticAlgorithm.evolvePopulation(cars);
    
    // Reset traffic positions
    generateTraffic();
    
    generationTimer = 0;
}

function animate(time) {
    frameCount++;
    generationTimer++;
    
    // Apply simulation speed
    const speed = uiManager.getSimulationSpeed();
    if (frameCount % Math.max(1, Math.round(2 - speed)) !== 0) {
        requestAnimationFrame(animate);
        return;
    }
    
    // Update traffic
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, [], particleSystem);
    }

    // Update cars
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic, particleSystem);
    }

    // Find best car (highest fitness)
    bestCar = cars.reduce((best, car) => {
        return car.fitness > best.fitness ? car : best;
    }, cars[0]);
    
    window.bestCar = bestCar;

    // Check for evolution
    if (shouldEvolve()) {
        evolveGeneration();
    }

    // Update UI
    const stats = geneticAlgorithm.getGenerationStats();
    stats.aliveCount = cars.filter(car => !car.damaged).length;
    stats.bestDistance = bestCar ? bestCar.distanceTraveled : 0;
    uiManager.updateStats(stats);

    // Update particle system
    particleSystem.update();

    // Render
    render();
    
    requestAnimationFrame(animate);
}

function render() {
    // Resize canvases
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    // Car canvas
    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

    // Draw road
    road.draw(carCtx);
    
    // Draw traffic
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, false);
    }

    // Draw all cars with transparency
    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        if (cars[i] !== bestCar) {
            cars[i].draw(carCtx, false);
        }
    }

    // Draw best car highlighted
    carCtx.globalAlpha = 1;
    if (bestCar) {
        bestCar.draw(carCtx, true);
    }
    
    // Draw particles
    particleSystem.draw(carCtx);

    carCtx.restore();

    // Network canvas
    networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
    networkCtx.lineDashOffset = -frameCount / 50;
    
    if (bestCar && bestCar.brain) {
        Visualizer.drawNetwork(networkCtx, bestCar.brain);
    }
}

// Initialize and start
initializeSimulation();
animate();

// Handle window resize
window.addEventListener('resize', () => {
    carCanvas.width = window.innerWidth * 0.7;
    networkCanvas.width = window.innerWidth * 0.3;
});