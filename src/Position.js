(function(DataDoo) {
    /**
     * Position Base Class
     */
    function Position() {
        this.resolvedX = 0;
        this.resolvedY = 0;
        this.resolvedZ = 0;
    }
    Position.prototype.applyToVector = function(vec) {
        vec.set(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    Position.prototype.toVector = function() {
        return new THREE.Vector3(this.resolvedX, this.resolvedY, this.resolvedZ);
    };

    /**
     * Absolute position. This position is used as is,
     * no resolving is done
     */
    function AbsolutePosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = x;
    }
    AbsolutePosition.prototype = Object.create(Position.prototype);
    DataDoo.AbsolutePosition = AbsolutePosition;

    /**
     * CoSy position. This position is resolved on a value
     * based coordinate system
     */
    function CoSyPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = x;
    }
    CoSyPosition.prototype = Object.create(Position.prototype);
    DataDoo.CoSyPosition = CoSyPosition;

    /**
     * Relative Position. This position is resolved relative
     * to other position objects.
     */
    function RelativePosition(relatedPos, xoff, yoff, zoff) {
        this.relatedPos = relatedPos;
        this.xoff = xoff || 0;
        this.yoff = yoff || 0;
        this.zoff = zoff || 0;
    }
    RelativePosition.prototype = Object.create(Position.prototype);
    DataDoo.RelativePosition = RelativePosition;

})(window.DataDoo);
