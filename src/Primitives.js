(function(DataDoo) {
    /**
     *  Primitive base class
     */
    function Primitive() {
        this.objects = [];
    }
    Primitive.prototype.getPositions = function() {
        return [];
    };
    Primitive.prototype.onResolve = function() {
        throw new Error("Primitive : onResolve not implemented");
    };
    DataDoo.Primitive = Primitive;

    /**
     *  Sphere primitive
     */
    function Sphere(radius, color, center) {
        this.radius = radius || 10;
        this.color = color || 0x8888ff;
        this.center = center || new DataDoo.Position(0,0,0);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius,20,20);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.objects = [this.mesh];
    }
    Sphere.prototype = Object.create(Primitive.prototype);
    /**
     * Sets the radius of the sphere
     */
    Sphere.prototype.setRadius = function(radius) {
        this.radius = radius;
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh.setGeometry(this.geometry);
    };
    Sphere.prototype.getPositions = function() {
        return [this.center];
    };
    Sphere.prototype.onResolve = function() {
        this.center.applyToVector(this.mesh.position);
    };
    DataDoo.Sphere = Sphere;

    /**
     *  DashedLine primitive
     */
    function DashedLine(startPos, endPos, color, dashSize, gapSize, radius) {
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0x8888ff;
        this.radius = radius || 3;
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

        this.objects = [this.sphere1, this.sphere2, this.line];
    }
    DashedLine.prototype = Object.create(Primitive.prototype);
    DashedLine.prototype.getPositions = function() {
        return [this.startPos, this.endPos];
    };
    DashedLine.prototype.onResolve = function() {
        this.startPos.applyToVector(this.lineGeometry.vertices[0]);
        this.endPos.applyToVector(this.lineGeometry.vertices[1]);
        this.lineGeometry.computeLineDistances();

        this.startPos.applyToVector(this.sphere1.position);
        this.endPos.applyToVector(this.sphere2.position);
    };
    DataDoo.DashedLine = DashedLine;


    function Spline(points, color, subdivisions){
        this.points = points;
        this.color = color || 0xfc12340;
        this.subdivisions = subdivisions || 6;
        this.spline = new THREE.Spline( points );
        this.geometrySpline = new THREE.Geometry();
        this.position = new DataDoo.Position(0,0,0);

        for ( var i = 0; i < this.points.length * this.subdivisions; i ++ ) {
            var index = i / ( this.points.length * this.subdivisions );
            var position = this.spline.getPoint( index );
            this.geometrySpline.vertices[ i ] = new THREE.Vector3( position.x, position.y, position.z );
        }
        this.geometrySpline.computeLineDistances();

        this.mesh = new THREE.Line( this.geometrySpline, new THREE.LineDashedMaterial( { color: this.color, dashSize: 1, gapSize: 0.5 } ), THREE.LineStrip );
        this.objects = [this.mesh];
    }
    Spline.prototype = Object.create(Primitive.prototype);
    Spline.prototype.getPositions = function() {
        return [this.position];
    };
    Spline.prototype.onResolve = function() {
        this.position.applyToVector(this.mesh.position);
    };
    DataDoo.Spline = Spline;
})(window.DataDoo);
