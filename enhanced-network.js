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

    static mutate(network, amount = 0.05) {
        network.levels.forEach(level => {
            // Very small mutations to preserve good behaviors
            for (let i = 0; i < level.biases.length; i++) {
                if (Math.random() < amount) {
                    level.biases[i] += (Math.random() * 2 - 1) * 0.1;
                    level.biases[i] = Math.max(-2, Math.min(2, level.biases[i]));
                }
            }
            
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    if (Math.random() < amount) {
                        level.weights[i][j] += (Math.random() * 2 - 1) * 0.1;
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
        // Xavier initialization for better learning
        const inputCount = level.inputs.length;
        const limit = Math.sqrt(6 / inputCount);
        
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = (Math.random() * 2 - 1) * limit;
            }
        }

        for (let i = 0; i < level.outputs.length; i++) {
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
            
            // Sigmoid activation for smooth learning
            level.outputs[i] = 1 / (1 + Math.exp(-(sum + level.biases[i])));
        }

        return level.outputs;
    }
}