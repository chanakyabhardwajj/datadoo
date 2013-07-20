(function(DataDoo) {
    /**
     *  Sphere primitive
     */
    function Sphere(radius, color) {
        this.radius = 10;
        this.color = color || 0x8888ff;

        this.material = new THREE.MeshaLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.objects = [mesh];
    }
    /**
     * Sets the radius of the sphere
     */
    Sphere.prototype.setRadius = function(radius) {
        this.radius = radius;
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh.setGeometry(this.geometry);
    };
    Sphere.prototype.setObjectPositions = function(x, y, z) {
        this.mesh.position.set(x, y, z);
    };

    /**
     * Node is a visual representation for each datapoint
     * It contains a set of graphics primitives that reprents
     * its visual
     */
    function Node(data) {
        this.primitives = [];
        this.data = data;
    }
    Node.prototype.addSphere = function(radius) {
        var sphere = new Sphere(radius);
        return sphere;
    };

    DataDoo.Node = Node;
})(window.DataDoo);
