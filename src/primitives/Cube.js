(function(DataDoo) {

    /**
     *  Cube primitive
     */
    function Cube(width, height, depth, color, opacity, wireframe) {
        DataDoo.Primitive.call(this);
        this.width = width || 10;
        this.height = height || 10;
        this.depth = depth || 10;
        this.color = color || 0x767676;
        this.opacity = opacity || 1;
        this.wireframe = wireframe || false;

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent : true});
        this.geometry = new THREE.CubeGeometry(this.width, this.height, this.depth);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }

    Cube.prototype = Object.create(DataDoo.Primitive.prototype);

    Cube.prototype.updateGeometry = function () {
        this.geometry.computeLineDistances();
    };

    DataDoo.Cube = Cube;

})(window.DataDoo);
