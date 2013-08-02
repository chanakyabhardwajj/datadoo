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
                fov : 45,
                nearP : 0.1,
                farP : 20000,
                nearO : -50,
                farO : 10000,
                position : {x : 0, y : 150, z : 400}
            },
            axes : {
                x : {
                    type : DataDoo.NUMBER,
                    label : "x-axis",
                    length : 150,
                    withCone : false,
                    thickness : 1,
                    lineColor : "0x000000",
                    coneColor : "0x000000",
                    notches : true,
                    notchSpacing : 5,
                    notchStartingFrom : 0,
                    origin : new THREE.Vector3(0,0,0)
                },
                y : {
                    type : DataDoo.NUMBER,
                    label : "y-axis",
                    length : 150,
                    withCone : false,
                    thickness : 1,
                    lineColor : "0x000000",
                    coneColor : "0x000000",
                    notchSpacing : 5,
                    notchStartingFrom : 0,
                    origin : new THREE.Vector3(0,0,0)
                },
                z : {
                    type : DataDoo.NUMBER,
                    label : "z-axis",
                    length : 150,
                    withCone : false,
                    thickness : 1,
                    lineColor : "0x000000",
                    coneColor : "0x000000",
                    notchSpacing : 5,
                    notchStartingFrom : 0,
                    origin : new THREE.Vector3(0,0,0)
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

        // list of timers
        this.timers = [];

        // create three.js stuff
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            canvas : params.canvas,
            antialias : true,
            alpha : false,
            clearAlpha : 1,
            //clearColor : "0xffaa00",
            gammaInput : true,
            gammaOutput : true,
            physicallyBasedShading : true,
            shadowMapEnabled : true,
            shadowMapSoft : true
        });
        this.renderer.setClearColorHex(0xffffff, 1);

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
            this.grid.position.y = -0.5;
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
        //this.renderer.setClearColor(this.scene.fog.color, 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        //AXES
        this.axes = new DataDoo.AxesHelper(this.axesConf.x, this.axesConf.y, this.axesConf.z);
        this.bucket.axes = this.axes;
        this.scene.add(this.axes);

        //CAMERA
        var camSettings = this.cameraConf;
        this.camera = new THREE.CombinedCamera( this.renderer.domElement.width / 2, this.renderer.domElement.height / 2, this.cameraConf.fov, this.cameraConf.nearP, this.cameraConf.farP, this.cameraConf.nearO, this.cameraConf.farO );
        this.camera.position.set(this.cameraConf.position.x, this.cameraConf.position.y, this.cameraConf.position.z);
        this.camera.lookAt(this.scene.position);
        this.scene.add(this.camera);
        if (this.cameraConf.type == DataDoo.PERSPECTIVE) {
            this.camera.toPerspective();
        }
        else if (this.cameraConf.type == DataDoo.ORTHOGRAPHIC) {
            this.camera.toOrthographic();
        }
        else {
            throw new Error("DataDoo : unknown camera type");
        }

        //CAMERA CONTROLS
        //this.cameraControls = new DataDoo.CameraControls(this.camera, this.renderer.domElement);
        this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.cameraControls.maxDistance=10000;
        this.cameraControls.minDistance=5;
        this.cameraControls.autoRotate = false;

        //this.cameraControls = new THREE.TrackballControls(this.camera, this.renderer.domElement);

        //Projector
        this.projector = new THREE.Projector();

        // frustum and projection matrix
        // for manual frustum culling of html labels
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();

        // update the matrix once, so that positions
        // can be calculated for the first time
        this.scene.updateMatrixWorld();
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
            _.each(self.timers, function(timer) {
                timer.tick();
            });
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

        // set matrix world needs update on all ddobjects
        DataDoo.utils.traverseObject3D(this.scene, function(object) {
            if(object instanceof DataDoo.DDObject3D) {
                object.matrixWorldNeedsUpdate = true;
            }
        });

        // call update on all objects
        _.chain(this.bucket).values().map(function(object) {
            if(object instanceof DataDoo.RelationSet) {
                return object.getArray();
            } else {
                return object;
            }
        }).flatten().filter(function(object) {
            return object instanceof DataDoo.DDObject3D;
        }).each(function(object) {
            object.update(this.axesConf);
        }, this);

        // Find all the label objects and stuff them into the array
        this.labelsArray = [];
        //ToDo : Instead of the scene, use the bucket!!
        DataDoo.utils.traverseObject3D(this.scene, function(object){
            if(object instanceof DataDoo.Label) {
                this.labelsArray.push(object);
            }
        }, this);
    };


    DataDoo.prototype._computeAxisValues = function (events) {
        var changedDs = _.chain(DataDoo.EventBus.flattenEvents(events)).filter(function(event) {
            return event.eventName.substring(0, 4) == "DATA";
        }).map(function(event) {
            return event.publisher.id;
        }).uniq().value();

        _.each(this.axesConf, function (axis, name) {
            if (axis.type == DataDoo.COLUMNVALUE) {
                var columns = _.isArray(axis.column)?axis.column:[axis.column];

                columns = _.map(columns, function(column) {
                    return column.split(".");
                });

                // check if atleast one of the dataset
                // in column config has changed
                var i;
                for(i = 0;i < columns.length;i++) {
                    if(_.contains(changedDs, columns[i][0])) {
                        break;
                    }
                }
                if(i == columns.length) {
                    return; // no columns changed so nothing to do here
                }

                var values = _.chain(columns).map(function(split) {
                    var dsId = split[0];
                    var colName = split[1];
                    //weird case : in the 1st iteration there is no data in the bucket, thus erring out.
                    if(this.bucket[dsId].column(colName)){
                        return _.pluck(this.bucket[dsId].countBy(colName).toJSON(), colName);
                    } else {
                        return [];
                    }
                }, this).flatten().uniq().value();

                if (axis.sort) {
                    var sortFunc = _.isFunction(axis.sortFunc)?axis.sortFunc:_.identity;
                    values = _.sortBy(values, sortFunc);
                    if (axis.sortOrder == DataDoo.DESCENDING) {
                        values.reverse();
                    }
                }
                var spacing = axis.notchSpacing || (axis.length/values.length);
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
                    _.each(event.data, function (object) {
                        this.scene.add(object);
                    }, this);
                    break;
                case "NODE.DELETE":
                    _.each(event.data, function (object) {
                        this.scene.remove(object);
                    }, this);
                    break;
                case "NODE.UPDATE":
                    _.each(event.data.added, function (object) {
                        this.scene.add(object);
                    }, this);
                    _.each(event.data.removed, function (object) {
                        this.scene.remove(object);
                    }, this);
                    break;

                case "RELATION.UPDATE":
                    _.each(event.data.added, function (object) {
                        this.scene.add(object);
                    }, this);

                    _.each(event.data.removed, function (object) {
                        this.scene.remove(object);
                    }, this);
                    break;
            }
        }, this);
    };

    DataDoo.prototype.putLabelsToScreen = function(){
        this.axes.uncrowdLabels(this.camera);

        this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromMatrix(this.projScreenMatrix);

        _.each(this.labelsArray, function(label){
            var vector = new THREE.Vector3();
            vector.getPositionFromMatrix( label.matrixWorld );

            if(!label.visible || !this.frustum.containsPoint(vector)) {
                label.hideElem();
            } else {
                var vector2 = this.projector.projectVector(vector.clone(), this.camera);
                vector2.x = (vector2.x + 1)/2 * this.renderer.domElement.width;
                vector2.y = -(vector2.y - 1)/2 * this.renderer.domElement.height;
                label.updateElemPos(vector2.y, vector2.x);
            }
        }, this);
    };

    DataDoo.Sort = {
        Week : (function() {
            var weeks = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

            return function(value) {
                return _.indexOf(weeks, value.toLowerCase().substring(0, 3));
            };
        })()
    };

    return DataDoo;
})();
