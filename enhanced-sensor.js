class EnhancedSensor {
    constructor(car) {
        this.car = car;
        this.rayCount = 7; // Increased for better perception
        this.rayLength = 200; // Increased range
        this.raySpread = Math.PI * 0.75; // Wider spread
        this.rays = [];
        this.readings = [];
        
        // Additional sensors for better awareness
        this.sideRayLength = 100;
        this.rearRayLength = 80;
    }

    update(roadBorders, traffic) {
        this.castRays();
        this.readings = [];
        
        // Main forward sensors
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.getReading(this.rays[i], roadBorders, traffic)
            );
        }
        
        // Add side sensors
        this.addSideSensors(roadBorders, traffic);
        
        // Add rear sensor
        this.addRearSensor(roadBorders, traffic);
    }

    addSideSensors(roadBorders, traffic) {
        // Left side sensor
        const leftRay = this.createSideRay(-Math.PI / 2);
        this.readings.push(this.getReading(leftRay, roadBorders, traffic));
        
        // Right side sensor
        const rightRay = this.createSideRay(Math.PI / 2);
        this.readings.push(this.getReading(rightRay, roadBorders, traffic));
    }
    
    addRearSensor(roadBorders, traffic) {
        const rearRay = this.createRearRay();
        this.readings.push(this.getReading(rearRay, roadBorders, traffic));
    }
    
    createSideRay(angleOffset) {
        const rayAngle = this.car.angle + angleOffset;
        const start = { x: this.car.x, y: this.car.y };
        const end = {
            x: this.car.x - Math.sin(rayAngle) * this.sideRayLength,
            y: this.car.y - Math.cos(rayAngle) * this.sideRayLength
        };
        return [start, end];
    }
    
    createRearRay() {
        const rayAngle = this.car.angle + Math.PI;
        const start = { x: this.car.x, y: this.car.y };
        const end = {
            x: this.car.x - Math.sin(rayAngle) * this.rearRayLength,
            y: this.car.y - Math.cos(rayAngle) * this.rearRayLength
        };
        return [start, end];
    }

    getReading(ray, roadBorders, traffic) {
        let touches = [];

        // Check road borders
        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0], ray[1],
                roadBorders[i][0], roadBorders[i][1]
            );
            if (touch) {
                touches.push(touch);
            }
        }

        // Check traffic
        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++) {
                const value = getIntersection(
                    ray[0], ray[1],
                    poly[j], poly[(j + 1) % poly.length]
                );
                if (value) {
                    touches.push(value);
                }
            }
        }

        if (touches.length === 0) {
            return null;
        } else {
            const offsets = touches.map(e => e.offset);
            const minOffset = Math.min(...offsets);
            return touches.find(e => e.offset === minOffset);
        }
    }

    castRays() {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(
                this.raySpread / 2,
                -this.raySpread / 2,
                this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)
            ) + this.car.angle;

            const start = { x: this.car.x, y: this.car.y };
            const end = {
                x: this.car.x - Math.sin(rayAngle) * this.rayLength,
                y: this.car.y - Math.cos(rayAngle) * this.rayLength
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        // Draw main rays
        for (let i = 0; i < this.rayCount; i++) {
            this.drawRay(ctx, this.rays[i], this.readings[i], '#ffff00', '#ff0000');
        }
        
        // Draw side rays (if they exist)
        if (this.readings.length > this.rayCount) {
            const leftReading = this.readings[this.rayCount];
            const rightReading = this.readings[this.rayCount + 1];
            const rearReading = this.readings[this.rayCount + 2];
            
            if (leftReading) {
                const leftRay = this.createSideRay(-Math.PI / 2);
                this.drawRay(ctx, leftRay, leftReading, '#00ff88', '#ff4444');
            }
            
            if (rightReading) {
                const rightRay = this.createSideRay(Math.PI / 2);
                this.drawRay(ctx, rightRay, rightReading, '#00ff88', '#ff4444');
            }
            
            if (rearReading) {
                const rearRay = this.createRearRay();
                this.drawRay(ctx, rearRay, rearReading, '#00ccff', '#ff8800');
            }
        }
    }
    
    drawRay(ctx, ray, reading, activeColor, inactiveColor) {
        let end = ray[1];
        if (reading) {
            end = reading;
        }

        // Active part of ray
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = activeColor;
        ctx.moveTo(ray[0].x, ray[0].y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Inactive part of ray
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = inactiveColor;
        ctx.moveTo(ray[1].x, ray[1].y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }
}