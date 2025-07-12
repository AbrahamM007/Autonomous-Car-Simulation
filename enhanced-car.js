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
        
        // Enhanced tracking
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
        
        // Visual effects
        this.trailPoints = [];
        this.glowIntensity = 0;
        this.color = this.generateColor();
        
        this.useBrain = controlType === "AI";

        if (controlType !== "DUMMY") {
            this.sensor = new EnhancedSensor(this);
            this.brain = new EnhancedNeuralNetwork([10, 12, 8, 4]); // Enhanced architecture
        }

        this.controls = new Controls(controlType);
        this.polygon = this.createPolygon();
    }
    
    generateColor() {
        const colors = [
            '#00ff88', '#00ccff', '#ff6b6b', '#ffd93d', 
            '#6bcf7f', '#4ecdc4', '#45b7d1', '#96ceb4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(roadBorders, traffic, particleSystem) {
        if (!this.damaged) {
            this.move();
            this.polygon = this.createPolygon();
            this.damaged = this.assessDamage(roadBorders, traffic);
            
            if (this.damaged && particleSystem) {
                particleSystem.addExplosion(this.x, this.y, '#ff4444');
            }
            
            this.updateMetrics(roadBorders);
            this.updateTrail();
            this.updateGlow();
        }

        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);
            const inputs = this.prepareSensorInputs();
            const outputs = EnhancedNeuralNetwork.feedForward(inputs, this.brain);

            if (this.useBrain) {
                this.controls.forward = outputs[0] > 0.5;
                this.controls.left = outputs[1] > 0.5;
                this.controls.right = outputs[2] > 0.5;
                this.controls.reverse = outputs[3] > 0.5;
            }
        }
    }
    
    prepareSensorInputs() {
        const sensorInputs = this.sensor.readings.map(s => s == null ? 0 : 1 - s.offset);
        
        // Add additional inputs for better decision making
        const additionalInputs = [
            this.speed / this.maxSpeed, // Normalized speed
            Math.sin(this.angle), // Angle components
            Math.cos(this.angle)
        ];
        
        return [...sensorInputs, ...additionalInputs];
    }
    
    updateMetrics(roadBorders) {
        this.timeAlive++;
        
        // Distance tracking
        const distanceThisFrame = Math.abs(this.y - this.lastY);
        this.distanceTraveled += distanceThisFrame;
        this.lastY = this.y;
        
        // Lane keeping
        const roadCenter = roadBorders[0][0].x + (roadBorders[1][0].x - roadBorders[0][0].x) / 2;
        const distanceFromCenter = Math.abs(this.x - roadCenter);
        const maxRoadWidth = Math.abs(roadBorders[1][0].x - roadBorders[0][0].x);
        this.laneKeepingScore += (1 - distanceFromCenter / maxRoadWidth) * 0.1;
        
        // Smooth driving (less steering changes)
        const angleDiff = Math.abs(this.angle - this.lastAngle);
        this.smoothDrivingScore += Math.max(0, 0.1 - angleDiff);
        this.lastAngle = this.angle;
        
        // Speed consistency
        this.speedHistory.push(this.speed);
        if (this.speedHistory.length > 60) { // Keep last 60 frames
            this.speedHistory.shift();
        }
        
        // Checkpoint system
        if (this.distanceTraveled > this.checkpointsReached * 100) {
            this.checkpointsReached++;
            this.glowIntensity = 1.0; // Trigger glow effect
        }
    }
    
    updateTrail() {
        // Add current position to trail
        this.trailPoints.push({ x: this.x, y: this.y, life: 30 });
        
        // Update trail points
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].life--;
            if (this.trailPoints[i].life <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
        
        // Limit trail length
        while (this.trailPoints.length > 20) {
            this.trailPoints.shift();
        }
    }
    
    updateGlow() {
        if (this.glowIntensity > 0) {
            this.glowIntensity -= 0.02;
        }
    }

    assessDamage(roadBorders, traffic) {
        // Road border collision
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                this.collisionPenalty += 1000;
                return true;
            }
        }
        
        // Traffic collision
        for (let i = 0; i < traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)) {
                this.collisionPenalty += 500;
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

    draw(ctx, drawSensor = false, particleSystem = null) {
        // Draw trail
        this.drawTrail(ctx);
        
        ctx.save();
        
        // Apply glow effect
        if (this.glowIntensity > 0) {
            ctx.shadowBlur = 20 * this.glowIntensity;
            ctx.shadowColor = this.color;
        }
        
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
        
        // Draw direction indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            this.x - Math.sin(this.angle) * this.height * 0.3,
            this.y - Math.cos(this.angle) * this.height * 0.3,
            3, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.restore();

        // Draw sensor
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
        
        // Add sparkle effects for high-performing cars
        if (particleSystem && this.checkpointsReached > 3 && Math.random() < 0.1) {
            particleSystem.addSparkle(this.x, this.y, this.color);
        }
    }
    
    drawTrail(ctx) {
        if (this.trailPoints.length < 2) return;
        
        ctx.save();
        for (let i = 1; i < this.trailPoints.length; i++) {
            const point = this.trailPoints[i];
            const alpha = point.life / 30;
            
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.trailPoints[i-1].x, this.trailPoints[i-1].y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}