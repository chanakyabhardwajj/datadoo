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
                this.dd.eventBus.enqueue(this, "NODE.UPDATE", {updated: updatedNodes, oldNodes: oldNodes});
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
        this.primitives = [];
        this.data = data;
    }
    Node.prototype.addSphere = function(radius, color) {
        var sphere = new DataDoo.Sphere(radius, color);
        this.primitives.push(sphere);
        return sphere;
    };

    Node.prototype.addLabel = function(msg, pos, offset) {
        var label = new DataDoo.Label(msg, pos, offset);
        this.primitives.push(label);
        return label;
    };

    Node.prototype.addDashedLine = function(startPos, endPos, color, dashSize, gapSize, radius) {
        var line = new DataDoo.DashedLine(startPos, endPos, color, dashSize, gapSize, radius);
        this.primitives.push(line);
        return line;
    };

    Node.prototype.addLine = function(startPos, endPos, lineLength, dir, color, thickness, opacity) {
        var line = new DataDoo.Line(startPos, endPos, lineLength, dir, color, thickness, opacity);
        this.primitives.push(line);
        return line;
    };

    Node.prototype.addSprite = function(url, position, scale) {
        var sprite = new DataDoo.Sprite(url, position, scale);
        this.primitives.push(sprite);
        return sprite;
    };

    Node.prototype.addCone = function(height, topRadius, baseRadius, position, dir, color, opacity) {
        var cone = new DataDoo.Cone(height, topRadius, baseRadius, position, dir, color, opacity);
        this.primitives.push(cone);
        return cone;
    };

    Node.prototype.addArrow = function(obj) {
        var arrow = new DataDoo.Arrow(obj);
        this.primitives.push(arrow);
        return arrow;
    };
    DataDoo.Node = Node;

    DataDoo.NodeGenerator = NodeGenerator;
})(window.DataDoo);
