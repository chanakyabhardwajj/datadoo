window.DataDoo = (function () {

    /**
     * Main DataDoo class
     */
    function DataDoo(params) {
        params = params || {};
        _.defaults(params, {
            camera:{}
        });
        _.defaults(params.camera, {
            type:DataDoo.PERSPECTIVE,
            viewAngle:45,
            near:0.1,
            far:20000
        });

        // initialize global eventbus and bucket
        this.eventBus = new EventBus();
        this.bucket = {};

        // create three.js stuff
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({canvas:params.canvas});
        switch (params.camera.type) {
            case DataDoo.PERSPECTIVE:
                var canvas = this.renderer.domElement;
                this.camera = new THREE.PerspectiveCamera(params.camera.viewAngle,
                    canvas.width / canvas.height,
                    params.camera.near,
                    params.camera.far);
                break;
            default:
                throw new Error("DataDoo : unknown camera type");
        }
        this.camera.position.set(0, 150, 400);
        this.camera.lookAt(this.scene.position);
        this.scene.add(this.camera);

        this.light1 = new THREE.PointLight(0xffffff);
        this.light1.position.set(0, 250, 0);
        this.scene.add(this.light1);

        this.light2 = new THREE.PointLight(0xffffff);
        this.light2.position.set(0, 250, 250);
        this.scene.add(this.light2);

        this.light3 = new THREE.PointLight(0xffffff);
        this.light3.position.set(-250, -250, -250);
        this.scene.add(this.light3);

        this.axes = new THREE.AxisHelper(100);
        this.scene.add(this.axes);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }
    DataDoo.prototype.id = "DD";
    DataDoo.prototype.priority = 5;
    DataDoo.prototype.collapseEvents = true;
    /**
     * Sets the size of the canvas
     */
    DataDoo.prototype.setSize = function (width, height) {
        this.renderer.setSize(width, height);
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = width / height;
        }
    };

    /**
     * Starts the visualization render loop
     */
    DataDoo.prototype.startVis = function () {
        // subscribe to all the child elements
        _.each(arguments, function (entity) {
            this.eventBus.subscribe(this, entity);
        }, this);

        // start the render loop
        var self = this;

        function renderFrame() {
            requestAnimationFrame(renderFrame);

            // we clear the eventbus, to make sure all the components have run
            self.eventBus.execute();

            // render the frame
            self.renderer.render(self.scene, self.camera);

            self.controls.update();
        }

        requestAnimationFrame(renderFrame);
    };

    DataDoo.prototype.handler = function (events) {
        // traverse the event chain and add or remove objects
        this._addOrRemoveSceneObjects(events);

        // Resolve primitive positions

        // TODO: resolve only dirty nodes/relations
        var primitives = _.chain(this.bucket).values().flatten().filter(function (item) {
            return item instanceof DataDoo.Node || item instanceof DataDoo.Relation;
        }).map(function (node) {
            return node.primitives;
        }).flatten();
        
        var positions = primitives.map(function(primitive) {
            return primitive.getPositions();
        }).flatten();

        // resolve absolute positions
        positions.filter(function(p) {
            return p instanceof DataDoo.AbsolutePosition;
        }).each(function(p) {
            p.resolvedX = p.x;
            p.resolvedY = p.y;
            p.resolvedZ = p.z;
        });

        //TODO: resolve CoSyPosition

        // resolve relativePositions. TODO: dependency sorting
        positions.filter(function(p) {
            return p instanceof DataDoo.RelativePosition;
        }).each(function(p) {
            p.resolvedX = p.relatedPos.resolvedX + p.xoff;
            p.resolvedY = p.relatedPos.resolvedY + p.yoff;
            p.resolvedZ = p.relatedPos.resolvedZ + p.zoff;
        });

        // call onResolve on all primitives so that
        // they can set positions for three.js primitives
        primitives.each(function (primitive) {
            primitive.onResolve();
        });
    };

    DataDoo.prototype._addOrRemoveSceneObjects = function (events) {
        _.each(events, function(event) {
            switch (event.eventName) {
                case "NODE.ADD":
                    _.each(this._getObjects(event.data), function (object) {
                        this.scene.add(object);
                    }, this);
                    break;
                case "NODE.DELETE":
                    _.each(this._getObjects(event.data), function (object) {
                        this.scene.remove(object);
                    }, this);
                    break;
                case "NODE.UPDATE":
                    _.each(this._getObjects(event.data.updatedNodes), function (object) {
                        this.scene.add(object);
                    }, this);
                    _.each(this._getObjects(event.data.oldNodes), function (object) {
                        this.scene.remove(object);
                    }, this);
                    break;

                case "RELATION.UPDATE":
                    // Remove old relation primitives and add new ones here
                    break;
            }
            this._addOrRemoveSceneObjects(this.parentEvents);
        }, this);
    };
    DataDoo.prototype._getObjects = function (nodes) {
        return _.chain(nodes).map(function (node) {
            return node.primitives;
        }).flatten().map(function (primitive) {
            return primitive.objects;
        }).flatten().value();
    };

    /**
     * DataDoo constants TODO: move to separate file
     */
    DataDoo.PERSPECTIVE = 1;

    /**
     * DataDoo's special priority event bus for propagating
     * changes in the object hierarchy
     */
    function EventBus() {
        this.schedule = []; // contains the list of subscriber to be executed
        this.subscribers = {}; // contains map between publishers and subscribers
        this._currentParentEvents = []; // maintains the parentEvents for the current execution
    }
    EventBus.prototype.enqueue = function (publisher, eventName, data) {
        var subscribers = this.subscribers[publisher.id];

        // add execution schedules for this event
        _.each(subscribers, function (subscriber) {
            console.log("Scheduling execution of " + subscriber.id + " for event " + eventName);
            // collapse events for subscribers who wants it
            if (subscriber.collapseEvents) {
                var entry = _.find(this.schedule, function (item) {
                    return item.subscriber === subscriber;
                });
                if (entry) {
                    entry.events.push({
                        publisher:publisher,
                        eventName:eventName,
                        data:data,
                        parentEvents:this._currentParentEvents
                    });
                    return;
                }
            }
            this.schedule.push({
                priority:subscriber.priority,
                subscriber:subscriber,
                events:[
                    {
                        publisher:publisher,
                        eventName:eventName,
                        data:data,
                        parentEvents:this._currentParentEvents
                    }
                ]
            });
        }, this);

        // maintain priority order
        this.schedule = _.sortBy(this.schedule, "priority");
    };
    EventBus.prototype.subscribe = function (subscriber, publisher) {
        if (!this.subscribers[publisher.id]) {
            this.subscribers[publisher.id] = [];
        }
        this.subscribers[publisher.id].push(subscriber);
    };
    EventBus.prototype.execute = function () {
        while (this.schedule.length > 0) {
            var item = this.schedule.shift();
            console.log("EventBus : executing " + item.subscriber.id);
            this._currentParentEvents = item.events;
            if (item.subscriber.collapseEvents) {
                item.subscriber.handler(item.events);
            } else {
                item.subscriber.handler(item.events[0]);
            }
        }
        this._currentParentEvents = [];
    };

    // Request animationframe helper
    var requestAnimationFrame = (
        window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            }
        );

    return DataDoo;
})();

