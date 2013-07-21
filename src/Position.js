(function(DataDoo) {
    /**
     * Position Base Class
     */
    function Position(x, y, z, type, relatedPos) {
        this.resolvedX = 0;
        this.resolvedY = 0;
        this.resolvedZ = 0;
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.type = type || DataDoo.ABSOLUTE;
        this.relatedPos = (type == DataDoo.RELATIVE?relatedPos:null);
    }
    Position.prototype.setType = function(type) {
        this.type = type;
    };
    Position.prototype.set = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
    Position.prototype.setX = function(x) {
        this.x = x;
    };
    Position.prototype.setY = function(y) {
        this.x = y;
    };
    Position.prototype.setZ = function(z) {
        this.x = z;
    };
    Position.prototype.relative = function(x, y, z) {
        return new Position(x, y, z, DataDoo.RELATIVE, this);
    };
    Position.prototype.applyToVector = function(vec) {
        vec.set(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    Position.prototype.toVector = function() {
        return new THREE.Vector3(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    DataDoo.Position = Position;
})(window.DataDoo);
