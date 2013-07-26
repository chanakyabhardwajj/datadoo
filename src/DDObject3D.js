(function(DataDoo) {

    function DDObject3D() {
        THREE.Object3D.call(this);
        this.matrixAutoUpdate = false;
        this.position = new DataDoo.RVector3(this);
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

    DDObject3D.prototype.getVectors = function() {
        var points = _.flatten(arguments);
        return _.map(points, function(point) {
            if(point instanceof THREE.Object3D) {
                return point.position;
            } else if(point instanceof THREE.Vector3){
                return point;
            }
            throw new Error("DDObject3D : getVectors cannot find vector in argument");
        });
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

        //resolve the position
        if(this.position.setOnAxes) {
            _.each(["x", "y", "z"], function(axis) {
                var axisConf = axesConf[axis];
                if(axisConf.type == DataDoo.NUMBER) {
                    this.position[axis] = this.position["r"+axis];
                }
                if(axisConf.type == DataDoo.COLUMNVALUE) {
                    this.position[axis] = axisConf.posMap[this.position["r"+axis]];
                }
            }, this);
        }
        if(this.position.relative) {
            var target = this.position.target;
            var worldPos = target.parent.localToWorld(target.position);
            var finalPos = this.parent.worldToLocal(worldPos);
            finalPos.x += finalPos.rx;
            finalPos.y += finalPos.ry;
            finalPos.z += finalPos.rz;
            this.position.copy(finalPos);
        }

        // update the geometry
        if(this.updateGeometry) {
            this.updateGeometry();
        }

        // update this object's world matrix
        this.updateMatrix();
        if(this.parent === undefined) {
            this.matrixWorld.copy(this.matrix);
        } else {
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
        this.matrixWorldNeedsUpdate = false;


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