//This module serves the purpose of creating and connecting data-streams to datadoo.
//This will essentially be a very light wrapper around the MISO Dataset (http://misoproject.com/)

(function (DataDoo) {
    var DataSet = function (/*datadooInstance*/ ddI, id, configObj) {
        if (!ddI) {
            console.log("DataSet : Could not find any DataDoo instance!");
            throw new Error("DataSet : Could not find any DataDoo instance");
        }

        if (!id) {
            console.log("DataSet : Could not find any id!");
            throw new Error("DataSet : Could not find any id");
        }

        if (!configObj) {
            console.log("DataSet : Could not find any configuration object!");
            throw new Error("DataSet : Could not find any configuration object");
        }

        //Force the syncing to be true. Miso does not allow to make an instantiated dataset syncable later on.
        configObj.sync = true;
        configObj.resetOnFetch = true;
        var that = this;
        this.id = id;
        this.dataset = new Miso.Dataset(configObj);
        if (this.dataset) {
            if (ddI.bucket[id]) {
                console.log("DataSet : The bucket has a dataset reference with the same ID already! Internal Error!");
                throw new Error("DataSet : The bucket has a dataset reference with the same ID already! Internal Error");
            }

            ddI.bucket[id] = this.dataset;

            //Events for the dataset
            this.dataset.subscribe("add", function (event) {
                ddI.eventBus.enqueue(that, "DATA.ADD", _.map(event.deltas, function (obj) {
                    return obj.changed;
                }));
            });

            this.dataset.subscribe("update", function (e) {
                var updatedRows = [];
                _.each(e.deltas, function(delta){
                    _.each(e.dataset, function(drow){
                        if(drow._id == delta._id){
                            updatedRows.push(drow);
                        }
                    });
                });
                ddI.eventBus.enqueue(that, "DATA.UPDATE", updatedRows);
            });

            this.dataset.subscribe("remove", function (event) {
                ddI.eventBus.enqueue(that, "DATA.DELETE", _.map(event.deltas, function (obj) {
                    return obj.old;
                }));
            });

            this.dataset.subscribe("reset", function (event) {
                ddI.eventBus.enqueue(that, "DATA.RESET", []);
            });

            return this;
        }
        else {
            console.log("DataSet : Could not create the Miso Dataset. Details of the failed configuration below : ");
            console.log(config);
            throw new Error("DataSet : Could not create the Miso Dataset");
        }
    };

    DataSet.prototype.fetch = function(){
        this.dataset.fetch();
    };

    DataSet.prototype.toJSON = function(){
        this.dataset.toJSON();
    };

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
     * http://misoproject.com/dataset/api.html#misodatasetdataview
     */

    DataDoo.DataSet = DataSet;

})(window.DataDoo);

