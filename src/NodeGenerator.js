(function(DataDoo) {
    /**
     *  NodeGenerator class generates nodes for data points
     */
    function NodeGenerator(dd, id, dataSet, appFn) {
        this.dd = dd;
        this.id = id;
        this.dataSet = dataSet;
        this.nodes = [];
        this.appFn = appFn;

        // put the nodes array 
        if(dd.bucket.id) {
            throw new Error("NodeGenerator : id '"+id+"' already used");
        } else {
            dd.bucket.id = this.nodes;
        }

        dd.eventBus.subscribe(this, dataSet);
    }
    NodeGenerator.prototype.collapseEvents = false;
    NodeGenerator.prototype.priority = 2;
    NodeGenerator.prototype.handler(event) {
        switch(event.eventName) {
            case "DATA.ADD":
                var addedNodes = _.map(event.data, function(row) {
                    var node = this._generateNode(row);
                    this.nodes.push(node);
                    return node;
                }, this);
                break;
            case "DATA.DELETE":
                var deletedNodes = _.map(event.data, function(row) {
                    for(var i in this.nodes) {
                        var node = this.nodes[i];
                        if(node.data._id == row._id) {
                            this.nodes.splice(i, 1);
                            // TODO: add node cleanup
                            return node;
                        }
                    }
                }, this);
                break;
            case "DATA.UPDATE":
                var updatedNodes = _.map(event.data, function(row) {
                    for(var i in this.nodes) {
                        var node = this.nodes[i];
                        if(node.data._id == row._id) {
                            this.nodes[i] = this._generateNode(row);
                            return this.nodes[i];
                        }
                    }
                }, this);
                break;
            default:
                throw new Error("NodeGenerator : Unknown event fired");
        }
    }
    NodeGenerator.prototype._generateNode = function(data) {
        var node = new Node();
        node.data = data;
        this.appFn.call(node, this.dd.bucket);
        return node;
    }

    /**
     * Node is a visual representation for each datapoint
     * It contains a set of graphics primitives that reprents
     * its visual
     */
    function Node() {
        this.primitives = [];
    }

    // expose the NodeGenerator constructor by patching datadoo
    DataDoo.prototype.nodeGenerator = function() {
        return NodeGenerator.apply({}, [this].concat(arguments));
    };
})(window.DataDoo);
