class GeneticAlgorithm {
    constructor() {
        this.generation = 1;
        this.populationSize = 100;
        this.mutationRate = 0.05;
        this.eliteCount = 10;
        this.crossoverRate = 0.7;
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
        
        // Keep elite performers
        for (let i = 0; i < this.eliteCount && i < cars.length; i++) {
            const eliteCar = this.createCarFromBrain(cars[i].brain);
            newPopulation.push(eliteCar);
        }
        
        // Fill rest with offspring
        while (newPopulation.length < this.populationSize) {
            const parent1 = this.selectParent(cars);
            const parent2 = this.selectParent(cars);
            
            let childBrain;
            if (Math.random() < this.crossoverRate) {
                childBrain = this.crossover(parent1.brain, parent2.brain);
            } else {
                childBrain = JSON.parse(JSON.stringify(parent1.brain));
            }
            
            // Mutate
            EnhancedNeuralNetwork.mutate(childBrain, this.mutationRate);
            
            const childCar = this.createCarFromBrain(childBrain);
            newPopulation.push(childCar);
        }
        
        this.generation++;
        return newPopulation;
    }
    
    calculateFitness(cars) {
        cars.forEach(car => {
            // Enhanced fitness calculation
            let fitness = 0;
            
            // Distance reward (primary factor)
            fitness += car.distanceTraveled * 10;
            
            // Time alive bonus
            fitness += car.timeAlive * 0.1;
            
            // Speed consistency bonus
            const avgSpeed = car.distanceTraveled / Math.max(car.timeAlive, 1);
            fitness += avgSpeed * 5;
            
            // Lane keeping bonus
            fitness += car.laneKeepingScore * 20;
            
            // Collision penalties
            fitness -= car.collisionPenalty;
            
            // Bonus for reaching checkpoints
            fitness += car.checkpointsReached * 100;
            
            // Smooth driving bonus (less erratic steering)
            fitness += car.smoothDrivingScore * 10;
            
            car.fitness = Math.max(0, fitness);
        });
    }
    
    selectParent(cars) {
        // Tournament selection
        const tournamentSize = 5;
        let best = cars[Math.floor(Math.random() * cars.length)];
        
        for (let i = 1; i < tournamentSize; i++) {
            const competitor = cars[Math.floor(Math.random() * cars.length)];
            if (competitor.fitness > best.fitness) {
                best = competitor;
            }
        }
        
        return best;
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
        const stats = {
            generation: this.generation,
            bestFitness: cars[0]?.fitness || 0,
            avgFitness: cars.reduce((sum, car) => sum + car.fitness, 0) / cars.length,
            bestDistance: Math.max(...cars.map(car => car.distanceTraveled)),
            aliveCount: cars.filter(car => !car.damaged).length,
            successRate: cars.filter(car => car.checkpointsReached > 5).length / cars.length
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