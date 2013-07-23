window.DataDoo = (function () {

    /**
     * Main DataDoo class
     */
    function DataDoo(params) {
        params = params || {};
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
                    axisLabel : "X",
                    axisLineColor : 0xff0000,
                    axisLabelColor : 0xff0000,
                    dir : new THREE.Vector3(1, 0, 0),
                    length : 50
                },
                y : {
                    type : DataDoo.NUMBER,
                    axisLabel : "y-axis",
                    axisLineColor : 0x00ff00,
                    axisLabelColor : 0x00ff00,
                    dir : new THREE.Vector3(0, 1, 0),
                    length : 50
                },
                z : {
                    type : DataDoo.NUMBER,
                    axisLabel : "z-axis",
                    axisLineColor : 0x0000ff,
                    axisLabelColor : 0x0000ff,
                    dir : new THREE.Vector3(0, 0, 1),
                    length : 50
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
        this.scene.add(this.axes);

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

    DataDoo.prototype._getObjects = function (nodes) {
        return _.chain(nodes).map(function (node) {
            return node.primitives;
        }).flatten().map(function (primitive) {
                return primitive.objects;
            }).flatten().value();
    };

    return DataDoo;
})();
