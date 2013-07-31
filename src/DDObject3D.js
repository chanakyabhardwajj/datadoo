(function(DataDoo) {

    function DDObject3D() {
        THREE.Object3D.call(this);
        this.matrixAutoUpdate = false;
        this.position = new DataDoo.RVector3(this);
        this.rVectors = [];
        this.dependants = [];
        this.dependencies = [];
    }
    DDObject3D.prototype = Object.create(THREE.Object3D.prototype);
    DataDoo.DDObject3D = DDObject3D;

    DDObject3D.prototype.addDependant = function(object) {
        if(!(object instanceof DDObject3D)) {
            throw new Error("Cannot set dependency on non-DDObject3D objects");
        }
        this.dependants.push(object);
    };

    DDObject3D.prototype.addDependancy = function() {
        var list = _.flatten(arguments);
        _.each(list, function(object) {
            if(object instanceof DDObject3D) {
                this.dependencies.push(object);
            }
        }, this);
    };

    DDObject3D.prototype.makeRVector = function(point) {
        if(point instanceof DataDoo.DDObject3D) {
            var vector = new DataDoo.RVector3(this);
            vector.setRelative(point);
            this.rVectors.push(vector);
            return vector;
        } else if(point instanceof THREE.Vector3){
            return point;
        }
        throw new Error("DDObject3D : makeRVector cannot make vector from argument");
    };

    DDObject3D.prototype.makeRVectors = function() {
        var points = _.flatten(arguments);
        return _.map(points, this.makeRVector, this);
    };

    DDObject3D.prototype._resolvePosition = function(position, parent, axesConf) {
        if(position.isSetOnAxes) {
            _.each(["x", "y", "z"], function(axis) {
                var axisConf = axesConf[axis];
                if(axisConf.type == DataDoo.NUMBER) {
                    position[axis] = position["r"+axis] * axisConf.notchSpacing;
                }
                if(axisConf.type == DataDoo.COLUMNVALUE) {
                    position[axis] = axisConf.posMap[position["r"+axis]];
                }
            });
        }
        if(position.relative) {
            var target = position.target;
            var vector = target.position.clone();
            target.parent.localToWorld(vector);
            parent.worldToLocal(vector);
            vector.x += position.rx;
            vector.y += position.ry;
            vector.z += position.rz;
            position.copy(vector);
        }
    };

    DDObject3D.prototype.update = function(axesConf) {
        if(!this.matrixWorldNeedsUpdate) {
            return;
        }

        // check if all of this object's dependencies have updated
        var check = [this.parent.matrixWorldNeedsUpdate];
        if(this.position.relative) {
            check.push(this.position.target.matrixWorldNeedsUpdate);
        }
        _.each(this.dependencies, function(dependency) {
            check.push(dependency.matrixWorldNeedsUpdate);
        });
        if(!_.every(check, function(v) {return !v;})) {
            // all of the dependencies' matrixWorldNeedsUpdate are not false
            // so return for now.
            return;
        }

        //resolve own position
        this._resolvePosition(this.position, this.parent, axesConf);

        // update this object's world matrix
        this.updateMatrix();
        if(this.parent === undefined) {
            this.matrixWorld.copy(this.matrix);
        } else {
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
        this.matrixWorldNeedsUpdate = false;

        // resolve rvectors
        _.each(this.rVectors, function(vector) {
            this._resolvePosition(vector, this, axesConf);
        }, this);

        // update the geometry
        if(this.updateGeometry) {
            this.updateGeometry();
        }

        // call update on all dependants
        _.each(this.dependants, function(object) {
            object.update(axesConf);
        }, this);

        // call update or updateMatrixWorld on all children
        _.each(this.children, function(child) {
            if(child instanceof DDObject3D) {
                child.update(axesConf);
            } else {
                child.updateMatrixWorld(true);
            }
        });
    };

})(window.DataDoo);