//This module serves the purpose of creating and connecting a filterable dataset to datadoo.
//This will essentially be a wrapper around the MISO Dataset using the "where" option (http://misoproject.com/)

(function (DataDoo) {
    var DataFilter = function (/*datadooInstance*/ ddI, id, /*datasetInstance*/ dsI, /*columnName on which filter is to be applied*/ colName) {
        if (!ddI) {
            console.log("DataFilter : Could not find any DataDoo instance!");
            throw new Error("DataFilter : Could not find any DataDoo instance");
        }

        if (!id) {
            console.log("DataFilter : Could not find any id!");
            throw new Error("DataFilter : Could not find any id");
        }

        if (!dsI) {
            console.log("DataFilter : Could not find any parent DataSet object!");
            throw new Error("DataFilter : Could not find any parent DataSet object");
        }

        //in the following line I am using countBy
        //which is a unexposed Miso function of Miso.Dataset
        //hence using dsI.dataset to access the Miso.Dataset object
        var uniqs = _.pluck(dsI.dataset.countBy(colName).toJSON(), colName) || [];

        if (uniqs.length === 0) {
            console.log("DataFilter : The supplied column does not have any data!");
            throw new Error("DataFilter : The supplied column does not have any data!");
        }

        if (ddI.bucket[id]) {
            console.log("DataSet : The bucket has an entity reference with the same ID already! Internal Error!");
            throw new Error("DataSet : The bucket has an entity reference with the same ID already! Internal Error");
        }

        /*newDataFilter.filter.subscribe("change", function (e) {
         ddI.eventBus.enqueue(0, "DATA......", newDataFilter, []);
         });*/

        this.uniqs = uniqs;
        this.currentIndex = 0;
        this.filter = null;
        this.datasource = dsI;
        this.filterColumn = colName;
        this.id = id;

        ddI.bucket[id] = this;

        if (!dsI.dataset.fetched) {
            dsI.fetch();
        }
        this.compute();

        //Listen to the parent dataset's reset event and then recompute yourself!
        //Miso somehow does not do this! Weird!
        var that = this;
        dsI.dataset.subscribe("reset", function () {
            that.compute();
            ddI.eventBus.enqueue(that, "DATA.RESET", []);
        });


        return this;
    };

    DataFilter.prototype.compute = function () {
        var misoDataset = this.datasource.dataset;

        if (!misoDataset.fetched) {
            misoDataset.fetch();
        }
        var that = this;
        this.filter = misoDataset.where({
            columns:_.without(misoDataset.columnNames(), this.filterColumn),
            rows:function (row) {
                return row[that.filterColumn] == that.uniqs[that.currentIndex];
            }
        });
    };

    DataFilter.prototype.next = function () {
        if (this.currentIndex < this.uniqs.length - 1) {
            this.currentIndex++;
        }
        else if (this.currentIndex == this.uniqs.length - 1) {
            this.currentIndex = 0;
        }

        this.compute();
    };

    DataFilter.prototype.previous = function () {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
        else if (this.currentIndex === 0) {
            this.currentIndex = this.uniqs.length - 1;
        }

        this.compute();
    };

    DataFilter.prototype.getCurrentState = function () {
        return this.uniqs[this.currentIndex];
    };

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
     * http://misoproject.com/dataset/api.html#misodatasetdataview
     */

    DataDoo.DataFilter = DataFilter;

})(window.DataDoo);


