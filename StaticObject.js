class Circle {
    constructor(center,r){
        this.center = center;
        this.r = r;
    }

    isInside(position){
        var distance = vec3.distance(this.center, position);
        return distance<this.r;
    }
}