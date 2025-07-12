class GeneticAlgorithm {
    constructor() {
        this.generation = 1;
        this.populationSize = 100;
        this.mutationRate = 0.1;
        this.eliteCount = 20; // Keep more elite performers
        this.crossoverRate = 0.8;
        this.generationHistory = [];
    }

    evolvePopulation(cars) {
        // Calculate fitness for all cars
        this.calculateFitness(cars);
        
        // Sort by fitness (descending)
        cars.sort((a, b) => b.fitness - a.fitness);
        
        // Store generation statistics
        this.storeGenerationStats(cars);
        
        // Create new population
        const newPopulation = [];
        
        // Keep elite performers (exact copies)
        for (let i = 0; i < this.eliteCount && i < cars.length; i++) {
            const eliteCar = this.createCarFromBrain(cars[i].brain);
            newPopulation.push(eliteCar);
        }
        
        // Fill rest with offspring from top performers
        while (newPopulation.length < this.populationSize) {
            // Select parents from top 50% of population
            const parent1 = this.selectParent(cars.slice(0, Math.floor(cars.length / 2)));
            const parent2 = this.selectParent(cars.slice(0, Math.floor(cars.length / 2)));
            
            let childBrain;
            if (Math.random() < this.crossoverRate) {
                childBrain = this.crossover(parent1.brain, parent2.brain);
            } else {
                childBrain = JSON.parse(JSON.stringify(parent1.brain));
            }
            
            // Apply mutation
            EnhancedNeuralNetwork.mutate(childBrain, this.mutationRate);
            
            const childCar = this.createCarFromBrain(childBrain);
            newPopulation.push(childCar);
        }
        
        this.generation++;
        return newPopulation;
    }
    
    calculateFitness(cars) {
        cars.forEach(car => {
            let fitness = 0;
            
            // Primary reward: distance traveled (most important)
            fitness += car.distanceTraveled * 100;
            
            // Bonus for staying alive longer
            fitness += car.timeAlive * 0.5;
            
            // Bonus for maintaining good speed
            const avgSpeed = car.distanceTraveled / Math.max(car.timeAlive, 1);
            fitness += avgSpeed * 50;
            
            // Bonus for staying in lanes
            fitness += car.laneKeepingScore * 100;
            
            // Heavy penalty for collisions
            fitness -= car.collisionPenalty * 2;
            
            // Bonus for reaching checkpoints
            fitness += car.checkpointsReached * 500;
            
            // Bonus for smooth driving
            fitness += car.smoothDrivingScore * 20;
            
            car.fitness = Math.max(0, fitness);
        });
    }
    
    selectParent(cars) {
        // Weighted random selection based on fitness
        const totalFitness = cars.reduce((sum, car) => sum + car.fitness, 0);
        if (totalFitness === 0) {
            return cars[Math.floor(Math.random() * cars.length)];
        }
        
        let random = Math.random() * totalFitness;
        for (let car of cars) {
            random -= car.fitness;
            if (random <= 0) {
                return car;
            }
        }
        return cars[0];
    }
    
    crossover(brain1, brain2) {
        const newBrain = JSON.parse(JSON.stringify(brain1));
        
        // Single-point crossover for each level
        for (let levelIndex = 0; levelIndex < newBrain.levels.length; levelIndex++) {
            const level1 = brain1.levels[levelIndex];
            const level2 = brain2.levels[levelIndex];
            const newLevel = newBrain.levels[levelIndex];
            
            // Crossover weights
            for (let i = 0; i < level1.weights.length; i++) {
                for (let j = 0; j < level1.weights[i].length; j++) {
                    if (Math.random() < 0.5) {
                        newLevel.weights[i][j] = level2.weights[i][j];
                    }
                }
            }
            
            // Crossover biases
            for (let i = 0; i < level1.biases.length; i++) {
                if (Math.random() < 0.5) {
                    newLevel.biases[i] = level2.biases[i];
                }
            }
        }
        
        return newBrain;
    }
    
    createCarFromBrain(brain) {
        const car = new EnhancedCar(road.getLaneCenter(1), 100, 30, 50, "AI");
        car.brain = JSON.parse(JSON.stringify(brain));
        return car;
    }
    
    storeGenerationStats(cars) {
        const aliveCars = cars.filter(car => !car.damaged);
        const stats = {
            generation: this.generation,
            bestFitness: cars[0]?.fitness || 0,
            avgFitness: cars.reduce((sum, car) => sum + car.fitness, 0) / cars.length,
            bestDistance: Math.max(...cars.map(car => car.distanceTraveled)),
            aliveCount: aliveCars.length,
            successRate: cars.filter(car => car.checkpointsReached > 3).length / cars.length
        };
        
        this.generationHistory.push(stats);
        
        // Keep only last 50 generations for performance
        if (this.generationHistory.length > 50) {
            this.generationHistory.shift();
        }
    }
    
    getBestBrain(cars) {
        this.calculateFitness(cars);
        cars.sort((a, b) => b.fitness - a.fitness);
        return cars[0]?.brain;
    }
    
    getGenerationStats() {
        return this.generationHistory[this.generationHistory.length - 1] || {
            generation: this.generation,
            bestFitness: 0,
            avgFitness: 0,
            bestDistance: 0,
            aliveCount: 0,
            successRate: 0
        };
    }
}