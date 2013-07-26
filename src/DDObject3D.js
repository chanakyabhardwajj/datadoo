(function(DataDoo) {

    function DDObject3D() {
        this.matrixAutoUpdate = false;
        this.position = new DataDoo.RVector3(this);
        this.dependants = [];
        this.dependencies = [];
    }
    DDObject3D.prototype = Object.create(THREE.Object3D.prototype);
    DataDoo.DDObject3D = DDObject3D;

    DDObject3D.prototype.addDependency = function(object) {
        this.dependants.push(object);
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
            this.position.copy(finalPos);
        }

        // update world this object's world matrix
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
