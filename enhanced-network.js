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
            // Mutate biases with smaller, more controlled changes
            for (let i = 0; i < level.biases.length; i++) {
                if (Math.random() < amount) {
                    level.biases[i] += (Math.random() * 2 - 1) * 0.2;
                    level.biases[i] = Math.max(-1, Math.min(1, level.biases[i]));
                }
            }
            
            // Mutate weights with smaller, more controlled changes
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    if (Math.random() < amount) {
                        level.weights[i][j] += (Math.random() * 2 - 1) * 0.2;
                        level.weights[i][j] = Math.max(-1, Math.min(1, level.weights[i][j]));
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
        // Better initialization for faster learning
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }

        for (let i = 0; i < level.outputs.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
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
            
            // Use tanh activation for better learning
            level.outputs[i] = Math.tanh(sum + level.biases[i]);
        }

        return level.outputs;
    }
}