(function(DataDoo) {
    /**
     *  Primitive base class
     */
    function Primitive() {
        this.objects = [];
    }
    Primitive.prototype = {
        getPositions : function() {
            return [];
        },
        onResolve : function() {
            throw new Error("Primitive : onResolve not implemented");
        }
    };

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
        this.objects.push(this.mesh);
    }
    Sphere.prototype = Object.create(Primitive.prototype, {
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
    });

    /**
     *  Line primitive
     */
    function DashedLine(color, dashSize, gapSize, startPos, endPos) {
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0x8888ff;
        this.startPos = startPos;
        this.endPos = endPos;

        this.sphereMaterial = new THREE.MeshLambertMaterial({color: this.color});
        this.sphereGeometry = new THREE.SphereGeometry(this.radius);
        this.sphere1 = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
        this.sphere2 = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);


        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
        this.lineMaterial = new THREE.LineDashedMaterial( { color: this.color, dashSize: this.dashSize, gapSize: this.gapSize } );
        this.line = new THREE.Line( this.lineGeometry, this.lineMaterial );

        this.objects.push(this.sphere1, this.sphere2, this.line);
    }
    DashedLine.prototype = Object.create(Primitive.prototype, {
        getPositions : function() {
            return [this.startPos, this.endPos];
        },
        onResolve: function() {
            this.startPos.applyToVector(this.lineGeometry.vertices[0]);
            this.endPos.applyToVector(this.lineGeometry.vertices[1]);
            this.lineGeometry.computeLineDistances();

            this.startPos.applyToVector(this.sphere1.position);
            this.endPos.applyToVector(this.sphere2.position);
        }
    });
})(window.DataDoo);
