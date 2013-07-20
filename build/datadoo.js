window.DataDoo = (function() {

    /**
     * Main DataDoo class 
     */
    function DataDoo(params) {
        params = params || {};
        _.defaults(params, {
            camera: {}
        });
        _.defaults(params.camera, {
            type: DataDoo.PERSPECTIVE,
            viewAngle: 45,
            near: 0.1,
            far: 20000
        });

        // initialize global eventbus and bucket
        this.eventBus = new EventBus();
        this.bucket = {};

        // create three.js stuff
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({canvas: params.canvas});
        switch(params.camera.type) {
            case DataDoo.PERSPECTIVE:
                var canvas = this.renderer.domElement;
                this.camera = new THREE.PerspectiveCamera(params.camera.viewAngle,
                                                          canvas.innerWidth/canvas.innerHeight,
                                                          params.camera.near,
                                                          params.camera.far);
                break;
            default:
                throw new Error("DataDoo : unknown camera type");
        }
        this.scene.add(this.camera);
    }
    DataDoo.priority = 5;
    DataDoo.collapseEvents = true;
    /**
     * Sets the size of the canvas
     */
    DataDoo.prototype.setSize = function(width, height) {
        this.renderer.setSize(width, height);
        if(this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = width/height;
        }
    };
    /**
     * Starts the visualization render loop
     */
    DataDoo.prototype.startVis = function() {
        // subscribe to all the child elements
        _.each(arguments, function(entity) {
            this.eventBus.subscribe(entity, this);
        }, this);

        // start the render loop
        var self = this;
        function renderFrame() {
            requestAnimationFrame(renderFrame);

            // we clear the eventbus, to make sure all the components have run
            self.eventBus.fireTillEmpty();

            // render the frame
            self.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(renderFrame);
    };
    DataDoo.prototype.handler = function(events) {
        // traverse the event chain and add or remove objects
        this._addOrRemoveSceneObjects(events);

        // Resolve node positions
        // TODO: resolve only dirty nodes
        _.chain(this.bucket).values().flatten().filter(function(item) {
            return item instanceof DataDoo.Node;
        }).map(function(node) {
            return node.primitives;
        }).flatten().each(function(primitive) {
            // TODO: more advanced position resolution
            primitive.setObjectPositions(primitive.x, primitive.y, primitive.z);
        });
    };
    DataDoo.prototype._addOrRemoveSceneObjects = function(events) {
        _.chain(events).filter(function(event) { 
            return event.eventName.substring(0, 5) == "NODE";
        }).each(function(event) {
            switch(event) {
                case "NODE.ADD":
                    _.each(this._getObjects(event.data), function(object) {
                        this.scene.add(object);
                    }, this);
                    break;
                case "NODE.REMOVE":
                    _.each(this._getObjects(event.data), function(object) {
                        this.scene.add(object);
                    }, this);
                    break;
                case "NODE.UPDATE":
                    _.each(this._getObjects(event.data.updatedNodes), function(object) {
                        this.scene.add(object);
                    }, this);
                    _.each(this._getObjects(event.data.oldNodes), function(object) {
                        this.scene.remove(object);
                    }, this);
                    break;
            }
        }, this);
        _.each(this.event.parentEvents, this._addOrRemoveSceneObjects, this);
    };
    DataDoo.prototype._getObjects = function(nodes) {
        return _.chain(nodes).map(function(node) {
            return node.primitives;
        }).flatten().map(function(primitive) {
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
    EventBus.prototype.enqueue = function(publisher, eventName, data) {
        var subscribers = this.subscribers[publisher];

        // add execution schedules for this event
        _.each(subscribers, function(subscriber) {
            // collapse events for subscribers who wants it
            if(subscriber.collapseEvents) {
                var entry = _.find(this.schedule, function(item) {
                    return item.subscriber === subscriber;
                });
                if(entry) {
                    entry.events.push({
                        publisher: publisher, 
                        eventName: eventName, 
                        data: data,
                        parentEvents: this._currentParentEvents
                    });
                    return;
                }
            }
            this.schedule.push({
                priority: subscriber.priority,
                subscriber: subscriber,
                events: [{
                    publisher: publisher,
                    eventName: eventName,
                    data: data,
                    parentEvents: this._currentParentEvents
                }]
            });
        }, this);

        // maintain priority order
        this.schedule = _.sortBy(this.schedule, "priority");
    };
    EventBus.prototype.subscribe = function(subscriber, publisher) {
        if(!this.subscribers[publisher]) {
            this.subscribers[publisher] = [];
        }
        this.subscribers[publisher].push(subscriber);
    };
    EventBus.prototype.execute = function() {
        while(this.schedule.length > 0) {
            var item = this.schedule.shift();
            this._currentParentEvents = item.events;
            if(item.subscriber.collapseEvents) {
                item.subscriber.handler(item.events);
            } else {
                item.subscriber.handler(item.events[0]);
            }
        }
        this._currentParentEvents = [];
    };

    // Request animationframe helper
    var requestAnimationFrame = (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
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
            return;
        }

        if (!id) {
            console.log("DataSet : Could not find any id!");
            return;
        }

        if (!configObj) {
            console.log("DataSet : Could not find any configuration object!");
            return;
        }

        //Force the syncing to be true. Miso does not allow to make an instantiated dataset syncable later on.
        configObj.sync = true;

        var newDataSet = new Miso.Dataset(configObj);
        if (newDataSet) {
            if (ddI[id]) {
                console.log("DataSet : A dataset with the same ID already exists!!");
                return;
            }
            if (ddI.bucket[id]) {
                console.log("DataSet : The bucket has a dataset reference with the same ID already! Internal Error!");
                return;
            }

            ddI[id] = newDataSet;
            ddI.bucket[id] = ddI[id];


            //Events for the dataset
            newDataSet.subscribe("add", function (event) {
                ddI.eventBus.enqueue(0, "DATA.ADD", newDataSet, _.map(event.deltas, function (obj) {
                    return obj.changed;
                }));
            });

            newDataSet.subscribe("update", function (e) {
                var updatedRows = [];
                _.each(e.deltas, function(delta){
                    console.log("delta " + delta._id);
                    _.each(e.dataset, function(drow){
                        if(drow._id == delta._id){
                            updatedRows.push(drow);
                        }
                    });
                });
                ddI.eventBus.enqueue(0, "DATA.UPDATE", newDataSet, updatedRows);
            });

            newDataSet.subscribe("remove", function (event) {
                ddI.eventBus.enqueue(0, "DATA.DELETE", newDataSet, _.map(event.deltas, function (obj) {
                    return obj.old;
                }));
            });

            newDataSet.subscribe("reset", function (event) {
                ddI.eventBus.enqueue(0, "DATA.RESET", newDataSet, []);
            });

            return newDataSet;
        }
        else {
            console.log("DataSet : Could not create the Miso Dataset. Details of the failed configuration below : ");
            console.log(config);
        }
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
            return;
        }

        if (!id) {
            console.log("DataFilter : Could not find any id!");
            return;
        }

        if (!dsI) {
            console.log("DataFilter : Could not find any parent DataSet object!");
            return;
        }

        var uniqs = _.pluck(dsI.countBy(colName).toJSON(), colName);
        if (uniqs.length === 0) {
            console.log("DataFilter : The supplied column does not have any data!");
            return;
        }

        var allCols = dsI.columnNames;
        var filteredCols = _.without(allCols, colName);
        var currentIndex = 0;

        var newDataFilter = {
            colName:colName,
            filter:null,
            uniqs:uniqs,
            currentIndex:currentIndex
        };

        newDataFilter.recompute = function () {
            newDataFilter.filter = dsI.where({
                //columns:filteredCols,
                rows:function (row) {
                    return row[newDataFilter.colName] == newDataFilter.uniqs[newDataFilter.currentIndex];
                }
            });
        };

        newDataFilter.next = function () {
            if (newDataFilter.currentIndex < newDataFilter.uniqs.length - 1) {
                newDataFilter.currentIndex++;
            }
            else if (newDataFilter.currentIndex == newDataFilter.uniqs.length - 1) {
                newDataFilter.currentIndex = 0;
            }

            newDataFilter.recompute();
        };

        newDataFilter.previous = function () {
            if (newDataFilter.currentIndex > 0) {
                newDataFilter.currentIndex--;
            }
            else if (newDataFilter.currentIndex === 0) {
                newDataFilter.currentIndex = newDataFilter.uniqs.length - 1;
            }

            newDataFilter.recompute();
        };

        newDataFilter.recompute();

        if (ddI[id]) {
            console.log("DataFilter : An entity with the same ID already exists!!");
            return;
        }

        if (ddI.bucket[id]) {
            console.log("DataSet : The bucket has an entity reference with the same ID already! Internal Error!");
            return;
        }
        ddI[id] = newDataFilter;
        ddI.bucket[id] = ddI[id];

        newDataFilter.filter.subscribe("change", function (e) {
            ddI.eventBus.enqueue(0, "DATA......", newDataFilter, []);
        });

        //Listen to the parent dataset's reset event and then recompute yourself!
        //Miso somehow does not do this! Weird!
        dsI.subscribe("reset", function(){
            newDataFilter.recompute();
            ddI.eventBus.enqueue(0, "DATA.RESET", newDataFilter, []);
        });


        return newDataFilter;

    };

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
     * http://misoproject.com/dataset/api.html#misodatasetdataview
     */

    DataDoo.DataFilter = DataFilter;

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
        if(dd.bucket.id) {
            throw new Error("NodeGenerator : id '"+id+"' already used");
        } else {
            dd.bucket.id = this.nodes;
        }

        dd.eventBus.subscribe(this, dataSet);
    }
    NodeGenerator.prototype.collapseEvents = false;
    NodeGenerator.prototype.priority = 2;
    NodeGenerator.prototype.handler = function(event) {
        switch(event.eventName) {
            case "DATA.ADD":
                var addedNodes = _.map(event.data, function(row) {
                    var node = this._generateNode(row);
                    this.nodes.push(node);
                    return node;
                }, this);
                this.dd.eventBus.enqueue(this, "NODE.ADD", addedNodes);
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
                this.dd.eventBus.enqueue(this, "NODE.DELETE", deletedNodes);
                break;
            case "DATA.UPDATE":
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
                throw new Error("NodeGenerator : Unknown event fired");
        }
    };
    NodeGenerator.prototype._generateNode = function(data) {
        var node = new DataDoo.Node();
        node.data = data;
        this.appFn.call(node, this.dd.bucket);
        return node;
    };

    DataDoo.NodeGenerator = NodeGenerator;
})(window.DataDoo);
