(function(DataDoo) {

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(data) {
        DataDoo.DDObject3D.call(this);
        this.data = data || {};
        this.position = new DataDoo.RVector3();
    }
    Relation.prototype = Object.create(DataDoo.DDObject3D.prototype);
    _.extend(Relation.prototype, DataDoo.PrimitiveHelpers);
    DataDoo.Relation = Relation;
})(window.DataDoo);


