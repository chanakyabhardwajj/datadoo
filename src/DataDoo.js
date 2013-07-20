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
            self.eventBus.execute();

            // render the frame
            self.renderer.render(self.scene, self.camera);
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
            this._addOrRemoveSceneObjects(this.parentEvents);
        }, this);
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
            console.log("Scheduling execution of " + subscriber.id + " for event " + eventName);
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
