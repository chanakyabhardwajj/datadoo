(function(DataDoo) {
    /**
     *  Sphere primitive
     */
    function Sphere(radius, color, opacity, wireframe) {
        DataDoo.Primitive.call(this);
        this.radius = radius || 10;
        this.color = color || 0x8888ff;
        this.opacity = opacity || 1;
        this.wireframe = wireframe || false;

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent : true});
        this.geometry = new THREE.SphereGeometry(1, 50, 50);
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.outlineMaterial = new THREE.MeshBasicMaterial( { color: 0x3c3c3c, side: THREE.BackSide } );
        this.outlineMesh = new THREE.Mesh( this.geometry, this.outlineMaterial );
        this.outlineMesh.scale.multiplyScalar(1.03);
        this.mesh.add(this.outlineMesh);

        this.scale.set(this.radius, this.radius, this.radius);
        this.add(this.mesh);

    }

    Sphere.prototype = Object.create(DataDoo.Primitive.prototype);

    DataDoo.Sphere = Sphere;

    Sphere.prototype.setRadius = function (radius) {
        this.radius = radius;
        this.scale.set(this.radius, this.radius, this.radius);
    };

})(window.DataDoo);
