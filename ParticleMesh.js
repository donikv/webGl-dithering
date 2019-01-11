class ParticleMesh {
    constructor (file) {
        var obj = loadObjFromFile(file);
        var i = 0;
        this.vertices_ = obj.vertices.map(vert => {
            i++;
            return new Particle(vert, 1.0, vert[1] > 1.99);
        });

        this.indices = obj.indices;
        this.bonds = [];
        var addedBonds = [];

        for(var i = 0; i < obj.indices.length; i+= 3) {
            this.addToBonds(addedBonds, i, i+1, obj);
            this.addToBonds(addedBonds, i+1, i+2, obj);
            this.addToBonds(addedBonds, i+2,i, obj);
            // this.bonds.push(new Bond(this.vertices_, obj.indices[i], obj.indices[i+1]));
            // this.bonds.push(new Bond(this.vertices_, obj.indices[i+1], obj.indices[i+2]));
            // this.bonds.push(new Bond(this.vertices_, obj.indices[i+2], obj.indices[i]));
        }
        
        this.rotation = {x:0,y:0,z:0};
        this.rotation.x = 0.0;
        this.rotation.y = 0.0;
        this.rotation.z = 0.0;

        this.translation = {x:0,y:0,z:0};
        this.translation.x = 0.0;
        this.translation.y = 0.0;
        this.translation.z = 0.0;
        
        this.scale = {x:1,y:1,z:1};

        this.groupedVerticesCached = this.groupedVertices();
        this.cachedVertices = this.vertices;
        this.sides = this.calculateSides();
        this.normales = this.calculateNormales();
    }

    addToBonds(addedIndices, i1, i2, obj) {
        var shouldReturn = false;
        addedIndices.forEach(indices => {
            if((indices.first == i1 && indices.second == i2) || (indices.first == i1 && indices.second == i2)) {
                shouldReturn = true;
                return;
            }
        });
        if(shouldReturn) return;

        this.bonds.push(new Bond(this.vertices_, obj.indices[i1], obj.indices[i2]));
        addedIndices.push({
            first: i1,
            second: i2
        });
    }

    calculateSides() {
        var sides = [];
        var polygonVertices = this.groupedVerticesCached;

        for(var i =0; i < polygonVertices.length; i+=3){
            var x1 = polygonVertices[i][0]; var x2 = polygonVertices[i+1][0]; var x3 = polygonVertices[i+2][0];
            var y1 = polygonVertices[i][1]; var y2 = polygonVertices[i+1][1]; var y3 = polygonVertices[i+2][1];
            var z1 = polygonVertices[i][2]; var z2 = polygonVertices[i+1][2]; var z3 = polygonVertices[i+2][2];

            var A = (y2-y1)*(z3-z1) - (z2-z1)*(y3-y1); 
            var B = -(x2-x1)*(z3-z1) + (z2-z1)*(x3-x1);
            var C = (x2-x1)*(y3-y1) - (y2-y1)*(x3-x1);
            var D = -x1*A - y1*B - z1*C;

            sides.push(vec4.fromValues(A,B,C,D));
        }

        return sides;
    }

    calculateCreases() {
        var polygonVertices = this.groupedVerticesCached;
        var sides = this.sides;
        var creases = [];
        
        for(var i =0; i < sides.length-2; i++) {
            for(var j =i+1; j<sides.length-1; j++) {
                var s1 = sides[i]; var s2 = sides[j];
                var cos = vec3.dot(vec3.normalize(s1,s1), vec3.normalize(s2,s2))
                if(Math.abs(cos) > 0.5) {
                    continue;
                }
                var count = 0;
                var index = -1;
                for(var k1 = 0; k1<3; k1++){
                    for(var k2 = 0; k2<3; k2++){
                        if(vec4.equals(polygonVertices[3*i+k1], polygonVertices[3*j+k2]) && index != this.indices[3*i+k1]) {
                            index = this.indices[3*i+k1];
                            creases.push(index);
                            count++;
                        }
                        if(count == 2) { break; }
                    }
                    if (count == 2) break;
                }
                if (count < 2) {
                     creases.pop(); }
            }
        }

        return creases;
    }

    calculateNormales(vertices){
        var polygonVertices = this.groupedVerticesCached;
        var sides = this.sides;
        var normInVert = [];

        this.vertices_.forEach(v => {
            var n = 0;
            var nx = 0; var ny = 0; var nz = 0;
            for(var i =0; i < polygonVertices.length; i++) {
                var pv = polygonVertices[i]
                if(vec4.equals(v.positionVec4,pv)) {
                    nx += sides[Math.floor(i/3)][0]; ny += sides[Math.floor(i/3)][1]; nz += sides[Math.floor(i/3)][2]; n++;
                }
            }
            var norm = n === 0 ? vec3.create() : vec3.fromValues(nx,ny,nz);
            vec3.normalize(norm,norm);
            normInVert.push(norm); 
        });
        
        return normInVert.flatMap(v => [v[0], v[1], v[2]]);
    }

    groupedVertices() {
        const model = mat4.create();
        mat4.rotate(model,model, this.rotation.x ,[1, 0, 0]);
        mat4.rotate(model,model, this.rotation.y ,[0, 1, 0]);
        mat4.rotate(model,model, this.rotation.z ,[0, 0, 1]);
        mat4.translate(model,model,[this.translation.x, this.translation.y, this.translation.z]);
        mat4.scale(model,model,[this.scale.x, this.scale.y, this.scale.z]);
        var verts = []
        this.indices.forEach(i => {
            var vert = vec4.create();
            vec4.transformMat4(vert, this.vertices_[i].positionVec4, model);
            verts.push(vert);
        });

        return verts;
    }

    get vertices() {
        if (typeof this.cachedVertices === "undefined") {
            this.cachedVertices = this.vertices_.flatMap(v => [v.position[0], v.position[1], v.position[2]]);
        }
        return this.cachedVertices;
    }

    reloadCache() {
        this.groupedVerticesCached = this.groupedVertices();
        this.cachedVertices = this.vertices_.flatMap(v => [v.position[0], v.position[1], v.position[2]]);
        this.sides = this.calculateSides();
        this.normales = this.calculateNormales();
        // this.creases = this.calculateCreases();
    }

    set vertices(vertices) {
        this.vertices = vertices.map(vert => {
            return vec4.fromValues(vert[0], vert[1], vert[2], vert[3], 1.0);
        });
    }
}