(function(DataDoo) {
    /**
     * Position Base Class
     */
    function Position() {
        this.resolvedX = 0;
        this.resolvedY = 0;
        this.resolvedZ = 0;
    }
    Position.prototype.applyToVector = function(vec) {
        vec.set(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    Position.prototype.toVector = function() {
        return new THREE.Vector3(this.resolvedX, this.resolvedY, this.resolvedZ);
    };

    /**
     * Absolute position. This position is used as is,
     * no resolving is done
     */
    function AbsolutePosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = x;
    }
    AbsolutePosition.prototype = Object.create(Position.prototype);
    DataDoo.AbsolutePosition = AbsolutePosition;

    /**
     * CoSy position. This position is resolved on a value
     * based coordinate system
     */
    function CoSyPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = x;
    }
    AbsolutePosition.prototype = Object.create(Position.prototype);
    DataDoo.CoSyPosition = CoSyPosition;

    /**
     * Relative Position. This position is resolved relative
     * to other position objects.
     */
    function RelativePosition(relatedPos, xoff, yoff, zoff) {
        this.relatedPos = relatedPos;
        this.xoff = xoff;
        this.yoff = yoff;
        this.zoff = zoff;
    }
    AbsolutePosition.prototype = Object.create(Position.prototype);
    DataDoo.RelativePosition = RelativePosition;

})(window.DataDoo);

(function(DataDoo) {
    /**
     *  Primitive base class
     */
    function Primitive() {
        this.objects = [];
    }
    Primitive.prototype.getPositions = function() {
        return [];
    };
    Primitive.prototype.onResolve = function() {
        throw new Error("Primitive : onResolve not implemented");
    };

    /**
     *  Sphere primitive
     */
    function Sphere(radius, color) {
        this.radius = 10;
        this.color = color || 0x8888ff;
        this.center = new DataDoo.AbsolutePosition(0,0,0);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.objects = [this.mesh];
    }
    Sphere.prototype = Object.create(Primitive.prototype);
    /**
     * Sets the radius of the sphere
     */
    Sphere.prototype.setRadius = function(radius) {
        this.radius = radius;
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh.setGeometry(this.geometry);
    };
    Sphere.prototype.getPositions = function() {
        return [this.center];
    };
    Sphere.prototype.onResolve = function() {
        this.center.applyToVector(this.mesh.position);
    };
    DataDoo.Sphere = Sphere;

    /**
     *  Line primitive
     */
    function DashedLine(startPos, endPos, color, dashSize, gapSize) {
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0x8888ff;
        this.radius = radius || 3;
        this.startPos = startPos;
        this.endPos = endPos;

        this.sphereMaterial = new THREE.MeshLambertMaterial({color: this.color});
        this.sphereGeometry = new THREE.SphereGeometry(this.radius);
        this.sphere1 = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
        this.sphere2 = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);


        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
        this.lineMaterial = new THREE.LineDashedMaterial( { color: this.color, dashSize: this.dashSize, gapSize: this.gapSize } );
        this.line = new THREE.Line( this.lineGeometry, this.lineMaterial );

        this.objects = [this.sphere1, this.sphere2, this.line];
    }
    DashedLine.prototype = Object.create(Primitive.prototype);
    DashedLine.prototype.getPositions = function() {
        return [this.startPos, this.endPos];
    };
    DashedLine.prototype.onResolve = function() {
        this.startPos.applyToVector(this.lineGeometry.vertices[0]);
        this.endPos.applyToVector(this.lineGeometry.vertices[1]);
        this.lineGeometry.computeLineDistances();

        this.startPos.applyToVector(this.sphere1.position);
        this.endPos.applyToVector(this.sphere2.position);
    };
    DataDoo.DashedLine = DashedLine;
})(window.DataDoo);

(function(DataDoo) {


})(window.DataDoo);

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



(function(DataDoo) {
    /**
     *  RelationGenerator class generates relations between nodes
     */
    function RelationGenerator(dd, id, /*array of nodeGenerators*/  ngs, appFn) {
        this.dd = dd;
        this.id = id;
        this.ngs = ngs;
        this.relations = [];
        this.appFn = appFn;

        // put the nodes array
        if(dd.bucket[id]) {
            throw new Error("RelationGenerator : id '"+id+"' already used");
        } else {
            dd.bucket[id] = this.relations;
        }

        var that = this;
        _.each(ngs, function(ng){
            dd.eventBus.subscribe(that, ng);
        });
    }

    RelationGenerator.prototype.collapseEvents = true;
    RelationGenerator.prototype.priority = 3;
    RelationGenerator.prototype.handler = function(/*array*/ events) {
        console.log("RelationGenerator" + this.id +": Received Events Array : " + _.flatten(events));
        this.dd.eventBus.enqueue(this, "RELATION.DELETE", this.relations);
        this.generateRelations();
        this.dd.eventBus.enqueue(this, "RELATION.CREATE", this.relations);
    };

    RelationGenerator.prototype.generateRelations = function() {
        this.relations = [];
        var relns = this.appFn.call(this.dd.bucket);
        this.relations = relns;
    };

    DataDoo.RelationGenerator = RelationGenerator;
})(window.DataDoo);

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
    DataDoo.Node = Node;

    DataDoo.NodeGenerator = NodeGenerator;
})(window.DataDoo);
