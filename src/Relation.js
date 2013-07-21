(function(DataDoo) {

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(/*array of nodes*/ nodes, /*optional*/ data) {
        this.nodes = nodes;
        this.primitives = [];
        this.data = data;
    }

    Relation.prototype.addDashedLine = function(color, dashSize, gapSize, sourceNode, destNode) {
        var line = new DashedLine(color, dashSize, gapSize, sourceNode, destNode);
        this.primitives.push(line);
        return line;
    };

    DataDoo.Relation = Relation;
})(window.DataDoo);


