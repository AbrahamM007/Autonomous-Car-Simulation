class EnhancedCar {
    constructor(x, y, width, height, controlType, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.acceleration = 0.2;
        this.reverseSpeed = 1.5;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;
        
        // Enhanced tracking for better fitness calculation
        this.fitness = 0;
        this.distanceTraveled = 0;
        this.timeAlive = 0;
        this.collisionPenalty = 0;
        this.laneKeepingScore = 0;
        this.smoothDrivingScore = 0;
        this.checkpointsReached = 0;
        this.lastY = y;
        this.lastAngle = 0;
        this.speedHistory = [];
        
        // Visual properties
        this.color = this.generateColor();
        
        this.useBrain = controlType === "AI";

        if (controlType !== "DUMMY") {
            this.sensor = new EnhancedSensor(this);
            // Simpler, more effective network architecture
            this.brain = new EnhancedNeuralNetwork([this.sensor.rayCount, 6, 4]);
        }

        this.controls = new Controls(controlType);
        this.polygon = this.createPolygon();
    }
    
    generateColor() {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(roadBorders, traffic, particleSystem) {
        if (!this.damaged) {
            this.move();
            this.polygon = this.createPolygon();
            this.damaged = this.assessDamage(roadBorders, traffic);
            
            this.updateMetrics(roadBorders);
        }

        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);
            const inputs = this.prepareSensorInputs();
            const outputs = EnhancedNeuralNetwork.feedForward(inputs, this.brain);

            if (this.useBrain) {
                // Use threshold for decision making
                this.controls.forward = outputs[0] > 0.1;
                this.controls.left = outputs[1] > 0.1;
                this.controls.right = outputs[2] > 0.1;
                this.controls.reverse = outputs[3] > 0.1;
            }
        }
    }
    
    prepareSensorInputs() {
        // Normalize sensor inputs between 0 and 1
        return this.sensor.readings.map(s => s == null ? 0 : 1 - s.offset);
    }
    
    updateMetrics(roadBorders) {
        this.timeAlive++;
        
        // Track distance traveled
        const distanceThisFrame = Math.abs(this.y - this.lastY);
        this.distanceTraveled += distanceThisFrame;
        this.lastY = this.y;
        
        // Lane keeping score
        const roadCenter = roadBorders[0][0].x + (roadBorders[1][0].x - roadBorders[0][0].x) / 2;
        const distanceFromCenter = Math.abs(this.x - roadCenter);
        const maxRoadWidth = Math.abs(roadBorders[1][0].x - roadBorders[0][0].x);
        const laneKeepingThisFrame = Math.max(0, 1 - (distanceFromCenter / (maxRoadWidth / 2)));
        this.laneKeepingScore += laneKeepingThisFrame;
        
        // Smooth driving score (penalize erratic steering)
        const angleDiff = Math.abs(this.angle - this.lastAngle);
        this.smoothDrivingScore += Math.max(0, 0.1 - angleDiff * 10);
        this.lastAngle = this.angle;
        
        // Checkpoint system
        const checkpointDistance = 200;
        const expectedCheckpoints = Math.floor(this.distanceTraveled / checkpointDistance);
        if (expectedCheckpoints > this.checkpointsReached) {
            this.checkpointsReached = expectedCheckpoints;
        }
    }

    assessDamage(roadBorders, traffic) {
        // Check road border collision
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                this.collisionPenalty += 100;
                return true;
            }
        }
        
        // Check traffic collision
        for (let i = 0; i < traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)) {
                this.collisionPenalty += 50;
                return true;
            }
        }
        
        return false;
    }

    createPolygon() {
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

    move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed = -this.reverseSpeed;
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

        if (this.speed !== 0) {
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

    draw(ctx, drawSensor = false) {
        ctx.save();
        
        if (this.damaged) {
            ctx.globalAlpha = 0.3;
        }

        // Draw car body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw car outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Draw sensor
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }
}