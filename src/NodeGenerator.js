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
        if(dd.bucket[id]) {
            throw new Error("NodeGenerator : id '"+id+"' already used");
        } else {
            dd.bucket[id] = this.nodes;
        }

        dd.eventBus.subscribe(this, dataSet);
    }
    DataDoo.NodeGenerator = NodeGenerator;
    NodeGenerator.prototype.collapseEvents = false;
    NodeGenerator.prototype.priority = 2;
    NodeGenerator.prototype.handler = function(event) {
        switch(event.eventName) {
            case "DATA.ADD":
                console.log("NodeGenerator "+ this.id + ": Received NODE.ADD");
                var addedNodes = _.map(event.data, function(row) {
                    var node = this._generateNode(row);
                    this.nodes.push(node);
                    return node;
                }, this);
                this.dd.eventBus.enqueue(this, "NODE.ADD", addedNodes);
                break;
            case "DATA.DELETE":
                console.log("NodeGenerator "+ this.id + ": Received NODE.DELETE");
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
                this.dd.eventBus.enqueue(this, "NODE.DELETE", deletedNodes);
                break;
            case "DATA.UPDATE":
                console.log("NodeGenerator "+ this.id + ": Received NODE.UPDATE");
                var updatedNodes = [];
                var oldNodes = [];
                _.each(event.data, function(row) {
                    for(var i in this.nodes) {
                        var node = this.nodes[i];
                        if(node.data._id == row._id) {
                            this.nodes[i] = this._generateNode(row);
                            updatedNodes.push(nodes[i]);
                            oldNodes.push(node);
                        }
                    }
                }, this);
                this.dd.eventBus.enqueue(this, "NODE.UPDATE", {added: updatedNodes, removed: oldNodes});
                break;
            default:
                throw new Error("NodeGenerator "+ this.id + ": Unknown event "+event.eventName+" fired");
        }
    };
    NodeGenerator.prototype._generateNode = function(data) {
        var node = new DataDoo.Node();
        node.data = data;
        this.appFn.call(node, this.dd.bucket);
        return node;
    };

    /**
     * Node is a visual representation for each datapoint
     * It contains a set of graphics primitives that reprents
     * its visual
     */
    function Node(data) {
        DataDoo.DDObject3D.call(this);
        this.data = data || {};
        this.position = new DataDoo.RVector3();
    }
    Node.prototype = Object.create(DataDoo.DDObject3D.prototype);
    _.extend(DataDoo.prototype, DataDoo.PrimitiveHelpers);
    DataDoo.Node = Node;

})(window.DataDoo);
