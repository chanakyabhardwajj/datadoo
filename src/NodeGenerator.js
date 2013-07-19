(function(DataDoo) {
    function NodeGenerator(dd, id, dataSet, appFn) {
        this.dd = dd;
        this.id = id;
        this.dataSet = dataSet;
        this.nodes = [];
        this.appFn = appFn;
        var self = this;

        // put the nodes array 
        if(dd.bucket.id) {
            throw new Error("NodeGenerator : id '"+id+"' already used");
        } else {
            dd.bucket.id = this.nodes;
        }

        dd.eventBus.subscribe(dataSet, "DATA.ADD", this.onAddHandler, this);
        dd.eventBus.subscribe(dataSet, "DATA.DELETE", this.onDeleteHandler, this);
        dd.eventBus.subscribe(dataSet, "DATA.UPDATE", this.onUpdateHandler, this);
    }
    NodeGenerator.prototype.onAddHandler = function(addedRows) {
        var addedNodes = _.map(addedRows, function(row) {
            var node = this._generateNode(row);
            this.nodes.push(node);
            return node;
        }, this);
    }
    NodeGenerator.prototype.onUpdateHandler = function(updatedRows) {
        var updatedNodes = _.map(updatedRows, function(row) {
            for(var i in this.nodes) {
                var node = this.nodes[i];
                if(node.data._id == row._id) {
                    this.nodes[i] = this._generateNode(row);
                    return this.nodes[i];
                }
            }
        }, this);
    }
    NodeGenerator.prototype.onDeleteHandler = function(deletedRows) {
        var deletedNodes = _.map(deletedRows, function(row) {
            for(var i in this.nodes) {
                var node = this.nodes[i];
                if(node.data._id == row._id) {
                    this.nodes.splice(i, 1);
                    return node;
                }
            }
        }, this);
    }
    NodeGenerator.prototype._generateNode = function(data) {
        var node = new Node();
        node.data = data;
        this.appFn.call(node, this.dd.bucket);
        return node;
    }

    function Node() {
        this.primitives = [];
    }

    // expose the NodeGenerator class by patching
    DataDoo.prototype.nodeGenerator = function() {
        return NodeGenerator.apply({}, [this].concat(arguments));
    };
})(window.DataDoo);
