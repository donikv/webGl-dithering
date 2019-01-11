class Mesh {
    constructor (file) {
        var obj = loadObjFromFile(file);
        this.vertices_ = obj.vertices.map(vert => {
            return vec4.fromValues(vert[0], vert[1], vert[2], 1.0);
        });
        
        this.indices = obj.indices;
        this.rotation_ = {x:0,y:0,z:0};
        this.rotation_.x = 0.0;
        this.rotation_.y = 0.0;
        this.rotation_.z = 0.0;

        this.translation_ = {x:0,y:0,z:0};
        this.translation_.x = 0.0;
        this.translation_.y = 0.0;
        this.translation_.z = 0.0;
        
        this.scale_ = {x:1,y:1,z:1};

        this.groupedVerticesCached = this.groupedVertices();
        this.cachedVertices = this.vertices;
        this.normales = this.calculateNormales();
    }
    calculateSides() {
        var sides = [];
        var polygonVertices = this.groupedVerticesCached;

        for(var i =0; i < polygonVertices.length; i+=3){
            var x1 = polygonVertices[i][0]; var x2 = polygonVertices[i+1][0]; var x3 = polygonVertices[i+2][0];
            var y1 = polygonVertices[i][1]; var y2 = polygonVertices[i+1][1]; var y3 = polygonVertices[i+2][1];
            var z1 = polygonVertices[i][2]; var z2 = polygonVertices[i+2][2]; var z3 = polygonVertices[i+2][2];

            var A = (y2-y1)*(z3-z1) - (z2-z1)*(y3-y1); 
            var B = -(x2-x1)*(z3-z1) + (z2-z1)*(x3-x1);
            var C = (x2-x1)*(y3-y1) - (y2-y1)*(x3-x1);
            var D = -x1*A - y1*B - z1*C;

            sides.push(vec4.fromValues(A,B,C,D));
        }

        return sides;
    }

    calculateNormales(vertices){
        var polygonVertices = this.groupedVerticesCached;
        var sides = this.calculateSides();
        var normInVert = [];

        this.vertices_.forEach(v => {
            var n = 0;
            var nx = 0; var ny = 0; var nz = 0;
            for(var i =0; i < polygonVertices.length; i++) {
                var pv = polygonVertices[i]
                if(vec4.equals(v,pv)) {
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
            vec4.transformMat4(vert, this.vertices_[i], model);
            verts.push(vert);
        });

        return verts;
    }

    get vertices() {
        if (typeof this.cachedVertices === "undefined") {
            this.cachedVertices = this.vertices_.flatMap(v => [v[0], v[1], v[2]]);
        }
        return this.cachedVertices;
    }

    reloadCache() {
        this.groupedVerticesCached = this.groupedVertices();
        this.cachedVertices = this.vertices_.flatMap(v => [v[0], v[1], v[2]]);
    }

    get translation() {
        return this.translation_;
    }
    get rotation() {
        return this.rotation_;
    }
    get scale() {
        return this.scale_;
    }

    set vertices(vertices) {
        this._vertices = vertices.map(vert => {
            return vec4.fromValues(vert[0], vert[1], vert[2], vert[3], 1.0);
        });
    }
    set translation(translation) {
        this.translation_ = translation;
        this.reloadCache();
    }
    set rotation(rotation) {
        this.rotation_ = rotation;
        this.reloadCache();
    }
    set scale(scale) {
        this.scale_ = scale;
        this.reloadCache();
    }
}