(function(DataDoo) {
    function NodeGenerator(dd) {
        this.dd = dd;
    }

    DataDoo.prototype.nodeGenerator = function() {
        return NodeGenerator.apply({}, [this].concat(arguments));
    };
})(window.DataDoo);
