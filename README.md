<h1>Autonomous Car Simulation Powered by Neural Network AI</h1>
Experience a browser-based simulation where virtual cars learn to drive autonomously along a road. The system trains each car using a custom neural network, enabling it to avoid traffic and stay within lane boundaries using real-time sensor input.
</br>

<h3>🚗 Key Features</h3>
Self-driving vehicles controlled by a neural network

Simulated sensors for obstacle and border detection

Evolution-based learning through mutation and model retention

Interactive test car with keyboard control for experimentation

</br>
<h3>🧠 Project Structure</h3>
index.html – Initializes the canvas and loads all required scripts

style.css – Styles the dual canvases and interface elements

main.js – Coordinates the simulation: spawns cars, animates motion, and handles NN storage

car.js – Contains logic for vehicle movement, collisions, and AI behavior

sensor.js – Implements sensor simulation using ray casting

network.js – Defines the feedforward neural network logic

road.js – Renders the road, lane lines, and boundaries

controls.js – Allows manual car control via keyboard inputs

utils.js – Includes geometry helpers and utility functions

visualizer.js – Renders the neural network for real-time visualization

</br>
<h3>📘 Core JavaScript Concepts Demonstrated</h3>
Object-Oriented Programming (OOP)
Modular code with ES6 classes (e.g., Car, Sensor, NeuralNetwork)
Includes constructors, private methods (#method()), and inheritance

Encapsulation & Private Methods
Uses modern JS syntax (e.g., #createPolygon, #move) for encapsulated functionality

Canvas API
Dynamic rendering of roads, vehicles, sensors, and neural networks
Transformations (rotate/translate) simulate real car movement

Animation Loop
Smooth updates via requestAnimationFrame()
Responsive canvas sizing (canvas.height = window.innerHeight)

Collision Detection
Geometry-based using polygons and intersection checks (getIntersection(), polysIntersect())

AI & Neural Network Design
Custom feedforward architecture with tunable weights and biases
Inputs: sensor data; Outputs: directional controls
Threshold-based activation (sum > bias ? 1 : 0)
Includes mutation-based learning with NeuralNetwork.mutate()

Ray Casting for Sensors
Each sensor casts rays to detect obstacles and road edges
Intersection logic determines object distances

User Interaction
Interface buttons for saving/loading top-performing neural networks via localStorage

Functional Programming Concepts
Use of .map(), .forEach(), .find(), and spread syntax for streamlined logic

</br>
<h3>🧮 Neural Network Architecture</h3>
Structure: Inputs → Hidden Layer → Outputs

Example: 5 sensor inputs → 6 hidden neurons → 4 outputs (forward, left, right, reverse)

Function: Output nodes directly control vehicle movement

Learning: Hard-threshold activation, evolving through generations with mutations to enhance driving behavior