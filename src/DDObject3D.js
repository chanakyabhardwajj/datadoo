(function(DataDoo) {
    /**
     * Parent Object for DataDoo scene items
     */
    function DDObject3D() {
        THREE.Object3D.apply(this);
    }
    DDObject3D.prototype = Object.create(THREE.Object3D.prototype);
    DataDoo.DDObject3D = DDObject3D;

    /**
     * Resolves the position of this object
     */
    DDObject3D.prototype.resolve = function(axesConf) {
        // resolve position if its instance of RVector3
        if(this.position instanceof DataDoo.RVector3) {
            _.each(["x", "y", "z"], function(axis) {
                var axisConf = axesConf[axis];
                if(axisConf.type == DataDoo.NUMBER) {
                    this.position[axis] = this.position["r"+axis];
                }
                if(axisConf.type == DataDoo.COLUMNVALUE) {
                    this.position[axis] = this.position[axisConf.posMap["r"+axis]];
                }
            }, this);
        }

        // fire callbacks if any
        if(this._onResolveCallbacks) {
            _.each(this._onResolveCallbacks, function(cb) {
                cb.call(this);
            }, this);
        }
    };

    /**
     * Binds a callback that will be called when this object's
     * position is resolved.
     */
    DDObject3D.prototype.bindOnResolve = function(callback) {
        if(!this._onResolveCallbacks) {
            this._onResolveCallbacks = [];
        }
        this._onResolveCallbacks.push(callback);
    };

    /**
     * Helper function that returns either a vector
     * or an anchor to another DDObject3D, depending
     * on the parameter type
     */
    DDObject3D.prototype.vectorOrAnchor = function(vec) {
        if(vec instanceof DDObject3D) {
            return new DataDoo.AnchoredVector3(this, vec);
        } else {
            return vec;
        }
    };


})(window.DataDoo);
