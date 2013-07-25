(function(DataDoo) {
    function DDObject3D() {
        THREE.Object3D.apply(this);
    }

    DDObject3D.prototype = Object.create(THREE.Object3D.prototype);
    DataDoo.DDObject3D = DDObject3D;

    DDObject3D.prototype.resolve = function(axesConf) {
        // resolve position if its instance of RVector3
        if(this.position instanceof DataDoo.RVector3) {
            _.each(["x", "y", "z"], function(axis) {
                var axisConf = axesConf[axis];
                if(axis.type == DataDoo.NUMBER) {
                    this.position["r"+axis] = this.position[axis];
                }
                if(axis.type == DataDoo.COLUMNVALUE) {
                    this.position["r"+axis] = this.position[axisConf.posMap[axis]];
                }
            });
        }

        if(this._onResolveCallbacks) {
            _.each(this._onResolveCallbacks, function(cb) {
                cb.call(this);
            }, this);
        }
    };

    DDObject3D.bindOnResolve = function(callback) {
        if(!this._onResolveCallbacks) {
            this._onResolveCallbacks = [];
        }
        this._onResolveCallbacks.push(callback);
    }

    DDObject3D.prototype.vectorOrAnchor = function(vec) {
        if(vec instanceof DDObject3D) {
            return new DataDoo.AnchoredVector3(this, vec);
        } else {
            return vec;
        }
    }


})(window.DataDoo);
