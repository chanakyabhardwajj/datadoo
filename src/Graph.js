(function(DataDoo) {
    function Graph() {
    }

    DataDoo.prototype.graph = function() {
        return Graph.apply({}, [this].concat(arguments));
    }
})(window.DataDoo)
