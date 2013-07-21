(function(DataDoo) {
    /**
     * Position Base Class
     */
    function Position(x, y, z, type, relatedPos) {
        this.resolvedX = 0;
        this.resolvedY = 0;
        this.resolvedZ = 0;
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.type = type || DataDoo.ABSOLUTE;
        this.relatedPos = (type == DataDoo.RELATIVE?relatedPos:null);
    }
    Position.prototype.setType = function(type) {
        this.type = type;
    };
    Position.prototype.set = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
    Position.prototype.setX = function(x) {
        this.x = x;
    };
    Position.prototype.setY = function(y) {
        this.x = y;
    };
    Position.prototype.setZ = function(z) {
        this.x = z;
    };
    Position.prototype.relative = function(x, y, z) {
        return new Position(x, y, z, DataDoo.RELATIVE, this);
    };
    Position.prototype.applyToVector = function(vec) {
        vec.set(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    Position.prototype.toVector = function() {
        return new THREE.Vector3(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    DataDoo.Position = Position;

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
        this.center = center || new Position(0,0,0);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius);
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
     *  Line primitive
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
})(window.DataDoo);
