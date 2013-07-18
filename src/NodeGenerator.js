(function(DataDoo) {
    function NodeGenerator(dd, id, dataSet, appFn) {
        this.dd = dd;
        this.id = id;
        this.dataSet = dataSet;
        this.nodes = [];
        this.appFn = appFn;
        var self = this;

        dd.eventBus.subscribe(
        dd.eventBus.subscribe(dataSet, "add", this.onAddHandler, this);
    }
    NodeGenerator.prototype.onAddHandler = function(row) {
    }

    DataDoo.prototype.nodeGenerator = function() {
        return NodeGenerator.apply({}, [this].concat(arguments));
    };
})(window.DataDoo);
