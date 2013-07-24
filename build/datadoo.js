window.DataDoo = (function () {

    /**
     * Main DataDoo class
     */
    function DataDoo(params) {
        params = params || {};
        // initialize an array for maintaining all the labels
        this.labelsArray = [];

        // initialize global eventbus and bucket
        this.eventBus = new DataDoo.EventBus();

        DataDoo.utils.rDefault(params, {
            grid : true,
            camera : {
                type : DataDoo.PERSPECTIVE,
                viewAngle : 45,
                near : 0.1,
                far : 20000,
                position : {x : 0, y : 150, z : 400}
            },
            axes : {
                x : {
                    type : DataDoo.NUMBER,
                    axisLabel : "x-axis",
                    axisLineColor : 0xff0000,
                    axisLabelColor : 0xff0000,
                    axisDir : new THREE.Vector3(1, 0, 0),
                    axisLength : 50,
                    axisWithCone : false,
                    axisThickness : 1
                },
                y : {
                    type : DataDoo.NUMBER,
                    axisLabel : "y-axis",
                    axisLineColor : 0x00ff00,
                    axisLabelColor : 0x00ff00,
                    axisDir : new THREE.Vector3(0, 1, 0),
                    axisLength : 50,
                    axisWithCone : false,
                    axisThickness : 1
                },
                z : {
                    type : DataDoo.NUMBER,
                    axisLabel : "z-axis",
                    axisLineColor : 0x0000ff,
                    axisLabelColor : 0x0000ff,
                    axisDir : new THREE.Vector3(0, 0, 1),
                    axisLength : 50,
                    axisWithCone : false,
                    axisThickness : 1
                }
            },

            lights : {
                directionalLight : {
                    color : 0xffffff,
                    intensity : 1.475,
                    position : {x : 100, y : 100, z : 100}
                },
                hemiLight : {
                    skyColor : 0xffffff,
                    groundColor : 0xffffff,
                    intensity : 1.25,
                    colorHSL : {h : 0.6, s : 1, l : 0.75},
                    groundColorHSL : {h : 0.1, s : 0.8, l : 0.7},
                    position : {x : 0, y : 200, z : 0}
                }
            },

            scene : {
                fog : {
                    color : 0xffffff,
                    near : 1000,
                    far : 10000
                }
            }
        });

        // initialize global eventbus and bucket
        this.eventBus = new DataDoo.EventBus();

        this.bucket = {};

        // create three.js stuff
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            canvas : params.canvas,
            antialias : true,
            alpha : false,
            clearAlpha : 1,
            clearColor : 0xfafafa,
            gammaInput : true,
            gammaOutput : true,
            physicallyBasedShading : true,
            shadowMapEnabled : true,
            shadowMapSoft : true
        });

        this.axesConf = params.axes;
        this.cameraConf = params.camera;
        this.gridBoolean = params.grid;
        this.lightsConf = params.lights;
        this.sceneConf = params.scene;
        this.goldenDim = 500;
    }

    DataDoo.prototype.prepareScene = function () {
        //GRID
        if (this.gridBoolean) {
            var size = this.goldenDim, step = this.goldenDim / 10;

            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({ color : 0xBED6E5, opacity : 0.5, linewidth : 1 });

            for (var i = -size; i <= size; i += step) {

                geometry.vertices.push(new THREE.Vector3(-size, 0, i));
                geometry.vertices.push(new THREE.Vector3(size, 0, i));

                geometry.vertices.push(new THREE.Vector3(i, 0, -size));
                geometry.vertices.push(new THREE.Vector3(i, 0, size));

            }

            this.grid = new THREE.Line(geometry, material, THREE.LinePieces);
            this.scene.add(this.grid);
        }

        //LIGHTS
        var dirLight = this.lightsConf.directionalLight;
        var hemiLight = this.lightsConf.hemiLight;
        this.directionalLight = new THREE.DirectionalLight(dirLight.color, dirLight.intensity);
        this.directionalLight.position.x = dirLight.position.x;
        this.directionalLight.position.y = dirLight.position.y;
        this.directionalLight.position.z = dirLight.position.z;
        this.scene.add(this.directionalLight);

        this.hemiLight = new THREE.HemisphereLight(hemiLight.skyColor, hemiLight.groundColor, hemiLight.intensity);
        this.hemiLight.color.setHSL(hemiLight.colorHSL.h, hemiLight.colorHSL.s, hemiLight.colorHSL.l);
        this.hemiLight.groundColor.setHSL(hemiLight.groundColorHSL.h, hemiLight.groundColorHSL.s, hemiLight.groundColorHSL.l);
        this.hemiLight.position.set(hemiLight.position.x, hemiLight.position.y, hemiLight.position.z);
        this.scene.add(this.hemiLight);

        //SCENE
        this.scene.fog = new THREE.Fog(this.sceneConf.fog.color, this.sceneConf.fog.near, this.sceneConf.fog.far);
        this.renderer.setClearColor(this.scene.fog.color, 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        //AXES
        this.axes = new DataDoo.AxesHelper(this.axesConf.x, this.axesConf.y, this.axesConf.z);
        //this.scene.add(this.axes);

        //CAMERA
        var camSettings = this.cameraConf;
        if (this.cameraConf.type == DataDoo.PERSPECTIVE) {
            this.camera = new THREE.PerspectiveCamera(this.cameraConf.viewAngle, this.renderer.domElement.width / this.renderer.domElement.height, this.cameraConf.near, this.cameraConf.far);
            this.camera.position.set(this.cameraConf.position.x, this.cameraConf.position.y, this.cameraConf.position.z);
            this.camera.lookAt(this.scene.position);
            this.scene.add(this.camera);
        }
        else {
            throw new Error("DataDoo : unknown camera type");
        }

        //CAMERA CONTROLS
        this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        //Projector
        this.projector = new THREE.Projector();

    };

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

        this.prepareScene();

        // start the render loop
        var self = this;

        function renderFrame() {
            DataDoo.utils.requestAnimationFrame(renderFrame);
            // we clear the eventbus, to make sure all the components have run
            self.eventBus.execute();
            // render the frame
            self.renderer.render(self.scene, self.camera);
            self.cameraControls.update();
            self.putLabelsToScreen();
        }

        DataDoo.utils.requestAnimationFrame(renderFrame);
    };

    DataDoo.prototype.handler = function (events) {
        // traverse the event chain and add or remove objects
        this._addOrRemoveSceneObjects(events);

        // compute axis values
        this._computeAxisValues(events);

        // Resolve primitive positions

        // TODO: resolve only dirty nodes/relations
        var primitives = _.chain(this.bucket).values().flatten().filter(function (item) {
            return item instanceof DataDoo.Node || item instanceof DataDoo.Relation;
        }).map(function (node) {
                return node.primitives;
            }).flatten();

        var primCopy = primitives;

        // Find all the label objects and stuff them into the array
        this.labelsArray = primCopy.filter(function(pr){
            return pr instanceof DataDoo.Label;
        }).value();

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


    DataDoo.prototype._computeAxisValues = function (events) {
        var changedDs = _.chain(DataDoo.EventBus.flattenEvents(events)).filter(function(event) {
            return event.eventName.substring(0, 4) == "DATA";
        }).map(function(event) {
            return event.publisher.id;
        }).uniq().value();

        _.each(this.axesConf, function (axis, name) {
            if (axis.type == DataDoo.COLUMNVALUE) {
                var split = axis.column.split(".");
                var dsId = split[0];
                var colName = split[1];
                if (!_.contains(changedDs, dsId)) {
                    return;
                }
                var values = _.pluck(this.bucket[dsId].countBy(colName).toJSON(), colName);
                if (!_.isUndefined(axis.sort)) {
                    values.sort();
                    if (axis.sort == DataDoo.DESCENDING) {
                        values.reverse();
                    }
                }
                var spacing = axis.spacing || (axis.length/values.length);
                var posMap = _.chain(values).map(function (value, i) {
                    return [value, (i + 1) * spacing];
                }).object().value();

                axis.values = values;
                axis.posMap = posMap;
            }
        }, this);
    };

    DataDoo.prototype._addOrRemoveSceneObjects = function (events) {
        DataDoo.EventBus.flatEventsIter(events, function (event) {
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
        }, this);
    };

    DataDoo.prototype._resolvePositions = function (positions) {
        // create dependency linked list
        var start = null;
        var end = null;
        positions.each(function (position) {
            if (!start) {
                start = position;
            }
            if (position._seen) {
                return;
            }

            var pointer = position;
            position._prev = end;
            // compute the current snippet
            do {
                pointer._seen = true;
                pointer._next = pointer.relatedPos;
                if (pointer.relatedPos) {
                    if (pointer.relatedPos._seen) {
                        // insert current snippet into list if
                        // we reach an already seen node
                        position._prev = pointer.relatedPos._prev;
                        if (pointer.relatedPos._prev) {
                            pointer.relatedPos._prev._next = position;
                        }
                        else {
                            start = position;
                        }
                        pointer.relatedPos._prev = pointer;
                        break;
                    }
                    pointer.relatedPos._prev = pointer;
                }
                else {
                    if (end) {
                        end._next = pointer;
                    }
                    end = pointer;
                }
                pointer = pointer.relatedPos;
            } while (pointer);
        });

        // resolve position by traversing the dependency linked list
        var pos = end;
        while (pos) {
            console.log("Resolving position type=" + pos.type + " (" + pos.x + "," + pos.y + "," + pos.z + ")");

            switch (pos.type) {
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
                    for (var axisName in this.axesConf) {
                        var axis = this.axesConf[axisName];
                        var resName = "resolved" + axisName.toUpperCase();
                        if (axis.type == DataDoo.NUMBER) {
                            pos[resName] = pos[axisName];
                        }
                        if (axis.type == DataDoo.COLUMNVALUE) {
                            pos[resName] = axis.posMap[pos[axisName]];
                        }
                    }
                    break;
            }

            var oldPos = pos;
            pos = pos._prev;
            // clear out all the linked list data
            oldPos._next = undefined;
            oldPos._prev = undefined;
            oldPos._seen = undefined;
        }
    };

    DataDoo.prototype.putLabelsToScreen = function(){
        var self = this;
        self.camera.updateMatrixWorld();
        _.each(self.labelsArray, function(label){
            var vector = self.projector.projectVector(label.position.toVector(), self.camera);
            //var vector = self.projector.projectVector(new THREE.Vector3(20,20,20), self.camera);
            vector.x = (vector.x + 1)/2 * self.renderer.domElement.width;
            vector.y = -(vector.y - 1)/2 * self.renderer.domElement.height;
            label.updateElemPos(vector.y, vector.x);
        });
    };

    DataDoo.prototype._getObjects = function (nodes) {
        return _.chain(nodes).map(function (node) {
            return node.primitives;
        }).flatten().map(function (primitive) {
                return primitive.objects;
            }).flatten().value();
    };

    return DataDoo;
})();

