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
        this.queue = [];
        this.listeners = {};
    }
    EventBus.prototype.enqueue = function(priority, eventName, creator, data) {
        this.queue.push({
            priority: priority,
            eventName: eventName,
            creator: creator,
            data: data
        });
        this.queue = _.sortBy(this.queue, "priority");
    };
    EventBus.prototype.subscribe = function(creator, eventName, callback, context) {
        if(!this.listeners[creator]) {
            this.listeners[creator] = {};
        }
        if(!this.listeners[creator][eventName]) {
            this.listeners[creator][eventName] = [];
        }
        this.listeners[creator][eventName].push([callback, context]);
    };
    EventBus.prototype.fireTillEmpty = function() {
        while(this.queue.length > 0) {
            var event = this.queue.shift();
            var callbacks = this.listeners[event.creator][event.eventName];
            _.each(callbacks, function(callback) {
                if(callback[1]) {
                    // call with context if provided
                    callback[0].call(callback[1], event.data);
                } else {
                    callback[0](event.data);
                }
            });
        }
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

(function(DataDoo){
    var DataSet = function(/*datadooInstance*/ ddI, /*array of dataset configurations*/ configArr){
        if(!ddI){
            console.log("DataSet : Could not find any DataDoo instance!");
            return;
        }

        if(!configArr || configArr.length==0){
            console.log("DataSet : Could not find any configuration object!");
            return;
        }

        _.each(configArr, function(config){
            /*
            config object should have a name property: {name : "String"}
            Refer here for further supported options : http://misoproject.com/dataset/api.html#misodataset_constructor
            */
            var newDataSet = new Miso.Dataset(config);
            if(newDataSet){
                ddI[config.name || Date.now()] = newDataSet;
            }
            else{
                console.log("DataSet : Could not create the Miso Dataset. Details of the failed configuration below : ");
                console.log(config);
            }
        })

    };

    DataSet.prototype.fetch = function(dataset){
        dataset.fetch({
            success: function() {
                console.log( "DataSet : Successfully fetched the dataset : " + dataset );
            },

            error: function() {
                console.log( "DataSet : Error fetching the dataset : " + dataset );
            }
        });
    }

    DataSet.prototype.reset = function(dataset){
        dataset.reset();
    }

    DataSet.prototype.add = function(dataset, row){
        dataset.add(row);
    }

    DataSet.prototype.remove = function(dataset, filterFn){
        dataset.remove(filterFn);
    }

    DataSet.prototype.update = function(dataset, options){
        dataset.update(options);
    }

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
    * http://misoproject.com/dataset/api.html#misodatasetdataview
    */

    DataDoo.prototype.DataSet = function(/*array of dataset configurations*/ configArr){
        return new DataSet(this, configArr);
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

        dd.eventBus.subscribe(dataSet, "data.add", this.onAddHandler, this);
        dd.eventBus.subscribe(dataSet, "data.delete", this.onDeleteHandler, this);
        dd.eventBus.subscribe(dataSet, "data.update", this.onUpdateHandler, this);
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
