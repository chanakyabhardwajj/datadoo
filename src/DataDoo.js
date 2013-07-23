window.DataDoo = (function () {

    /**
     * Main DataDoo class
     */
    function DataDoo(params) {
        params = params || {};
        DataDoo.utils.rDefault(params, {
            camera: {
                type : DataDoo.PERSPECTIVE,
                viewAngle : 45,
                near : 0.1,
                far : 20000
            },
            axes: {
                x: {
                    type: DataDoo.NUMBER
                },
                y: {
                    type: DataDoo.NUMBER
                },
                z: {
                    type: DataDoo.NUMBER
                }
            }
        });

        // initialize global eventbus and bucket
        this.eventBus = new EventBus();
        this.bucket = {};

        // create three.js stuff
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0xffffff, 1000, 10000 );

        this.axes = params.axes;

        this.renderer = new THREE.WebGLRenderer({
            canvas : params.canvas,
            antialias: true,
            alpha: false,
            //clearColor: 0xfafafa,
            clearAlpha: 1
        });

        this.renderer.setClearColor( this.scene.fog.color, 1 );
        this.renderer.setSize( window.innerWidth, window.innerHeight);
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.physicallyBasedShading = true;

        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = true;

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

        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1.475 );
        this.directionalLight.position.set( 100, 100, -100 );
        this.scene.add( this.directionalLight );

        this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1.25 );
        this.hemiLight.color.setHSL( 0.6, 1, 0.75 );
        this.hemiLight.groundColor.setHSL( 0.1, 0.8, 0.7 );
        this.hemiLight.position.y = 500;
        this.scene.add( this.hemiLight );

        this.axes = new THREE.AxisHelper(100);
        this.scene.add(this.axes);

        var size = 500, step = 10;

        var geometry = new THREE.Geometry();
        var material = new THREE.LineBasicMaterial( { color: 0xBED6E5, opacity: 0.5, linewidth:2 } );

        for ( var i = - size; i <= size; i += step ) {

            geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
            geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

            geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
            geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );

        }

        this.grid = new THREE.Line( geometry, material, THREE.LinePieces );
        this.scene.add( this.grid );

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    /*DataDoo.prototype.onWindowResize = function( event ) {
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    };*/

    DataDoo.prototype.id = "DD";
    DataDoo.prototype.priority = 5;
    DataDoo.prototype.collapseEvents = true;

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

        var positions = primitives.map(function (primitive) {
            return primitive.getPositions();
        }).flatten();

        this._resolvePositions(positions);

        // call onResolve on all primitives so that
        // they can set positions for three.js primitives
        primitives.each(function (primitive) {
            primitive.onResolve();
        });
    };

    DataDoo.prototype._computeAxisValues = function() {
        _.each(this.axes, function(name, axis) {
            if(axis.type == DataDoo.COLUMNVALUE)
        })
    }

    DataDoo.prototype._addOrRemoveSceneObjects = function (events) {
        _.each(events, function (event) {
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
                    console.log("relation updates");
                    console.dir(event);
                    // Remove old relation primitives and add new ones here

                    _.each(this._getObjects(event.data), function (object) {
                        this.scene.add(object);
                    }, this);
                    break;
            }
            this._addOrRemoveSceneObjects(event.parentEvents);
        }, this);
    };

    DataDoo.prototype._resolvePositions = function(positions) {
        // create dependency linked list
        var start = null;
        var end = null;
        positions.each(function(position) {
            if(!start) {
                start = position;
            }
            if(position._seen) {
                return;
            }

            var pointer = position;
            position._prev = end;
            // compute the current snippet
            do {
                pointer._seen = true;
                pointer._next = pointer.relatedPos;
                if(pointer.relatedPos) {
                    if(pointer.relatedPos._seen) {
                        // insert current snippet into list if
                        // we reach an already seen node
                        position._prev = pointer.relatedPos._prev;
                        if(pointer.relatedPos._prev) {
                            pointer.relatedPos._prev._next = position;
                        } else {
                            start = position;
                        }
                        pointer.relatedPos._prev = pointer;
                        break;
                    }
                    pointer.relatedPos._prev = pointer;
                }else {
                    if(end) {
                        end._next = pointer;
                    }
                    end = pointer;
                }
                pointer = pointer.relatedPos;
            } while(pointer);
        });

        // resolve position by traversing the dependency linked list
        var pos = end;
        while(pos) {
            console.log("Resolving position type=" + pos.type + " (" + pos.x + "," + pos.y + "," + pos.z + ")");

            switch(pos.type) {
                case DataDoo.ABSOLUTE:
                    pos.resolvedX = pos.x;
                    pos.resolvedY = pos.y;
                    pos.resolvedZ = pos.z;
                    break;
                case DataDoo.RELATIVE:
                    pos.resolvedX = pos.relatedPos.resolvedX + pos.x;
                    pos.resolvedY = pos.relatedPos.resolvedY + pos.y;
                    pos.resolvedZ = pos.relatedPos.resolvedZ + pos.z;
                    break;
                case DataDoo.COSY:
                    throw new Error("CoSy position not implemented yet");
            }

            var oldPos = pos;
            pos = pos._prev;
            // clear out all the linked list data
            oldPos._next = undefined;
            oldPos._prev = undefined;
            oldPos._seen = undefined;
        }
    };

    DataDoo.prototype._getObjects = function (nodes) {
        return _.chain(nodes).map(function (node) {
            return node.primitives;
        }).flatten().map(function (primitive) {
            return primitive.objects;
        }).flatten().value();
    };

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
                        publisher : publisher,
                        eventName : eventName,
                        data : data,
                        parentEvents : this._currentParentEvents
                    });
                    return;
                }
            }
            this.schedule.push({
                priority : subscriber.priority,
                subscriber : subscriber,
                events : [
                    {
                        publisher : publisher,
                        eventName : eventName,
                        data : data,
                        parentEvents : this._currentParentEvents
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
            }
            else {
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
