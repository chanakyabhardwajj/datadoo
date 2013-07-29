(function(DataDoo) {
    /**
     * DataDoo Resolvable vector
     */
    function RVector3(parent) {
        THREE.Vector3.call(this);
        this.parent = parent;
        this.isSetOnAxes = false;
        this.relative = false;
    }
    DataDoo.RVector3 = RVector3;
    RVector3.prototype = Object.create(THREE.Vector3.prototype);

    RVector3.prototype.set = function(x, y, z) {
        this.isSetOnAxes = false;
        this.relative = false;
        this.x = x;
        this.y = y;
        this.z = z;
        this.target = undefined;
    };

    RVector3.prototype.setOnAxes = function(rx, ry, rz){
        this.isSetOnAxes = true;
        this.relative = false;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
    };

    RVector3.prototype.setRelative = function(target, rx, ry, rz) {
        this.relative = true;
        this.isSetOnAxes = false;
        this.rx = rx || 0;
        this.ry = ry || 0;
        this.rz = rz || 0;
        this.target = target;
        target.addDependant(this.parent);
        this.parent.addDependancy(target);
    };

})(window.DataDoo);
