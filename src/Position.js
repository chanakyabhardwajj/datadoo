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
    AnchoredVector3.prototype._resolve = function() {
        var obj;

        this.copy(this.srcVector);

        obj = this.srcParent;
        while(obj) {
            this.addSelf(obj.position);
            obj = obj.parent;
        }

        obj = this.parent;
        while(obj) {
            this.subSelf(obj.position);
            obj = obj.parent;
        }
    }
    AnchoredVector3.prototype = Object.create(THREE.Vector3.prototype);
})(window.DataDoo);
