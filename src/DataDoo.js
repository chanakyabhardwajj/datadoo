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
                    label : "x-axis",
                    lineColor : "0x000000",
                    labelColor : "0x000000",
                    length : 150,
                    withCone : false,
                    thickness : 1
                },
                y : {
                    type : DataDoo.NUMBER,
                    label : "y-axis",
                    lineColor : "0x000000",
                    labelColor :"0x000000",
                    length : 150,
                    withCone : false,
                    thickness : 1
                },
                z : {
                    type : DataDoo.NUMBER,
                    label : "z-axis",
                    lineColor : "0x000000",
                    labelColor :"0x000000",
                    length : 150,
                    withCone : false,
                    thickness : 1
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
        this.axes = new DataDoo.AxesHelper(new THREE.Vector3(0,0,0), this.axesConf.x, this.axesConf.y, this.axesConf.z);
        this.bucket.axes = this.axes;
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

        //Projector
        this.projector = new THREE.Projector();

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
        _.chain(this.bucket).values().flatten().filter(function(object) {
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
                var spacing = axis.spacing || (axis.axisLength/values.length);
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
        var self = this;

        self.camera.updateMatrixWorld();
        _.each(self.labelsArray, function(label){
            var vector = new THREE.Vector3();
            vector.getPositionFromMatrix( label.matrixWorld );
            var vector2 = self.projector.projectVector(vector.clone(), self.camera);
            vector2.x = (vector2.x + 1)/2 * self.renderer.domElement.width;
            vector2.y = -(vector2.y - 1)/2 * self.renderer.domElement.height;
            label.updateElemPos(vector2.y, vector2.x);
        });
    };

    return DataDoo;
})();
