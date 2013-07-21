(function(DataDoo) {
    /**
     *  Sphere primitive
     */
    function Sphere(radius, color) {
        this.radius = 10;
        this.color = color || 0x8888ff;
        this.center = new DataDoo.AbsolutePosition(0,0,0);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.objects = [this.mesh];
    }
    Sphere.prototype = {
        /**
         * Sets the radius of the sphere
         */
        setRadius : function(radius) {
            this.radius = radius;
            this.geometry = new THREE.SphereGeometry(this.radius);
            this.mesh.setGeometry(this.geometry);
        },
        getPositions : function() {
            return [this.center];
        },
        onResolve : function() {
            this.center.applyToVector(this.mesh.position);
        }
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
    Node.prototype.addSphere = function(radius, color) {
        var sphere = new Sphere(radius, color);
        this.primitives.push(sphere);
        return sphere;
    };

    DataDoo.Node = Node;
})(window.DataDoo);
