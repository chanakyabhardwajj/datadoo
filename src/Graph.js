(function(DataDoo) {
    function Graph(dd) {
    }

    DataDoo.prototype.graph = function() {
        return new Graph(this);
    };
})(window.DataDoo);
