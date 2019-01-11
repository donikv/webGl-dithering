const breakPoint = 50.0;

class Particle {
    constructor(position, mass = 0.5, isFixed = false) {
        this.position = position;
        this.velocity = vec3.create();
        this.acceleration = vec3.create();
        this.mass = mass
        this.isFixed = isFixed;
        this.force = vec3.fromValues(0.0,0.0,0.0);
    }

    accumulateForce(force) {
        vec3.add(this.force, this.force, force);
    }

    applyForce(dt){
        if(this.isFixed) return;
        for(var i = 0; i<3; i++){
            if(this.force[i] > breakPoint) { this.force[i] = breakPoint; }
            else if(this.force[i] < -breakPoint) { this.force[i] = -breakPoint; }
        }
        vec3.add(this.force, this.force, vec3.fromValues(0.0,-1.0,0.0));
        vec3.add(this.velocity, this.velocity, vec3.scale(vec3.create(), this.force, dt/this.mass));
        vec3.add(this.position, this.position, vec3.scale(vec3.create(), this.velocity, dt));
        this.force = vec3.fromValues(0.0,0.0,0.0);
    }

    get positionVec4() {
        return vec4.fromValues(this.position[0],this.position[1],this.position[2],1.0);
    }
}

class Bond {
    constructor(particles, index1, index2, k = 30.0, b = 4.2) {
        var particle1 = particles[index1];
        var particle2 = particles[index2];
        this.particle1 = particle1;
        this.particle2 = particle2;
        this.k = k;
        this.b = b;
        this.e = vec3.create();
        vec3.subtract(this.e, particle2.position, particle1.position);
        this.l0 = vec3.length(this.e);
        vec3.normalize(this.e, this.e);
    }

    calculateForceOnParticles() {
        var e2 = vec3.create();
        vec3.subtract(e2, this.particle1.position, this.particle2.position);
        var l = vec3.length(e2);
        vec3.normalize(e2, e2);

        var forceSpring = vec3.scale(vec3.create(), e2, -this.k*(l-this.l0));
        var dv = vec3.create();
        var resistance = vec3.scale(vec3.create(), vec3.subtract(dv, this.particle2.velocity, this.particle1.velocity), this.b);
        var force = vec3.create();
        vec3.add(force, forceSpring, resistance);

        this.particle1.accumulateForce(force);
        // for(var i = 0; i<3; i++){
        //     if(Math.abs(this.particle1.force[i]) > 50) {
        //         this.k = 0;
        //         this.b = 0;
        //     }
        // }
        this.particle2.accumulateForce(vec3.negate(force, force));
    }
}