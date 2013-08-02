(function(DataDoo) {
    /**
     *  Spline primitive
     */
    function Spline(points, subdivisions, color, thickness, dashSize, gapSize) {
        DataDoo.Primitive.call(this);
        this.points = this.makeRVectors(points);
        this.color = color || "0xfc12340";
        this.subdivisions = subdivisions || 6;
        this.thickness = thickness || 1;
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.spline = new THREE.Spline(this.points);
        this.geometrySpline = new THREE.Geometry();
        this.mesh = new THREE.Line(this.geometrySpline, new THREE.LineDashedMaterial({ color : this.color, dashSize : this.dashSize, gapSize : this.gapSize, linewidth : this.thickness , transparent:true}));
        this.add(this.mesh);
    }

    Spline.prototype = Object.create(DataDoo.Primitive.prototype);

    DataDoo.Spline = Spline;

    Spline.prototype.updateGeometry = function(){
        var points = this.points;
        for (var i = 0; i < points.length * this.subdivisions; i++) {
            var index = i / ( points.length * this.subdivisions );
            var position = this.spline.getPoint(index);
            this.geometrySpline.vertices[ i ] = new THREE.Vector3(position.x, position.y, position.z);
        }
        this.geometrySpline.computeLineDistances();
    };

})(window.DataDoo);