(function(DataDoo) {
    /**
     * DataDoo's special priority event bus for propagating
     * changes in the object hierarchy
     */
    function EventBus() {
        this.schedule = []; // contains the list of subscriber to be executed
        this.subscribers = {}; // contains map between publishers and subscribers
        this._currentParentEvents = []; // maintains the parentEvents for the current execution
    }
    DataDoo.EventBus = EventBus;
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
    
    EventBus.flatEventsIter = function(events, callback, context) {
        _.each(events, function(event) {
            callback.call(context || window, event);
            EventBus.flatEventsIter(event.parentEvents, callback, context);
        });
    };

    EventBus.flattenEvents = function(events) {
        var flat = [];
        EventBus.flatEventsIter(events, function(event) { flat.push(event); });
        return flat;
    };
})(window.DataDoo);

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
        NUMBER: 6,

        // sort order
        ASCENDING: 7,
        DESCENDING: 8
    });
})(window.DataDoo);

(function (DataDoo) {
    DataDoo.utils = {
        rDefault : function (target, source) {
            if (source !== null && typeof source === 'object') {
                for (var prop in source) {
                    if (prop in target) {
                        this.rDefault(target[prop], source[prop]);
                    }
                    else {
                        target[prop] = source[prop];
                    }
                }
            }
        },

        // Request animationframe helper
        _raf : (
            window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                function (callback) {
                    return window.setTimeout(callback, 1000 / 60);
                }
            ),

        requestAnimationFrame : function (callback) {
            return this._raf.call(window, callback);
        },

        makeTextSprite : function (message, parameters) {
            if (parameters === undefined) parameters = {};

            var fontface = parameters.hasOwnProperty("fontface") ?
                parameters.fontface : "Arial";

            var fontsize = parameters.hasOwnProperty("fontsize") ?
                parameters.fontsize : 18;

            var textColor = parameters.hasOwnProperty("textColor") ?
                parameters.textColor : "rgba(0, 0, 0, 1.0)";

            var borderThickness = parameters.hasOwnProperty("borderThickness") ?
                parameters.borderThickness : 0;

            var borderColor = parameters.hasOwnProperty("borderColor") ?
                parameters.borderColor : { r : 0, g : 0, b : 0, a : 1.0 };

            var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
                parameters.backgroundColor : { r : 204, g : 204, b : 204, a : 0.6 };

            var spriteAlignment = THREE.SpriteAlignment.topLeft;

            var canvas = document.getElementById("helperCanvas");
            if (!canvas) {
                canvas = document.createElement('canvas');
            }
            canvas.setAttribute("id", "helperCanvas");
            var context = canvas.getContext('2d');
            context.clearRect();
            context.font = fontsize + "px " + fontface;

            // get size data (height depends only on font size)
            var metrics = context.measureText(message);
            var textWidth = metrics.width;

            // background color
            context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
            // border color
            context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

            context.lineWidth = borderThickness;
            //DataDoo.utils.makeRoundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
            // 1.4 is extra height factor for text below baseline: g,j,p,q.

            // text color
            var tColor = new THREE.Color(textColor);

            context.fillStyle = "rgba(" + tColor.r * 255 + "," + tColor.g * 255 + "," + tColor.b * 255 + "," + " 1.0)";
            //context.fillStyle = "rgba(0.99, 0,0, 1.0)";

            context.fillText(message, borderThickness, fontsize + borderThickness);

            // canvas contents will be used for a texture
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;

            var spriteMaterial = new THREE.SpriteMaterial(
                { map : texture, useScreenCoordinates : false, alignment : spriteAlignment });
            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(100, 50, 1.0);
            return sprite;
        },

        makeRoundRect : function (ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
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

        // if any one of the coordinate values are non numeric
        // then set the type to COSY
        if(!_.isNumber(this.x)  || !_.isNumber(this.y) || !_.isNumber(this.z)) {
            this.type = DataDoo.COSY;
        }
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

    //This is a helper function to align any object in a direction
    Primitive.prototype.setDirection = function (obj) {
        var axis = new THREE.Vector3();
        var radians;

        return function (dir, obj) {
            // dir is assumed to be normalized
            if (dir.y > 0.99999) {
                obj.quaternion.set(0, 0, 0, 1);
            }
            else if (dir.y < -0.99999) {
                obj.quaternion.set(1, 0, 0, 0);
            }
            else {
                axis.set(dir.z, 0, -dir.x).normalize();
                radians = Math.acos(dir.y);
                obj.quaternion.setFromAxisAngle(axis, radians);
            }
        };
    }();
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
     *  Line primitive
     */
    function Line(startPos, endPos, lineLength, dir, color, thickness, opacity) {
        THREE.Object3D.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0xcccccc;
        this.startPos = startPos || new DataDoo.Position(0,0,0);
        this.direction = dir || new THREE.Vector3(1,0,0);
        this.lineLength = lineLength || 50;
        this.direction.normalize();

        if(endPos){
            this.endPos = endPos;
        }
        else{
            var endPosX = this.startPos.x + (this.lineLength*this.direction.x);
            var endPosY = this.startPos.y + (this.lineLength*this.direction.y);
            var endPosZ = this.startPos.z + (this.lineLength*this.direction.z);

            this.endPos = new DataDoo.Position(endPosX, endPosY, endPosZ);
        }

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
        this.lineMaterial = new THREE.LineBasicMaterial( { color: this.color, linewidth: this.thickness, opacity: this.opacity } );
        this.line = new THREE.Line( this.lineGeometry, this.lineMaterial );

        this.objects = [this.line];
    }
    Line.prototype = Object.create(Primitive.prototype);
    Line.prototype.getPositions = function() {
        return [this.startPos, this.endPos];
    };
    Line.prototype.onResolve = function() {
        this.startPos.applyToVector(this.lineGeometry.vertices[0]);
        this.endPos.applyToVector(this.lineGeometry.vertices[1]);
        this.lineGeometry.computeLineDistances();
    };
    DataDoo.Line = Line;


    /**
     *  Cone primitive
     */
    function Cone(height, topRadius, baseRadius, position, dir, color, opacity) {
        THREE.Object3D.call(this);

        this.position = position || new DataDoo.Position(0,0,0);
        this.height = height || 5;
        this.topRadius = topRadius || 0;
        this.baseRadius = baseRadius || 5;
        this.opacity = opacity || 1;
        this.color = color || 0xcccccc;
        this.direction = dir || new THREE.Vector3(0,1,0);


        var coneGeometry = new THREE.CylinderGeometry(this.topRadius, this.baseRadius, this.height, 10, 10);
        var coneMat = new THREE.MeshLambertMaterial({ color : this.color, opacity : this.opacity  });
        this.cone = new THREE.Mesh(coneGeometry, coneMat);
        this.setDirection(this.direction, this.cone);

        this.objects = [this.cone];
    }
    Cone.prototype = Object.create(Primitive.prototype);
    Cone.prototype.getPositions = function() {
        return [this.position];
    };
    Cone.prototype.onResolve = function() {
        this.position.applyToVector(this.cone.position);
    };
    DataDoo.Cone = Cone;

    /**
     *  Arrow primitive
     */
    function Arrow(configObj) {
        configObj = configObj || {};

        /*configObj = {
            from : new DataDoo.Position(),
            to : new DataDoo.Position(), //if "to" is provided, the lineLength and lineDirection params are ignored

            lineLength : 100,
            lineDirection : new THREE.Vector3(1,0,0), //assumed normalized
            lineDivisions : 10,
            lineColor : 0x000000,
            lineThickness : 1,
            lineOpacity : 1,

            fromCone : true,
            fromConeHeight : 10,
            fromConeTopRadius : 5,
            fromConeBaseRadius : 5,
            fromConeColor : 0x000000,
            fromConeOpacity : 1,

            toCone : true,
            toConeHeight : 10,
            toConeBaseRadius : 5,
            toConeColor : 0x000000,
            toConeOpacity : 1
        }*/

        THREE.Object3D.call(this);
        this.type = configObj.type;

        this.fromPosition = configObj.from || new DataDoo.Position(0,0,0);


        this.arrowLineDirection = configObj.lineDirection || new THREE.Vector3(1, 0, 0);
        this.arrowLineLength = configObj.lineLength || 50;
        this.arrowLineOpacity = configObj.lineOpacity || 1;
        this.arrowLineThickness = configObj.lineThickness || 1;
        this.arrowLineDivisions = configObj.lineDivisions || 0;
        this.arrowLineColor = configObj.lineColor || 0x000000;

        this.fromCone = configObj.fromCone;
        this.fromConeHeight = configObj.fromConeHeight;
        this.fromConeTopRadius = configObj.fromConeTopRadius;
        this.fromConeBaseRadius = configObj.fromConeBaseRadius;
        this.fromConeColor = configObj.fromConeColor;
        this.fromConeOpacity = configObj.fromConeOpacity;

        this.toCone = configObj.toCone;
        this.toConeHeight = configObj.toConeHeight;
        this.toConeTopRadius = configObj.toConeBaseRadius;
        this.toConeBaseRadius = configObj.toConeBaseRadius;
        this.toConeColor = configObj.toConeColor;
        this.toConeOpacity = configObj.toConeOpacity;

        if(configObj.to){
            this.toPosition = configObj.to;
        }
        else{
            var toPosX = this.fromPosition.x + (this.arrowLineLength*this.arrowLineDirection.x);
            var toPosY = this.fromPosition.y + (this.arrowLineLength*this.arrowLineDirection.y);
            var toPosZ = this.fromPosition.z + (this.arrowLineLength*this.arrowLineDirection.z);

            this.toPosition = new DataDoo.Position(toPosX, toPosY, toPosZ);
        }
        this.arrow = new THREE.Object3D();

        this.line = new DataDoo.Line(this.fromPosition, this.toPosition, this.arrowLineLength, this.arrowLineDirection, this.arrowLineColor, this.arrowLineThickness, this.arrowLineOpacity);
        this.arrow.add(this.line);

        if(this.fromCone){
            this.fromCone = new DataDoo.Cone(this.fromConeHeight, this.fromConeTopRadius, this.fromConeBaseRadius, this.fromPosition, this.arrowLineDirection.clone().negate(), this.fromConeColor, this.fromConeOpacity);
            this.arrow.add(this.fromCone);
        }

        if(this.toCone){
            this.toCone = new DataDoo.Cone(this.toConeHeight, this.toConeTopRadius, this.toConeBaseRadius, this.toPosition, this.arrowLineDirection, this.toConeColor, this.toConeOpacity);
            this.arrow.add(this.toCone);
        }

        this.objects = [this.arrow];

    }
    Arrow.prototype = Object.create(Primitive.prototype);
    Arrow.prototype.getPositions = function() {
        return [this.fromPosition, this.toPosition];
    };
    Arrow.prototype.onResolve = function() {
        //ToDo : Fix this area!!

        /*this.fromPosition.applyToVector(this.line.geometry.vertices[0]);
        this.toPosition.applyToVector(this.line.geometry.vertices[1]);*/
        this.line.onResolve();
        if(this.fromCone){
            this.fromPosition.applyToVector(this.fromCone.position);
        }
        if(this.toCone){
            this.toPosition.applyToVector(this.toCone.position);
        }
    };
    DataDoo.Arrow = Arrow;

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


    /**
     *  Label primitive
     */
    function Label(message, position, offset){
        THREE.Object3D.call(this);

        //Trick borrowed from MathBox!
        var element = document.createElement('div');
        var inner = document.createElement('div');
        element.appendChild(inner);

        // Position at anchor point
        element.className = 'datadoo-label';
        inner.className = 'datadoo-wrap';
        inner.style.position = 'relative';
        inner.style.display = 'inline-block';
        inner.style.left = '-50%';
        inner.style.top = '-.5em';

        this.message = message;
        this.position = position;
        this.element = element;
        this.distanceX = offset.x || 10;
        this.distanceY = offset.y || 10;
        this.width = 0;
        this.height = 0;
        this.visible = true;
        this.content = this.message;

        element.style.position = 'absolute';
        element.style.left = 0;
        element.style.top = 0;
        //element.style.opacity = 0;
        inner.appendChild(document.createTextNode(this.message));

        this.objects = [this.element];
        document.body.appendChild(element);
    }
    Label.prototype = Object.create(Primitive.prototype);
    Label.prototype.getPositions = function() {
        return [this.position];
    };
    Label.prototype.onResolve = function() {};
    Label.prototype.updateElemPos = function(top, left) {
        this.element.style.top = top + this.distanceY + "px";
        this.element.style.left = left + this.distanceX + "px";
    };
    DataDoo.Label = Label;

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

(function (DataDoo) {

    /*
     This is just a wrapper around THREE.js stuff.
     Did not want to make changes in threejs files because then they would be bound to the DataDoo repo.
     */

    function AxisHelper(configObj) {
        /*dir, origin, length, axisLineColor, axisLabel, axisLabelColor*/
        console.dir(configObj);
        THREE.Object3D.call(this);
        this.type = configObj.type;
        this.axisWithCone = configObj.axisWithCone || false;
        this.axisDir = configObj.axisDir || new THREE.Vector3(1, 0, 0);
        this.origin = configObj.origin || new THREE.Vector3(0, 0, 0);
        this.axisLength = configObj.axisLength || 50;
        this.axisThickness = configObj.axisThickness || 1;
        this.axisDivisions = configObj.axisDivisions || 10;
        this.axisLabelStartingFrom  = configObj.axisLabelStartingFrom || 0;

        this.axisLineColor = configObj.axisLineColor || 0xffff00;
        this.axisLabel = configObj.axisLabel || "empty label";
        this.axisLabelColor = configObj.axisLabelColor || 0xffff00;

        this.axisDir.normalize();

        this.position = this.origin;

        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lineGeometry.vertices.push(new THREE.Vector3(0, this.axisLength, 0));

        this.line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color : this.axisLineColor, opacity : 0.5, linewidth : this.axisThickness  }));
        this.line.matrixAutoUpdate = false;
        this.add(this.line);

        var coneGeometry = new THREE.CylinderGeometry(0, 5, 10, 10, 10);
        //coneGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.875, 0));

        this.cone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color : this.axisLineColor, opacity : 0.5  }));
        this.cone.position.set(0, this.axisLength , 0);
        //this.cone.matrixAutoUpdate = false;
        this.add(this.cone);
        this.cone.visible = this.axisWithCone;

        this.labelSprite = DataDoo.utils.makeTextSprite(this.axisLabel || "X Axis", {textColor : this.axisLabelColor});
        this.add(this.labelSprite);
        this.labelSprite.position.set(-0.1, this.axisLength, 0);



        if(this.type === DataDoo.NUMBER){
            var num = parseInt(this.axisLength/this.axisDivisions, 10);
            var ptGeom = new THREE.SphereGeometry(0.01 * 100);
            var ptMat = new THREE.MeshBasicMaterial({color:0x000000});
            var labelNum = this.axisLabelStartingFrom;
            var params = {
                fontSize : 0.1 * 100,
                textColor : 0x000000
            };

            for(var x = 0; x < num; x++){
                var pt = new THREE.Mesh(ptGeom, ptMat);
                var label = DataDoo.utils.makeTextSprite(labelNum + x, params);
                pt.add(label);
                this.line.add(pt);
                pt.position.set(0, (x/num)*(this.axisLength), 0);
            }
        }

        this.setDirection(this.axisDir);
    }

    AxisHelper.prototype = Object.create(THREE.Object3D.prototype);

    AxisHelper.prototype.setDirection = function () {
        var axis = new THREE.Vector3();
        var radians;

        return function (dir) {
            // dir is assumed to be normalized
            if (dir.y > 0.99999) {
                this.quaternion.set(0, 0, 0, 1);
            }
            else if (dir.y < -0.99999) {
                this.quaternion.set(1, 0, 0, 0);
            }
            else {
                axis.set(dir.z, 0, -dir.x).normalize();
                radians = Math.acos(dir.y);
                this.quaternion.setFromAxisAngle(axis, radians);
            }
        };
    }();

    AxisHelper.prototype.setLength = function (length) {
        this.scale.set(length, length, length);
    };

    AxisHelper.prototype.setColor = function (hex) {
        this.line.material.color.setHex(hex);
        this.cone.material.color.setHex(hex);
    };

    function AxesHelper(xObj, yObj, zObj) {
        THREE.Object3D.call(this);

        this.xObj = xObj || {};
        this.yObj = yObj || {};
        this.zObj = zObj || {};

        this.xAxis = new DataDoo.AxisHelper(this.xObj);
        this.add(this.xAxis);

        this.yAxis = new DataDoo.AxisHelper(this.yObj);
        this.add(this.yAxis);

        this.zAxis = new DataDoo.AxisHelper(this.zObj);
        this.add(this.zAxis);
    }

    AxesHelper.prototype = Object.create(THREE.Object3D.prototype);

    DataDoo.AxisHelper = AxisHelper;
    DataDoo.AxesHelper = AxesHelper;
})(window.DataDoo);