(function(DataDoo) {
    /**
     *  Cone primitive
     */
    function Cone(height, topRadius, baseRadius, color, opacity) {
        DataDoo.Primitive.call(this);

        this.height = height || 5;
        this.topRadius = topRadius || 0;
        this.baseRadius = baseRadius || 5;
        this.opacity = opacity || 1;
        this.color = color || 0x767676;

        var coneGeometry = new THREE.CylinderGeometry(this.topRadius, this.baseRadius, this.height, 20, 20);
        var coneMat = new THREE.MeshLambertMaterial({ color : this.color, opacity : this.opacity, transparent : true});
        this.cone = new THREE.Mesh(coneGeometry, coneMat);

        this.add(this.cone);
    }

    Cone.prototype = Object.create(DataDoo.Primitive.prototype);

    Cone.prototype.setDirection = function (dir) {
        this.setDirection(dir, this.cone);
    };

    DataDoo.Cone = Cone;

})(window.DataDoo);
