(function(DataDoo) {

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(data) {
        this.primitives = [];
        this.data = data || {};
    }

    Relation.prototype.addSpline= function(points, color, subdivisions) {
        var spline = new DataDoo.Spline(points, color, subdivisions);
        this.primitives.push(spline);
        return spline;
    };

    Relation.prototype.addDashedLine = function(startPos, endPos, color, dashSize, gapSize, radius) {
        var line = new DataDoo.DashedLine(startPos, endPos, color, dashSize, gapSize, radius);
        this.primitives.push(line);
        return line;
    };

    Relation.prototype.addSprite = function(url, position, scale) {
        var sprite = new DataDoo.Sprite(url, position, scale);
        this.primitives.push(sprite);
        return sprite;
    };

    DataDoo.Relation = Relation;
})(window.DataDoo);


