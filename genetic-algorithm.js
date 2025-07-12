class GeneticAlgorithm {
    constructor() {
        this.generation = 1;
        this.populationSize = 50; // Smaller population for faster learning
        this.mutationRate = 0.05; // Lower mutation rate
        this.eliteCount = 10; // Keep top performers
        this.crossoverRate = 0.9; // High crossover rate
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
            // Select parents from top 30% of population
            const topPerformers = cars.slice(0, Math.max(3, Math.floor(cars.length * 0.3)));
            const parent1 = this.selectParent(topPerformers);
            const parent2 = this.selectParent(topPerformers);
            
            let childBrain;
            if (Math.random() < this.crossoverRate && parent1 !== parent2) {
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
            
            // Primary reward: distance traveled (exponential reward for going far)
            fitness += Math.pow(car.distanceTraveled, 1.5) * 10;
            
            // Major bonus for staying alive longer
            fitness += car.timeAlive * 2;
            
            // Huge bonus for maintaining good speed and direction
            const avgSpeed = car.distanceTraveled / Math.max(car.timeAlive, 1);
            fitness += avgSpeed * 100;
            
            // Bonus for staying in lanes (very important)
            fitness += car.laneKeepingScore * 50;
            
            // Bonus for smooth driving
            fitness += car.smoothDrivingScore * 10;
            
            // Massive bonus for reaching checkpoints
            fitness += car.checkpointsReached * 1000;
            
            // Heavy penalty for collisions (but not too harsh to allow learning)
            fitness -= car.collisionPenalty;
            
            // Bonus for consecutive good behavior
            fitness += car.consecutiveGoodFrames * 5;
            
            car.fitness = Math.max(1, fitness); // Ensure minimum fitness
        });
    }
    
    selectParent(cars) {
        // Tournament selection with bias toward better performers
        const tournamentSize = Math.min(3, cars.length);
        const tournament = [];
        
        for (let i = 0; i < tournamentSize; i++) {
            tournament.push(cars[Math.floor(Math.random() * cars.length)]);
        }
        
        tournament.sort((a, b) => b.fitness - a.fitness);
        
        // 70% chance to pick best, 30% chance for diversity
        return Math.random() < 0.7 ? tournament[0] : tournament[Math.floor(Math.random() * tournament.length)];
    }
    
    crossover(brain1, brain2) {
        const newBrain = JSON.parse(JSON.stringify(brain1));
        
        // Uniform crossover for each level
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
            successRate: cars.filter(car => car.checkpointsReached > 2).length / cars.length
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