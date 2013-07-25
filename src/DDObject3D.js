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

        // resolve all children
        _.each(this.children, function(child) {
            if(child instanceof DDObject3D) {
                child.resolution(axesConf);
            }
        });
    };


    /**
     * Primitive constructor helper mixin
     */
    var PrimitiveHelpers = {
        addSphere : function(radius, color) {
            var sphere = new DataDoo.Sphere(radius, color);
            this.add(sphere);
            return sphere;
        },

        addDashedLine : function(startPos, endPos, dashSize, gapSize, endRadius) {
            var line = new DataDoo.DashedLine(startPos, endPos, dashSize, gapSize, endRadius);
            this.add(line);
            return line;
        },

        addSprite : function(url, position, scale) {
            var sprite = new DataDoo.Sprite(url, position, scale);
            this.add(sprite);
            return sprite;
        }
    };
    DataDoo.PrimitiveHelpers = PrimitiveHelpers;
})(window.DataDoo);
