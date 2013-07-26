(function(DataDoo) {
    /**
     * DataDoo Resolvable vector
     */
    function RVector3(parent) {
        THREE.Vector3.call(this);
        this.parent = parent;
        this.setOnAxes = false;
        this.relative = false;
    }
    DataDoo.RVector3 = RVector3;
    RVector3.prototype = Object.create(THREE.Vector3.prototype);

    RVector3.prototype.set = function(x, y, z) {
        this.setOnAxes = true;
        this.relative = false;
        this.x = x;
        this.y = y;
        this.z = z;
        this.target = undefined;
    };

    RVector3.prototype.setOnAxes = function(rx, ry, rz){
        this.setOnAxes = true;
        this.relative = false;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
    };

    RVector3.prototype.setRelative = function(target, rx, ry, rz) {
        this.relative = true;
        this.setOnAxes = false;
        this.rx = rx || 0;
        this.ry = ry || 0;
        this.rz = rz || 0;
        this.target = target;
        target.addDependant(this.parent);
        this.parent.addDependancy(target);
    };

    /**
     * Anchored vector.
     * These are vectors that can be anchored to
     * another DDObject3D. The position will
     * always resolve to the correct position irrespective
     * of the object hierarchy
     * parent - The parent DDObject3D. The final position will be
     *          relative to this object.
     * srcParent - The DDObject3D to which the position should be
     *             anchored. The source vector is relative to this
     *             object.
     * srcVector - The vector to be translated, this vector is 
     *             relative to srcParent. Defaults to srcParent's
     *             position.
     */
    function AnchoredVector3(parent, srcParent, srcVector) {
        THREE.Vector3.call(this);
        this.parent = parent;
        this.srcVector = srcVector;
        this.srcParent = srcParent;

        var self = this;
        DataDoo.utils.onResolveAll(this.parent, this.srcParent, function() {
            self._resolve();
        });
    }
    DataDoo.AnchoredVector3 = AnchoredVector3;
    AnchoredVector3.prototype = Object.create(THREE.Vector3.prototype);
    AnchoredVector3.prototype._resolve = function() {
        var obj;

        if(this.srcVector) {
            this.copy(this.srcVector);
            obj = this.srcParent;
        } else {
            this.copy(this.srcParent.position);
            obj = this.srcParent.parent;
        }

        while(obj) {
            this.add(obj.position);
            obj = obj.parent;
        }

        obj = this.parent;
        while(obj) {
            this.sub(obj.position);
            obj = obj.parent;
        }
    };
})(window.DataDoo);
