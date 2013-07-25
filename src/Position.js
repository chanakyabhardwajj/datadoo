(function(DataDoo) {
    /**
     * DataDoo Resolvable vector
     */
    function RVector3(rx, ry, rz) {
        THREE.Vector3.call(this);
        this.rx = rx || 0;
        this.ry = ry || 0;
        this.rz = rz || 0;
    }
    RVector3.prototype = Object.create(THREE.Vector3.prototype);
    DataDoo.RVector3 = RVector3;

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
        this.srcVector = srcVector || srcParent.position;
        this.parent = parent;
        this.srcParent = srcParent;

        var parentResolved = false;
        var srcParentResolved = false;
        var self = this;
        srcParent.bindOnResolve(function() {
            srcParentResolved = true;
            if(srcParentResolved && parentResolved) {
                self._resolve();
                srcParentResolved = false;
                parentResolved = false;
            }
        });
        parent.bindOnResolve(function() {
            parentResolved = true;
            if(srcParentResolved && parentResolved) {
                self._resolve();
                srcParentResolved = false;
                parentResolved = false;
            }
        });
    }
    DataDoo.AnchoredVector3 = AnchoredVector3;
    AnchoredVector3.prototype = Object.create(THREE.Vector3.prototype);
    AnchoredVector3.prototype._resolve = function() {
        var obj;

        this.copy(this.srcVector);

        obj = this.srcParent;
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
