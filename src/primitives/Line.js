(function(DataDoo) {

    /**
     *  Line primitive
     */
    function Line(vertices, color, thickness, opacity) {
        DataDoo.Primitive.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0x000000;

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices = this.makeRVectors(vertices);
        this.lineMaterial = new THREE.LineBasicMaterial({ color : this.color, linewidth : this.thickness, opacity : this.opacity, transparent:true });
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);

        this.add(this.line);
    }

    Line.prototype = Object.create(DataDoo.Primitive.prototype);

    Line.prototype.updateGeometry = function () {
        this.lineGeometry.computeLineDistances();
    };

    DataDoo.Line = Line;

    /**
     *  DashedLine primitive
     */
    function DashedLine(vertices, color, dashSize, gapSize, thickness, opacity) {
        DataDoo.Primitive.call(this);
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0xffaa00;
        this.thickness = thickness || 1;
        this.opacity = opacity || 0.6;

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices = this.makeRVectors(vertices);
        this.lineGeometry.computeLineDistances();
        this.lineMaterial = new THREE.LineDashedMaterial({color : this.color, opacity : this.opacity, linewidth : this.thickness, dashSize : this.dashSize, gapSize : this.gapSize, transparent : true});
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
        this.add(this.line);
    }

    DashedLine.prototype = Object.create(DataDoo.Primitive.prototype);

    DashedLine.prototype.updateGeometry = function () {
        this.lineGeometry.computeLineDistances();
    };

    DataDoo.DashedLine = DashedLine;

})(window.DataDoo);
