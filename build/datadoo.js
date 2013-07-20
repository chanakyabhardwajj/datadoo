window.DataDoo = (function() {

    /**
     * Main DataDoo class 
     */
    function DataDoo(params) {
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
    }
    /**
     * Sets the size of the canvas
     */
    DataDoo.prototype.setSize = function(width, height) {
        this.renderer.setSize(width, height);
        if(this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = width/height;
        }
    }
    /**
     * Starts the visualization render loop
     */
    DataDoo.prototype.startVis = function() {
        var self = this;
        function renderFrame() {
            requestAnimationFrame(renderFrame);

            // we clear the eventbus, to make sure all the components have run
            self.eventBus.fireTillEmpty();

            // render the frame
            self.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(renderFrame);
    }

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
                }];
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
            item.subscriber.handle(item.events);
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
});

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
                }))
            });

            newDataSet.subscribe("update", function (e) {
                var updatedRows = [];
                _.each(e.deltas, function(delta){
                    console.log("delta " + delta._id);
                    _.each(e.dataset, function(drow){
                        if(drow._id == delta._id){
                            updatedRows.push(drow)
                        }
                    })
                });
                ddI.eventBus.enqueue(0, "DATA.UPDATE", newDataSet, updatedRows)
            });

            newDataSet.subscribe("remove", function (event) {
                ddI.eventBus.enqueue(0, "DATA.DELETE", newDataSet, _.map(event.deltas, function (obj) {
                    return obj.old;
                }))
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

    DataDoo.prototype.DataSet = function (id, configObj) {
        return new DataSet(this, id, configObj);
    }

})(window.DataDoo)
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
