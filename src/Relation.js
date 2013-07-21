(function(DataDoo) {

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(data) {
        this.primitives = [];
        this.data = data || {};
    }

    Relation.prototype.addDashedLine = function(startPos, endPos, color, dashSize, gapSize, radius) {
        var line = new DataDoo.DashedLine(startPos, endPos, color, dashSize, gapSize, radius);
        this.primitives.push(line);
        return line;
    };

    DataDoo.Relation = Relation;
})(window.DataDoo);


