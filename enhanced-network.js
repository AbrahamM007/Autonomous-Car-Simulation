class EnhancedNeuralNetwork {
    constructor(neuronCounts) {
        this.levels = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.levels.push(new EnhancedLevel(
                neuronCounts[i], 
                neuronCounts[i + 1]
            ));
        }
    }

    static feedForward(givenInputs, network) {
        let outputs = EnhancedLevel.feedForward(givenInputs, network.levels[0]);
        for (let i = 1; i < network.levels.length; i++) {
            outputs = EnhancedLevel.feedForward(outputs, network.levels[i]);
        }
        return outputs;
    }

    static mutate(network, amount = 0.1) {
        network.levels.forEach(level => {
            // Mutate biases
            for (let i = 0; i < level.biases.length; i++) {
                if (Math.random() < amount) {
                    level.biases[i] += (Math.random() * 2 - 1) * 0.5;
                    level.biases[i] = Math.max(-2, Math.min(2, level.biases[i]));
                }
            }
            
            // Mutate weights
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    if (Math.random() < amount) {
                        level.weights[i][j] += (Math.random() * 2 - 1) * 0.5;
                        level.weights[i][j] = Math.max(-2, Math.min(2, level.weights[i][j]));
                    }
                }
            }
        });
    }
}

class EnhancedLevel {
    constructor(inputCount, outputCount) {
        this.inputs = new Array(inputCount);
        this.outputs = new Array(outputCount);
        this.biases = new Array(outputCount);
        this.weights = [];
        
        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        EnhancedLevel.randomize(this);
    }

    static randomize(level) {
        // Xavier initialization for better training
        const inputCount = level.inputs.length;
        const outputCount = level.outputs.length;
        const limit = Math.sqrt(6 / (inputCount + outputCount));
        
        for (let i = 0; i < inputCount; i++) {
            for (let j = 0; j < outputCount; j++) {
                level.weights[i][j] = (Math.random() * 2 - 1) * limit;
            }
        }

        for (let i = 0; i < outputCount; i++) {
            level.biases[i] = (Math.random() * 2 - 1) * 0.5;
        }
    }

    static feedForward(givenInputs, level) {
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = givenInputs[i];
        }

        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }
            
            // Enhanced sigmoid activation
            level.outputs[i] = EnhancedLevel.sigmoid(sum + level.biases[i]);
        }

        return level.outputs;
    }
    
    static sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }
    
    static tanh(x) {
        return Math.tanh(Math.max(-500, Math.min(500, x)));
    }
    
    static relu(x) {
        return Math.max(0, x);
    }
}