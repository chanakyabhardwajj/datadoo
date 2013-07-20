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
    }
    /**
     * Sets the radius of the sphere
     */
    Sphere.priority.setRadius = function(radius) {
        this.radius = radius;
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh.setGeometry(this.geometry);
    }

    /**
     * Node is a visual representation for each datapoint
     * It contains a set of graphics primitives that reprents
     * its visual
     */
    function Node(data) {
        this.primitives = [];
        this.data = data;
    }
    Node.prototype.addSphere = function() {
        this.primitives.push(Sphere.apply({}, arguments));
    };

    DataDoo.Node = Node;
})(window.DataDoo);
