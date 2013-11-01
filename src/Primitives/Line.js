(function (DataDoo) {
    function Line(pointsArr, color, thickness, opacity) {
        if (pointsArr === undefined) {
            throw new Error("Line : No vertices specified!");
        }
        DataDoo.Primitive.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0x000000;

        this.geometry = new THREE.Geometry();

        this.geometry.dynamic = true;
        this.geometry.verticesNeedUpdate = true;

        this.geometry.vertices = pointsArr;
        this.material = new THREE.LineBasicMaterial({ color : this.color, linewidth : this.thickness, opacity : this.opacity, transparent : true });
        this.mesh = new THREE.Line(this.geometry, this.material);

        return this;
    }

    Line.prototype = new DataDoo.Primitive();
    Line.prototype.constructor = Line;

    DataDoo.Line = Line;

    function DashedLine(pointsArr, color, thickness, opacity, dashSize, gapSize) {
        if (pointsArr === undefined) {
            throw new Error("DashedLine : No vertices specified!");
        }
        DataDoo.Primitive.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0x000000;
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;

        this.geometry = new THREE.Geometry();

        this.geometry.dynamic = true;
        this.geometry.verticesNeedUpdate = true;

        this.geometry.vertices = pointsArr;
        //The following precomputation is necessary for dashed-line materials
        this.geometry.computeLineDistances();

        this.material = new THREE.LineDashedMaterial({color : this.color, opacity : this.opacity, linewidth : this.thickness, dashSize : this.dashSize, gapSize : this.gapSize});
        this.mesh = new THREE.Line(this.geometry, this.material, THREE.LinePieces);

        return this;
    }

    DashedLine.prototype = new DataDoo.Primitive();
    DashedLine.prototype.constructor = DashedLine;

    DataDoo.DashedLine = DashedLine;
})(window.DataDoo);