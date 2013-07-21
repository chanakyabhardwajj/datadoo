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
            return p.type == DataDoo.ABSOLUTE;
        }).each(function(p) {
            p.resolvedX = p.x;
            p.resolvedY = p.y;
            p.resolvedZ = p.z;
        });

        //TODO: resolve CoSyPosition

        // resolve relativePositions. TODO: dependency sorting
        positions.filter(function(p) {
            return p.type == DataDoo.RELATIVE;
        }).each(function(p) {
            p.resolvedX = p.relatedPos.resolvedX + p.x;
            p.resolvedY = p.relatedPos.resolvedY + p.y;
            p.resolvedZ = p.relatedPos.resolvedZ + p.z;
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
            this._addOrRemoveSceneObjects(event.parentEvents);
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
    DataDoo.ABSOLUTE = 2;
    DataDoo.RELATIVE = 3;
    DataDoo.COSY = 4;

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
