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

        /*this.renderer = new THREE.CanvasRenderer({
            canvas : params.canvas,
            antialias: true,
            alpha: false,
            //clearColor: 0xfafafa,
            clearAlpha: 1
        });*/

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
            if(axis.type == DataDoo.COLUMNVALUE){}
        });
    };

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

(function(DataDoo) {
    _.extend(DataDoo, {
        // camera type
        PERSPECTIVE : 1,

        // position types
        ABSOLUTE : 2,
        RELATIVE : 3,
        COSY : 4,

        // Axis types
        COLUMNVALUE: 5,
        NUMBER: 6
    });
})(window.DataDoo);

(function(DataDoo) {
    DataDoo.utils = {
        rDefault: function(target, source) {
            for(var prop in source) {
                if(prop in target) {
                    this.rDefault(target[prop], source[prop]);
                } else {
                    target[prop] = source[prop];
                }
            }
        }
    };
})(window.DataDoo);

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
    function Position(x, y, z, type, relatedPos) {
        this.resolvedX = 0;
        this.resolvedY = 0;
        this.resolvedZ = 0;
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.type = type || DataDoo.ABSOLUTE;
        this.relatedPos = (type == DataDoo.RELATIVE?relatedPos:null);
    }
    Position.prototype.setType = function(type) {
        this.type = type;
    };
    Position.prototype.set = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
    Position.prototype.setX = function(x) {
        this.x = x;
    };
    Position.prototype.setY = function(y) {
        this.x = y;
    };
    Position.prototype.setZ = function(z) {
        this.x = z;
    };
    Position.prototype.relative = function(x, y, z) {
        return new Position(x, y, z, DataDoo.RELATIVE, this);
    };
    Position.prototype.applyToVector = function(vec) {
        vec.set(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    Position.prototype.toVector = function() {
        return new THREE.Vector3(this.resolvedX, this.resolvedY, this.resolvedZ);
    };
    DataDoo.Position = Position;
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
    DataDoo.Primitive = Primitive;

    /**
     *  Sphere primitive
     */
    function Sphere(radius, color, center) {
        this.radius = radius || 10;
        this.color = color || 0x8888ff;
        this.center = center || new DataDoo.Position(0,0,0);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius,20,20);
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
     *  DashedLine primitive
     */
    function DashedLine(startPos, endPos, color, dashSize, gapSize, radius) {
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

    /**
     *  Spline primitive
     */
    function Spline(points, color, subdivisions){
        this.points = points;
        this.color = color || 0xfc12340;
        this.subdivisions = subdivisions || 6;
        this.spline = new THREE.Spline( points );
        this.geometrySpline = new THREE.Geometry();
        this.position = new DataDoo.Position(0,0,0);

        for ( var i = 0; i < this.points.length * this.subdivisions; i ++ ) {
            var index = i / ( this.points.length * this.subdivisions );
            var position = this.spline.getPoint( index );
            this.geometrySpline.vertices[ i ] = new THREE.Vector3( position.x, position.y, position.z );
        }
        this.geometrySpline.computeLineDistances();

        this.mesh = new THREE.Line( this.geometrySpline, new THREE.LineDashedMaterial( { color: this.color, dashSize: 4, gapSize: 2, linewidth : 3 } ), THREE.LineStrip );
        this.objects = [this.mesh];
    }
    Spline.prototype = Object.create(Primitive.prototype);
    Spline.prototype.getPositions = function() {
        return [this.position];
    };
    Spline.prototype.onResolve = function() {
        this.position.applyToVector(this.mesh.position);
    };
    DataDoo.Spline = Spline;

    /**
     *  Sprite primitive
     */
    function Sprite(url, datadooPosition, scale){
        this.map = THREE.ImageUtils.loadTexture(url);
        this.scale = scale;
        this.material = new THREE.SpriteMaterial( { map: this.map, useScreenCoordinates: false, color: 0xffffff, fog: true } );
        this.position = datadooPosition || new DataDoo.Position(0,0,0);
        this.sprite = new THREE.Sprite( this.material );
        this.sprite.scale.x = this.sprite.scale.y = this.sprite.scale.z = this.scale;
        this.objects = [this.sprite];
    }

    Sprite.prototype = Object.create(Primitive.prototype);
    Sprite.prototype.getPositions = function() {
        return [this.position];
    };
    Sprite.prototype.onResolve = function() {
        this.position.applyToVector(this.sprite.position);
        //this.sprite.position.multiplyScalar(this.radius);
    };
    DataDoo.Sprite = Sprite;

})(window.DataDoo);

(function(DataDoo) {

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(data) {
        this.primitives = [];
        this.data = data || {};
    }

    Relation.prototype.addSpline= function(points, color, subdivisions) {
        var spline = new DataDoo.Spline(points, color, subdivisions);
        this.primitives.push(spline);
        return spline;
    };

    Relation.prototype.addDashedLine = function(startPos, endPos, color, dashSize, gapSize, radius) {
        var line = new DataDoo.DashedLine(startPos, endPos, color, dashSize, gapSize, radius);
        this.primitives.push(line);
        return line;
    };

    Relation.prototype.addSprite = function(url, position, scale) {
        var sprite = new DataDoo.Sprite(url, position, scale);
        this.primitives.push(sprite);
        return sprite;
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

        // put the relations array
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
        console.log("RelationGenerator" + this.id +": Received An Event");
        this.generateRelations();
        this.dd.eventBus.enqueue(this, "RELATION.UPDATE", this.relations);
    };

    RelationGenerator.prototype.generateRelations = function() {
        this.relations = this.appFn(this.dd.bucket);
        this.dd.bucket[this.id] = this.relations;
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
    Node.prototype.addDashedLine = function(startPos, endPos, color, dashSize, gapSize, radius) {
        var line = new DataDoo.DashedLine(startPos, endPos, color, dashSize, gapSize, radius);
        this.primitives.push(line);
        return line;
    };

    Node.prototype.addSprite = function(url, position, scale) {
        var sprite = new DataDoo.Sprite(url, position, scale);
        this.primitives.push(sprite);
        return sprite;
    };
    DataDoo.Node = Node;

    DataDoo.NodeGenerator = NodeGenerator;
})(window.DataDoo);
