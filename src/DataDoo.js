//Following the module pattern for DataDoo.
//Details here : http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html

window.DataDoo = (function () {
    "use strict";
    function DataDoo(datasets, params) {
        //datasets parameter could be a single instance or an array of DataDoo.Dataset instances.
        this.datasets = [];
        if (arguments.length > 0) {
            //The following converts the input parameter to an array
            var datasetInput = [].concat(arguments[0]);
            for (var i = 0, j = datasetInput.length; i < j; i++) {
                if (datasetInput[i] instanceof DataDoo.Dataset) {
                    this.datasets.push(datasetInput[i]);
                }
                else {
                    throw new Error("The following argument is not a valid dataset : " + datasetInput[i]);
                }
            }
        }

        //params is of the type :
        //{
        //    canvas : id,
        //    title : "",
        //    description : "",
        //    grid : true,
        //    camera : {},
        //    axes : {
        //        x : {},
        //        y : {},
        //        z : {}
        //    },
        //    lights : {},
        //    scene : {
        //       fog : {}
        //    },
        //    goldenDim : 500,
        //    theme : 11
        //}
        params = params || {};
        params = _.extend(DataDoo.sceneDefaultParams, params);

        this.gridBoolean = params.grid;
        this.gridStep = params.gridStep;
        this.goldenDim = params.goldenDim;
        this.theme = DataDoo.themes[params.theme];

        //Title and Description
        this.title = params.title;
        this.description = params.description;

        var box = $("<div></div>");
        var titleBlock = $("<h3></h3>");
        titleBlock.text(this.title);

        var descBlock = $("<h5></h5>");
        descBlock.text(this.description);

        box.append(titleBlock);
        box.append(descBlock);
        box.css({"position" : "absolute", "margin" : "auto", "width" : "100%"});
        $("body").append(box);

        if (params.canvas === undefined) {
            params.canvas = document.createElement('canvas');
            params.canvas.width = window.innerWidth;
            params.canvas.height = window.innerHeight;
            document.body.appendChild(params.canvas);
        }

        this.canvas = params.canvas;

        this.scene = new THREE.Scene();
        this.scene2 = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            canvas : this.canvas,
            antialias : true,
            alpha : false,
            clearAlpha : 1,
            gammaInput : true,
            gammaOutput : true,
            physicallyBasedShading : true,
            shadowMapEnabled : true,
            shadowMapSoft : true
        });
        //this.renderer.sortObjects = false;
        this.renderer.autoClear = false;

        /*this.renderer.setClearColor(0xffffff, 1);*/
        this.renderer.setClearColor(this.theme[4], 1);

        this.axesConf = params.axes;
        this.cameraConf = params.camera;

        
        this.lightsConf = params.lights;
        this.sceneConf = params.scene;

        //Internal Arrays
        this._labelsDom = document.createElement("div");
        this._labelsDom.className = "labelDom";
        document.body.appendChild(this._labelsDom);
        this._labels = [];
        this._3Dlabels = [];
        this._sprites = [];
        this._nodes = [];
        this._intersectables = [];

    }

    DataDoo.prototype.prepareScene = function () {
        //LIGHTS
        var dirLight = this.lightsConf.directionalLight;
        this.directionalLight = new THREE.PointLight(dirLight.color, dirLight.intensity);
        this.directionalLight.position.x = dirLight.position.x;
        this.directionalLight.position.y = dirLight.position.y;
        this.directionalLight.position.z = dirLight.position.z;
        this.scene.add(this.directionalLight);

        var dirLight2 = this.lightsConf.directionalLight;
        this.directionalLight2 = new THREE.PointLight(dirLight.color, dirLight.intensity);
        this.directionalLight2.position.x = -dirLight.position.x;
        this.directionalLight2.position.y = -dirLight.position.y;
        this.directionalLight2.position.z = -dirLight.position.z;
        this.scene.add(this.directionalLight2);

        var hemiLight = this.lightsConf.hemiLight;
        this.hemiLight = new THREE.HemisphereLight(hemiLight.skyColor, hemiLight.groundColor, hemiLight.intensity);
        this.hemiLight.color.setHSL(hemiLight.colorHSL.h, hemiLight.colorHSL.s, hemiLight.colorHSL.l);
        this.hemiLight.groundColor.setHSL(hemiLight.groundColorHSL.h, hemiLight.groundColorHSL.s, hemiLight.groundColorHSL.l);
        this.hemiLight.position.set(hemiLight.position.x, hemiLight.position.y, hemiLight.position.z);
        this.scene.add(this.hemiLight);

        this.scene2.add(new THREE.AmbientLight({color : this.theme[2]}));

        //SCENE
        this.scene.fog = new THREE.Fog(this.sceneConf.fog.color, this.sceneConf.fog.near, this.sceneConf.fog.far);
        this.renderer.setSize(this.renderer.domElement.width, this.renderer.domElement.height);

        //CAMERA
        this.camera = new THREE.CombinedCamera(this.renderer.domElement.width / 2, this.renderer.domElement.height / 2, this.cameraConf.fov, this.cameraConf.nearP, this.cameraConf.farP, this.cameraConf.nearO, this.cameraConf.farO);
        this.camera.position.set(this.cameraConf.position.x, this.cameraConf.position.y, this.cameraConf.position.z);
        this.camera.lookAt(this.scene.position);
        this.scene.add(this.camera);
        if (this.cameraConf.type == "PERSPECTIVE") {
            this.camera.toPerspective();
        }
        else if (this.cameraConf.type == "ORTHOGRAPHIC") {
            this.camera.toOrthographic();
        }
        else {
            throw new Error("DataDoo : unknown camera type");
        }

        //CAMERA CONTROLS
        this.cameraControls = new DataDoo.OrbitControls(this.camera, this.renderer.domElement, this);
        this.cameraControls.maxDistance = this.gridStep * 1000;
        this.cameraControls.minDistance = this.gridStep / 10;
        this.cameraControls.autoRotate = false;

        //Projector
        this.projector = new THREE.Projector();
        //RayCatser
        this.raycaster = new THREE.Raycaster();

        // frustum and projection matrix
        // for manual frustum culling of html labels
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();

        // update the matrix once, so that positions
        // can be calculated for the first time
        this.scene.updateMatrixWorld();
    };

    DataDoo.prototype.prepareAxes = function () {
        this.axes = new DataDoo.AxesHelper(this);
        this.scene.add(this.axes);
    };

    DataDoo.prototype.prepareGuides = function () {
        this.guides = new DataDoo.GuideHelper(this);
        this.scene2.add(this.guides);
    };

    DataDoo.prototype.prepareGrid = function () {
        this.grid = new DataDoo.GridHelper(this);
        this.scene.add(this.grid);
    };

    DataDoo.prototype.render3DLabels = function () {
        /*var self = this, dist, sc;
        dist = self.camera.position.distanceTo(self.cameraControls.target);
        sc = Math.max(0.25, Math.min(dist/self.goldenDim, 1.25));
        _.each(self._3Dlabels, function (label) {
            label.lookAt(self.camera.position);
            label.scale.set(sc,sc,sc);
        });*/
    };

    DataDoo.prototype.renderSprites = function () {
        var self = this, dist;
        _.each(self._sprites, function (sprite) {
            dist = sprite.position.distanceTo(self.camera.position);
            var sc = 300/dist;
            sprite.scale.x = 120 + self.gridStep * (sc);
            sprite.scale.y = 50 + self.gridStep * (sc);
        });
    };

    DataDoo.prototype.renderLabels = function () {
        var self = this, vector = new THREE.Vector3(), w = self.renderer.domElement.width, h = self.renderer.domElement.height, dist, zInd, op, fsize, rotAngle;

        self.projScreenMatrix.multiplyMatrices(self.camera.projectionMatrix, self.camera.matrixWorldInverse);
        self.frustum.setFromMatrix(self.projScreenMatrix);
        var originVector = self.projector.projectVector(new THREE.Vector3(0, 0, 0), self.camera);
        originVector.x = (originVector.x + 1) / 2 * w;
        originVector.y = -(originVector.y - 1) / 2 * h;

        _.each(self._labels, function (label) {
            vector.getPositionFromMatrix(label.matrixWorld);
            var vector2 = self.projector.projectVector(vector.clone(), self.camera);
            vector2.x = (vector2.x + 1) / 2 * w;
            vector2.y = -(vector2.y - 1) / 2 * h;

            dist = vector.distanceTo(self.camera.position);
            zInd = Math.floor(10000 - dist);
            rotAngle = Math.atan((vector2.y - originVector.y) / (vector2.x - originVector.x)) * 180 / Math.PI;

            label._posX = vector2.x;
            label._posY = vector2.y;
            label._x1 = label._posX;
            label._y1 = label._posY;
            label._x2 = $(label.element).width() + label._x1;
            label._y2 = $(label.element).height() + label._y1;
            label._distance = dist;
            label._zIndex = zInd;
            label.visible = true;

            if (!self.frustum.containsPoint(vector)) {
                label.hide();
            }
        });

        self._labels.sort(function (label1, label2) {
            return label2._zIndex - label1._zIndex;
        });

        _.each(self._labels, function (label, i) {
            if (label.visible) {
                for (var l = i + 1, m = self._labels.length; l < m; l++) {
                    var secondLabel = self._labels[l];
                    if (secondLabel.visible) {
                        if ((label._x2 < secondLabel._x1 || label._x1 > secondLabel._x2) || (label._y2 < secondLabel._y1 || label._y1 > secondLabel._y2)) {

                        }
                        else {
                            secondLabel.hide();
                        }

                    }
                }

                op = this.goldenDim / dist;
                fsize = Math.max(Math.floor(25 - 8 * dist / (this.goldenDim * 0.5)), 11) + "px";

                label.update({top : label._posY, left : label._posX}, 1, zInd, fsize, rotAngle);
                label.show();
            }

        }, self);
    };

    DataDoo.prototype.build = function () {
        var i, j, x, y;
        for (i = 0, j = this.datasets.length; i < j; i++) {
            var ds = this.datasets[i];
            for (x = 0, y = ds.length; x < y; x++) {
                var row = ds.rowByPosition(x);
                var returnedObj = ds.builder(row, x);

                var primitive = new DataDoo.Primitive(returnedObj, row, this);

                var posSupplied = returnedObj.position || {};

                var colNames = ds.columnNames();
                var posArr = [];

                for (var k = 0, l = colNames.length; k < l; k++) {

                    if (ds.column(colNames[k]).type === "number") {
                        posArr.push(row[colNames[k]]);
                    }
                    else {
                        if (k === 0) {
                            posArr.push(this.gridStep * this.axes.xAxis.positionHash[row[colNames[k]]]);
                        }
                        else if (k === 1) {
                            posArr.push(this.gridStep * this.axes.yAxis.positionHash[row[colNames[k]]]);
                        }
                        else if (k === 2) {
                            posArr.push(this.gridStep * this.axes.zAxis.positionHash[row[colNames[k]]]);
                        }
                    }
                }
                primitive.position.set(posSupplied.x || posArr[0], posSupplied.y || posArr[1], posSupplied.z || posArr[2]);
                primitive.shape.geometry.computeBoundingBox();
                var label = new DataDoo.Label(primitive.text, new THREE.Vector3(0, 0, 0), this);
                primitive.add(label);

                this._nodes.push(primitive);
                this._intersectables.push(primitive.shape);
                this.scene.add(primitive);
            }
        }
    };

    DataDoo.prototype.run = function () {
        //Find out which form of requestAnimationFrame is supported.
        //Or else fall back to setTimeout
        var raf = this._raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            };

        var self = this;

        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {
            self.camera.aspect = self.renderer.domElement.width / self.renderer.domElement.height;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize(self.renderer.domElement.width, self.renderer.domElement.height);
        }

        self.prepareScene();
        if (self.datasets) {
            var promises = [];
            var fetchSuccess = function () {
                console.log("Fetched the data : " + this.columnNames());
            };

            for (var i = 0, j = self.datasets.length; i < j; i++) {
                promises.push(self.datasets[i].fetch({
                    success : fetchSuccess
                }));
            }

            _.when(promises).then(function () {
                self.prepareAxes();
                self.prepareGuides();
                self.prepareGrid();
                self.build();
            });
        }

        function renderFrame() {
            raf(renderFrame);
            self.renderer.clear();
            self.renderer.render(self.scene, self.camera);
            self.renderer.clear(false, true, false);
            self.renderer.render(self.scene2, self.camera);

            self.cameraControls.update();

        }

        raf(renderFrame);
        setTimeout(function () {
            self.renderLabels();
            self.renderSprites();
        }, 100);
        //self.renderLabels();
    };

    //These are the sensible default parameters for setting up an empty DataDoo instance.
    DataDoo.sceneDefaultParams = {
        title : "DataDoo",
        description : "DataDoo enables you to visualize your data in 3D",
        grid : true,
        gridStep : 10,
        goldenDim : 200,
        theme : 0,
        camera : {
            type : "PERSPECTIVE",
            fov : 45,
            nearP : 0.1,
            farP : 10000,
            nearO : 0.1,
            farO : 500,
            position : {x : 200, y : 200, z : 200}
        },
        axes : {
            x : {
                color : 0xff0000
            },
            y : {
                color : 0x00ff00
            },
            z : {
                color : 0x0000ff
            }
        },
        lights : {
            directionalLight : {
                color : 0xcccccc,
                intensity : 0.475,
                position : {x : 0, y : 100, z : 0}
            },
            hemiLight : {
                skyColor : 0xffffff,
                groundColor : 0xcccccc,
                intensity : 0.65,
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
    };

    DataDoo.themes = [
        ["#2C3E50", "#FC4349", "#6DBCDB", "#D7DADB", "#FFFFFF"],

        ["#14a697", "#f2c12e", "#f29d35", "#f27649", "#f25252"],

        ["#2c3e50", "#fc4349", "#d7dadb", "#6dbcdb", "#ffffff"],

        ["#252526", "#3e3e40", "#038c7e", "#03a688", "#73bf86"],

        ["#f4fac7", "#7bad8d", "#ffb158", "#f77f45", "#c2454e"],

        ["#0b0d0e", "#137074", "#7eb7a3", "#f1ddbb", "#ec6766"],

        ["#3fb8af", "#7fc7af", "#dad8a7", "#ffb38b", "#ff3f34"],

        ["#002a4a", "#17607d", "#fff1ce", "#ff9311", "#d64700"],

        ["#324759", "#f2d95c", "#f2ac57", "#f28d52", "#f25757"],

        ["#bf2431", "#f24150", "#2a4557", "#3b848c", "#eff2e4"],

        ["#e53481", "#fcb215", "#9ccb3b", "#25b0e6", "#8151a1"],

        ["#59323c", "#260126", "#f2eeb3", "#bfaf80", "#8c6954"],

        ["#7ac5df", "#ff5452", "#ebf7f8", "#9aa5b8", "#525c72"],

        ["#96ca2d", "#b5e655", "#f9fff2", "#4bb5c1", "#00191c"],

        ["#002e40", "#2a5769", "#ffffff", "#fabd4a", "#f09000"],

        ["#c7422f", "#e84c3d", "#1bb696", "#129078", "#2d3e50"],

        ["#002e40", "#306378", "#404040", "#fabd4a", "#fa9600"],

        ["#272d40", "#364659", "#55736d", "#9dbf8e", "#d0d991"],

        ["#012d3d", "#38ad9e", "#ffeb9e", "#ff6867", "#d0dbed"],

        ["#2d3340", "#5d768c", "#d9d3b8", "#bfae8e", "#8c7961"],

        ["#004466", "#126d9c", "#3a9dd1", "#65bee8", "#ace2ff"],

        ["#08afc7", "#adf7ff", "#fffef9", "#906a91", "#522554"],

        ["#1e446b", "#4e78a1", "#9fdaff", "#fff5eb", "#616c6e"],

        ["#195962", "#f56f6c", "#ffffff", "#252932", "#191c21"],

        ["#edfeff", "#4e8c77", "#b4da81", "#fffee9", "#b5e0cb"],

        ["#0e3559", "#027bbb", "#ffffff", "#e8560f", "#b31d10"],

        ["#df3d4a", "#61274b", "#52ebb9", "#51ab83", "#a0ae9c"],

        ["#5dbea9", "#efeddf", "#ef7247", "#4e3f35", "#d1cbba"],

        ["#d30027", "#fcfbe7", "#9fd3da", "#008c9a", "#05484f"],

        ["#371547", "#ed5715", "#a2c606", "#87025f", "#f9de19"],

        ["#449bb5", "#043d5d", "#eb5055", "#68c39f", "#fffcf5"],

        ["#3cb874", "#61d296", "#eaeff0", "#34465c", "#253342"],

        ["#382f27", "#4bad9b", "#d9aa33", "#e3e0c9", "#d93d31"],

        ["#590000", "#8c0000", "#fff7e3", "#807966", "#403533"],

        ["#75bfbf", "#e7f2d5", "#f2d852", "#f2ae30", "#f29422"],

        ["#e6e7e8", "#bad531", "#26a1d6", "#223032", "#000000"],

        ["#114a63", "#c7c2b2", "#478396", "#cee830", "#ffffff"],

        ["#0a111f", "#263248", "#7e8aa2", "#e3e3e3", "#a80b00"],

        ["#eb6e44", "#ffe69e", "#cfee7f", "#8dcdc1", "#4f4a47"],

        ["#fffed6", "#53eff0", "#8d5cd4", "#ff549d", "#ffcb28"],

        ["#2e4350", "#f55a42", "#ecf0f1", "#42b2e3", "#4766b5"],

        ["#2d2d3f", "#75a0a5", "#b8bf9e", "#bf9159", "#f2af5e"],

        ["#35c1cf", "#95e2e8", "#fdfffe", "#ffb12a", "#ff7211"],

        ["#101e26", "#f2f2f2", "#8c8c88", "#f28c0f", "#f2790f"],

        ["#505050", "#129793", "#9bd7d5", "#ffeaab", "#ff7260"],

        ["#ffd5e4", "#ffc1af", "#ffded2", "#b0908b", "#daf5ef"],

        ["#043c4a", "#436873", "#e6e4e3", "#c96003", "#7d1b05"],

        ["#143840", "#177373", "#5ba691", "#96d9ad", "#cef2d7"],

        ["#073a59", "#2d9aa6", "#f2e2dc", "#f23322", "#a61b1b"],

        ["#a6032f", "#037e8c", "#f2efc2", "#f2ab27", "#f25e3d"],

        ["#2d5955", "#7ca68b", "#f2eeae", "#f2cda0", "#f29966"],

        ["#36413a", "#b5c00b", "#1c231e", "#ffffff", "#4c5b52"],

        ["#a6032f", "#037e8c", "#f2efc2", "#f2ab27", "#f25e3d"],

        ["#9bc92e", "#f1fbff", "#28333d", "#5a707a", "#a7bdc6"],

        ["#49bfa6", "#f2efa8", "#f2b431", "#6b432f", "#f2552b"],

        ["#88c95f", "#6aa15f", "#ffd135", "#382830", "#ff4834"],

        ["#9fa2a6", "#ebeef2", "#4f6273", "#4ed9bf", "#f25e5e"],

        ["#c0ae72", "#fcfbfa", "#c2daa6", "#779a91", "#3b404f"],

        ["#2f8a8a", "#f2ca04", "#d88e04", "#bf3503", "#721602"],

        ["#e02d03", "#eb5825", "#ffdeb4", "#ffffff", "#0f8dcc"],

        ["#d90718", "#242526", "#f2f2f2", "#848b8c", "#4f5859"],

        ["#f8bd00", "#ed4500", "#fcfbe5", "#d9224c", "#bbd400"],

        ["#98d3f5", "#cef0f7", "#ebfff1", "#ffe0c0", "#feb5a9"],

        ["#032429", "#134a46", "#377d6a", "#7ab893", "#b2e3af"],

        ["#1a402a", "#467339", "#75a644", "#a6d95b", "#edf2c9"],

        ["#223245", "#637792", "#6a8ea9", "#c6beb5", "#9a9187"],

        ["#607580", "#ffffff", "#c0eaff", "#4a6d80", "#9abbcc"],

        ["#2651a3", "#3b7fff", "#8ab33f", "#faa918", "#ee3c27"],

        ["#a20e30", "#e93c4f", "#dcdcd4", "#adbcc3", "#2d4255"],

        ["#00afef", "#58595b", "#808285", "#bcbec0", "#d1d3d4"],

        ["#049dd9", "#f2cb57", "#f29c50", "#f2783f", "#d93425"],

        ["#505050", "#129793", "#9bd7d5", "#ffeaab", "#ff7260"],

        ["#2c4259", "#9ed9d8", "#ede9f0", "#faf5f7", "#d4d0d1"]

    ];

    return DataDoo;
})();