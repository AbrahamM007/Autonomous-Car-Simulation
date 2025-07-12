class Car {
    constructor(x, y, width, height, controlType, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.acceleration = 0.2;
        this.reversespeed = 1.5;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;

        this.damaged = false;
        
        // Enhanced fitness tracking
        this.fitness = 0;
        this.distanceTraveled = 0;
        this.timeAlive = 0;
        this.collisionPenalty = 0;
        this.laneKeepingScore = 0;
        this.lastY = y;

        this.useBrain = controlType == "AI";

        if (controlType != "DUMMY") {
            this.sensor = new Sensor(this);
            // Enhanced network architecture
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 8, 6, 4] // Added more layers
            );
        }

        this.controls = new Controls(controlType);
        this.polygon = this.#createPolygon();
    }

    update(roadBorders, traffic) {
        if (!this.damaged) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
            
            // Update fitness metrics
            this.#updateFitness(roadBorders);
        }

        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            if (this.useBrain) {
                // Use sigmoid outputs with threshold
                this.controls.forward = outputs[0] > 0.5;
                this.controls.left = outputs[1] > 0.5;
                this.controls.right = outputs[2] > 0.5;
                this.controls.reverse = outputs[3] > 0.5;
            }
        }
    }
    
    // Enhanced fitness calculation
    #updateFitness(roadBorders) {
        this.timeAlive++;
        
        // Distance reward
        const distanceThisFrame = Math.abs(this.y - this.lastY);
        this.distanceTraveled += distanceThisFrame;
        this.lastY = this.y;
        
        // Lane keeping reward (closer to center = better)
        const roadCenter = roadBorders[0][0].x + (roadBorders[1][0].x - roadBorders[0][0].x) / 2;
        const distanceFromCenter = Math.abs(this.x - roadCenter);
        const maxRoadWidth = Math.abs(roadBorders[1][0].x - roadBorders[0][0].x);
        this.laneKeepingScore += (1 - distanceFromCenter / maxRoadWidth) * 0.1;
        
        // Speed reward (encourage consistent speed)
        const speedReward = Math.min(this.speed / this.maxSpeed, 1) * 0.05;
        
        // Calculate total fitness
        this.fitness = this.distanceTraveled * 0.1 + 
                      this.laneKeepingScore + 
                      speedReward * this.timeAlive - 
                      this.collisionPenalty;
    }

    #assessDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                this.collisionPenalty += 1000; // Heavy penalty for collision
                return true;
            }
        }
        for (let i = 0; i < traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)) {
                this.collisionPenalty += 500; // Penalty for hitting traffic
                return true;
            }
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed = -this.reversespeed;
        }

        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        if (this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (this.controls.left) {
                this.angle += 0.03 * flip;
            }
            if (this.controls.right) {
                this.angle -= 0.03 * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx, color, drawSensor) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        if (this.damaged) {
            ctx.globalAlpha = 0.5;
        }

        ctx.drawImage(
            carImage,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        ctx.restore();

        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
}
