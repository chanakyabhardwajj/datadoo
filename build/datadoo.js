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
            preserveDrawingBuffer : true
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
        var self = this, dist;
        _.each(self._3Dlabels, function (label) {
            label.lookAt(self.camera.position);

            //dist = label.position.distanceTo(self.camera.position);
            //var sc = dist > self.gridStep * 1000 ? 0 : dist/(3*self.goldenDim);
            //var sc = 0 + (0.01 * dist/self.gridStep);

            //label.scale.multiplyScalar( Math.max(sc, 0.8));
            //console.log(sc);
        });
    };

    DataDoo.prototype.renderSprites = function () {
        /*var self = this, dist;
        _.each(self._sprites, function (sprite) {
            dist = sprite.position.distanceTo(self.camera.position);
            var sc = 300/dist;
            sprite.scale.x = 120 + self.gridStep * (sc);
            sprite.scale.y = 50 + self.gridStep * (sc);
        });*/
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
            self.render3DLabels();
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
//This is the dataset for DataDoo. Think of this as the tables or database that hold your data, locally.
//This class is essentially a wrapper around Miso Dataset. I did not want to have a hard dependency on Miso.
(function(DataDoo){
    function Dataset(config){
        Miso.Dataset.call(this, config);

        //Make the syncing mandatory!!
        this.sync = true;

        //The following is the builder function.
        //The builder function runs for each and every data-point/cell
        //and generates/builds the shape that you want.
        //This function is supposed to be overwritten by every instance.
        this.builder = config.builder;
    }

    Dataset.prototype = new Miso.Dataset();
    Dataset.prototype.constructor = Dataset;

    DataDoo.Dataset = Dataset;

})(window.DataDoo);
(function(DataDoo) {
    function AxesHelper(ddI) {
        THREE.Object3D.call(this, ddI);

        this.datasets = ddI.datasets;

        //First of all, we need to make sure that all the datasets are compatible
        //i.e. all the column names and type, match!
        //Note : Columns need to be ordered similarly as well.

        //Stuff all the column-name-arrays in this super-array.
        var allColNames = [], colNames, i, j, x, y, tempArr = [], label;
        for (i = 0, j = this.datasets.length; i < j; i++) {
            allColNames.push(this.datasets[i].columnNames());
        }

        //Check if all the column-name-arrays have the same length i.e. same number of columns
        var numOfCols = allColNames[0].length;
        for (i = 0, j = allColNames.length; i < j; i++) {
            if (allColNames[i].length !== numOfCols) {
                throw new Error("Number of Columns Mismatch : " + allColNames[i]);
            }
        }

        if (numOfCols !== 3) {
            throw new Error("As of now, DataDoo only works with 3 columns in a dataset. The number of columns in your dataset is : " + numOfCols + ", which is clearly not 3. I will be adding support for 2 and 4 columns but for now re-model your data or break it into smaller sets to use DataDoo.");
        }

        //Now check if all the column-names are the same
        if (_.union.apply(_, allColNames).length !== numOfCols) {
            throw new Error("Columns Name Mismatch!");
        }

        colNames = allColNames[0];

        this.xAxis = new THREE.Object3D();
        this.xAxis.colName = colNames[0];
        this.xAxis.colType = "number";
        this.xAxis.colUniqs = [];
        this.xAxis.positionHash = {};

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[0]).data);
            if (this.datasets[x].column(colNames[0]).type !== "number") {
                this.xAxis.colType = "mixed";
            }
        }
        this.xAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.yAxis = new THREE.Object3D();
        this.yAxis.colName = colNames[1];
        this.yAxis.colType = "number";
        this.yAxis.colUniqs = [];
        this.yAxis.positionHash = {};

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[1]).data);
            if (this.datasets[x].column(colNames[1]).type !== "number") {
                this.yAxis.colType = "mixed";
            }
        }
        this.yAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.zAxis = new THREE.Object3D();
        this.zAxis.colName = colNames[2];
        this.zAxis.colType = "number";
        this.zAxis.colUniqs = [];
        this.zAxis.positionHash = {};

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[2]).data);
            if (this.datasets[x].column(colNames[2]).type !== "number") {
                this.zAxis.colType = "mixed";
            }
        }
        this.zAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.xObj = ddI.axesConf.x;
        this.yObj = ddI.axesConf.y;
        this.zObj = ddI.axesConf.z;

        var notchLabel, notchShape;
        var coneGeometry = new THREE.CylinderGeometry( 0, ddI.gridStep/8, ddI.gridStep/5, 25, 5 );
        var xcone, xline, xlineGeometry = new THREE.Geometry();
        var ycone, yline, ylineGeometry = new THREE.Geometry();
        var zcone, zline, zlineGeometry = new THREE.Geometry();
        var labelGeom, labelMaterial= new THREE.MeshBasicMaterial( { color: ddI.theme[0], overdraw: true } );
        var labelConfig = {size: 2.5, height: 0.1, curveSegments: 10, font: "helvetiker"};

        if (this.xAxis.colType === "number") {
            this.xAxis.length = Math.max(_.max(this.xAxis.colUniqs), 0) - Math.min(_.min(this.xAxis.colUniqs), 0) + ddI.gridStep;
            this.xAxis.from = new THREE.Vector3(Math.min(_.min(this.xAxis.colUniqs), 0), 0, 0);
            this.xAxis.to = new THREE.Vector3(Math.max(_.max(this.xAxis.colUniqs), 0), 0, 0);
        }
        else {
            this.xAxis.length = this.xAxis.colUniqs.length * ddI.gridStep;
            this.xAxis.from = new THREE.Vector3(0, 0, 0);
            this.xAxis.to = new THREE.Vector3((this.xAxis.colUniqs.length + 1) * ddI.gridStep, 0, 0);
        }

        if (this.yAxis.colType === "number") {
            this.yAxis.length = Math.max(_.max(this.yAxis.colUniqs), 0) - Math.min(_.min(this.yAxis.colUniqs), 0) + ddI.gridStep;
            this.yAxis.from = new THREE.Vector3(0, Math.min(_.min(this.yAxis.colUniqs), 0), 0);
            this.yAxis.to = new THREE.Vector3(0, Math.max(_.max(this.yAxis.colUniqs), 0), 0);
        }
        else {
            this.yAxis.length = this.yAxis.colUniqs.length * ddI.gridStep;
            this.yAxis.from = new THREE.Vector3(0, 0, 0);
            this.yAxis.to = new THREE.Vector3(0, (this.yAxis.colUniqs.length + 1) * ddI.gridStep, 0);
        }

        if (this.zAxis.colType === "number") {
            this.zAxis.length = Math.max(_.max(this.zAxis.colUniqs), 0) - Math.min(_.min(this.zAxis.colUniqs), 0) + ddI.gridStep;
            this.zAxis.from = new THREE.Vector3(0, 0, Math.min(_.min(this.zAxis.colUniqs), 0));
            this.zAxis.to = new THREE.Vector3(0, 0, Math.max(_.max(this.zAxis.colUniqs), 0));
        }
        else {
            this.zAxis.length = this.zAxis.colUniqs.length * ddI.gridStep;
            this.zAxis.from = new THREE.Vector3(0, 0, 0);
            this.zAxis.to = new THREE.Vector3(0, 0, (this.zAxis.colUniqs.length + 1) * ddI.gridStep);
        }

        xlineGeometry.vertices.push(this.xAxis.from);
        xlineGeometry.vertices.push(this.xAxis.to);
        xlineGeometry.computeLineDistances();


        //label = new DataDoo.Label(this.xAxis.colName, new THREE.Vector3(this.xAxis.length + Math.max(this.xAxis.length / 10, 10), 1, 0), ddI);
        //label = new DataDoo.Sprite(this.xAxis.colName, {}, ddI);
        //label.position = new THREE.Vector3(this.xAxis.to.x + ddI.gridStep/2, this.xAxis.to.y+ ddI.gridStep/4 , this.xAxis.to.z+ ddI.gridStep/4);




        //labelGeom.computeBoundingBox();
        //var centerOffset = -0.5 * ( labelGeom.boundingBox.max.x - labelGeom.boundingBox.min.x );

        labelGeom = new THREE.TextGeometry(this.xAxis.colName, labelConfig);
        label = new THREE.Mesh( labelGeom, labelMaterial );
        label.position = new THREE.Vector3(this.xAxis.to.x + ddI.gridStep/2, this.xAxis.to.y+ ddI.gridStep/4 , this.xAxis.to.z+ ddI.gridStep/4);
        ddI._3Dlabels.push(label);

        xline = new THREE.Line(xlineGeometry, new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, color : /*this.axesConf.x.color*/ ddI.theme[0] }), THREE.LinePieces);
        xline.matrixAutoUpdate = false;

        xcone = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: ddI.theme[0] } ) );
        xcone.rotateZ(-Math.PI/2);
        xcone.position = this.xAxis.to;
        this.xAxis.add(xcone);
        this.xAxis.add(label);
        this.xAxis.add(xline);

        ylineGeometry.vertices.push(this.yAxis.from);
        ylineGeometry.vertices.push(this.yAxis.to);
        ylineGeometry.computeLineDistances();
        //label = new DataDoo.Label(this.yAxis.colName, new THREE.Vector3(1, this.yAxis.length + Math.max(this.yAxis.length / 10, 10), 0), ddI);
        //label = new DataDoo.Sprite(this.yAxis.colName, {}, ddI);

        labelGeom = new THREE.TextGeometry(this.yAxis.colName, labelConfig);
        label = new THREE.Mesh( labelGeom, labelMaterial );
        ddI._3Dlabels.push(label);
        label.position = new THREE.Vector3(this.yAxis.to.x + ddI.gridStep/4, this.yAxis.to.y + ddI.gridStep/2, this.yAxis.to.z+ ddI.gridStep/4);

        yline = new THREE.Line(ylineGeometry, new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, color : /*this.axesConf.y.color*/ ddI.theme[0] }), THREE.LinePieces);
        yline.matrixAutoUpdate = false;

        ycone = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: ddI.theme[0] } ) );
        ycone.rotateZ(0);
        ycone.position = this.yAxis.to;
        this.yAxis.add(ycone);
        this.yAxis.add(label);
        this.yAxis.add(yline);

        zlineGeometry.vertices.push(this.zAxis.from);
        zlineGeometry.vertices.push(this.zAxis.to);
        zlineGeometry.computeLineDistances();
        //label = new DataDoo.Label(this.zAxis.colName, new THREE.Vector3(0, 1, this.zAxis.length + Math.max(this.zAxis.length / 10, 10)), ddI);
        //label = new DataDoo.Sprite(this.zAxis.colName, {}, ddI);

        labelGeom = new THREE.TextGeometry(this.zAxis.colName, labelConfig);
        label = new THREE.Mesh( labelGeom, labelMaterial );
        ddI._3Dlabels.push(label);

        label.position = new THREE.Vector3(this.zAxis.to.x + ddI.gridStep/4, this.zAxis.to.y+ ddI.gridStep/4 , this.zAxis.to.z+ ddI.gridStep/2);
        zline = new THREE.Line(zlineGeometry, new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, color : /*this.axesConf.z.color*/ ddI.theme[0] }), THREE.LinePieces);
        zline.matrixAutoUpdate = false;

        zcone = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: ddI.theme[0] } ) );
        zcone.rotateX(Math.PI/2);
        zcone.position = this.zAxis.to;
        this.zAxis.add(zcone);
        this.zAxis.add(label);
        this.zAxis.add(zline);

        var notchGeom = new THREE.CubeGeometry(ddI.gridStep/100, ddI.gridStep/10, ddI.gridStep/100);
        var notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.x.color*/ ddI.theme[1], opacity : 1});

        for (i = 0, j = this.xAxis.length / ddI.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);

            if (this.xAxis.colType === "number") {
                notchShape.position.set((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * i), this.xAxis.from.y, this.xAxis.from.z);
                //notchLabel = new DataDoo.Label((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * i), new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z), ddI);
                //notchLabel = new DataDoo.Sprite((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * i), {}, ddI);
                notchLabelGeom = new THREE.TextGeometry((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * i), labelConfig);
                notchLabel = new THREE.Mesh( notchLabelGeom, labelMaterial );
                ddI._3Dlabels.push(notchLabel);
                notchLabel.position = new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z);
            }
            else {
                this.xAxis.positionHash[this.xAxis.colUniqs[i]] = i+1;
                notchShape.position.set((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * (i + 1)), this.xAxis.from.y, this.xAxis.from.z);
                //notchLabel = new DataDoo.Label(this.xAxis.colUniqs[i], new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z), ddI);
                //notchLabel = new DataDoo.Sprite(this.xAxis.colUniqs[i], {}, ddI);
                notchLabelGeom = new THREE.TextGeometry(this.xAxis.colUniqs[i], labelConfig);
                notchLabel = new THREE.Mesh( notchLabelGeom, labelMaterial );
                ddI._3Dlabels.push(notchLabel);
                notchLabel.position = new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z);
            }
            this.xAxis.add(notchShape);
            this.xAxis.add(notchLabel);
        }

        notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.y.color*/ ddI.theme[1], opacity : 0.4});

        for (i = 0, j = this.yAxis.length / ddI.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);
            if (this.yAxis.colType === "number") {
                notchShape.position.set(this.yAxis.from.x, (this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * i), this.yAxis.from.z);
                //notchLabel = new DataDoo.Label((this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * i) , new THREE.Vector3(notchShape.position.x  + ddI.gridStep/5, notchShape.position.y, notchShape.position.z), ddI);
                //notchLabel = new DataDoo.Sprite((this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * i) , {}, ddI);
                notchLabelGeom = new THREE.TextGeometry((this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * i), labelConfig);
                notchLabel = new THREE.Mesh( notchLabelGeom, labelMaterial );
                ddI._3Dlabels.push(notchLabel);
                notchLabel.position = new THREE.Vector3(notchShape.position.x  + ddI.gridStep/5, notchShape.position.y, notchShape.position.z);
            }
            else {
                this.yAxis.positionHash[this.yAxis.colUniqs[i]] = i+1;
                notchShape.position.set(this.yAxis.from.x, (this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * (i + 1)), this.yAxis.from.z);
                //notchLabel = new DataDoo.Label(this.yAxis.colUniqs[i] , new THREE.Vector3(notchShape.position.x  + ddI.gridStep/5, notchShape.position.y, notchShape.position.z), ddI);

                //notchLabel = new DataDoo.Sprite(this.yAxis.colUniqs[i] , {}, ddI);
                notchLabelGeom = new THREE.TextGeometry(this.yAxis.colUniqs[i], labelConfig);
                notchLabel = new THREE.Mesh( notchLabelGeom, labelMaterial );
                ddI._3Dlabels.push(notchLabel);
                notchLabel.position = new THREE.Vector3(notchShape.position.x  + ddI.gridStep/5, notchShape.position.y, notchShape.position.z);
            }
            notchShape.rotateZ(Math.PI/2);
            this.yAxis.add(notchShape);
            this.yAxis.add(notchLabel);
        }

        notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.z.color*/ ddI.theme[1], opacity : 0.4});

        for (i = 0, j = this.zAxis.length / ddI.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);
            if (this.zAxis.colType === "number") {
                notchShape.position.set(this.zAxis.from.x, this.zAxis.from.y, (this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * i));
                //notchLabel = new DataDoo.Label((this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * i), new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z), ddI);

                //notchLabel = new DataDoo.Sprite((this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * i) , {}, ddI);
                notchLabelGeom = new THREE.TextGeometry((this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * i), labelConfig);
                notchLabel = new THREE.Mesh( notchLabelGeom, labelMaterial );
                ddI._3Dlabels.push(notchLabel);

                notchLabel.position = new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z);
            }
            else {
                this.zAxis.positionHash[this.zAxis.colUniqs[i]] = i+1;
                notchShape.position.set(this.zAxis.from.x, this.zAxis.from.y, (this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * (i + 1)));
                //notchLabel = new DataDoo.Label(this.zAxis.colUniqs[i], new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z), ddI);

                //notchLabel = new DataDoo.Sprite(this.zAxis.colUniqs[i] , {}, ddI);
                notchLabelGeom = new THREE.TextGeometry(this.zAxis.colUniqs[i], labelConfig);
                notchLabel = new THREE.Mesh( notchLabelGeom, labelMaterial );
                ddI._3Dlabels.push(notchLabel);
                notchLabel.position = new THREE.Vector3(notchShape.position.x, notchShape.position.y + ddI.gridStep/5 , notchShape.position.z);
            }
            this.zAxis.add(notchShape);
            this.zAxis.add(notchLabel);
        }

        this.add(this.xAxis);
        this.add(this.yAxis);
        this.add(this.zAxis);

        return this;
    }

    AxesHelper.prototype = new THREE.Object3D();
    AxesHelper.prototype.constructor = AxesHelper;

    DataDoo.AxesHelper = AxesHelper;

    AxesHelper.prototype.updateGeometry = function () {

    };

})(window.DataDoo);

(function(DataDoo) {
    function GridHelper(ddI) {
        THREE.Object3D.call(this, ddI);

        //GRID
        if (ddI.gridBoolean) {
            //the following code-block is similar to THREE.GridHelper
            //but manually coding it, to keep the customising options open
            var size = (Math.max(ddI.axes.xAxis.colUniqs.length, ddI.axes.zAxis.colUniqs.length) + 2) * ddI.gridStep, step = ddI.gridStep;

            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({ color : /*0xBED6E5*/ ddI.theme[2], opacity : 1, linewidth : 1 });

            for (i = -size; i <= size; i += step) {
                geometry.vertices.push(new THREE.Vector3(-size, 0, i));
                geometry.vertices.push(new THREE.Vector3(size, 0, i));
                geometry.vertices.push(new THREE.Vector3(i, 0, -size));
                geometry.vertices.push(new THREE.Vector3(i, 0, size));
            }

            this.grid = new THREE.Line(geometry, material, THREE.LinePieces);
            this.grid.position.y = -0.1;
            this.add(this.grid);
            return this;
        }
    }

    GridHelper.prototype = new THREE.Object3D();
    GridHelper.prototype.constructor = GridHelper;

    DataDoo.GridHelper = GridHelper;

    GridHelper.prototype.updateGeometry = function () {

    };
})(window.DataDoo);

(function (DataDoo) {
    function GuideHelper(ddI) {
        THREE.Object3D.call(this, ddI);

        var guideMaterial = new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, opacity : 0.6, color : 0x1d4b5e });

        var yGuideGeometry = new THREE.Geometry();
        yGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        yGuideGeometry.vertices.push(new THREE.Vector3(100, 0, 100));
        yGuideGeometry.dynamic = true;
        yGuideGeometry.verticesNeedUpdate = true;
        yGuideGeometry.computeLineDistances();

        var hGuideGeometry = new THREE.Geometry();
        hGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        hGuideGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
        hGuideGeometry.dynamic = true;
        hGuideGeometry.verticesNeedUpdate = true;
        hGuideGeometry.computeLineDistances();

        var xGuideGeometry = new THREE.Geometry();
        xGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        xGuideGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
        xGuideGeometry.dynamic = true;
        xGuideGeometry.verticesNeedUpdate = true;
        xGuideGeometry.computeLineDistances();

        var zGuideGeometry = new THREE.Geometry();
        zGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        zGuideGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
        zGuideGeometry.dynamic = true;
        zGuideGeometry.verticesNeedUpdate = true;
        zGuideGeometry.computeLineDistances();

        this.yGuide = new THREE.Line(yGuideGeometry, guideMaterial, THREE.LinePieces);
        this.hGuide = new THREE.Line(hGuideGeometry, guideMaterial, THREE.LinePieces);
        this.xGuide = new THREE.Line(xGuideGeometry, guideMaterial, THREE.LinePieces);
        this.zGuide = new THREE.Line(zGuideGeometry, guideMaterial, THREE.LinePieces);

        this.yGuide.visible = false;
        this.hGuide.visible = false;
        this.xGuide.visible = false;
        this.zGuide.visible = false;

        this.add(this.yGuide);
        this.add(this.hGuide);
        this.add(this.xGuide);
        this.add(this.zGuide);

        var horPlaneMat = new THREE.MeshBasicMaterial({ color : 0x377c97, transparent : true, opacity : 0.4, side : THREE.DoubleSide, overdraw : true });

        var horPlaneGeom = new THREE.PlaneGeometry(100,100,1,1);
/*        horPlaneGeom.vertices.push(new THREE.Vector3(0, 0, 0));
        horPlaneGeom.vertices.push(new THREE.Vector3(100, 0, 0));
        horPlaneGeom.vertices.push(new THREE.Vector3(100, 0, 100));
        horPlaneGeom.vertices.push(new THREE.Vector3(0, 0, 100));*/

        horPlaneGeom.dynamic = true;
        horPlaneGeom.verticesNeedUpdate = true;

        this.horGuide = new THREE.Mesh(horPlaneGeom, horPlaneMat);
        this.horGuide.visible = false;

        this.add(this.horGuide);
        return this;
    }

    GuideHelper.prototype = new THREE.Object3D();
    GuideHelper.prototype.constructor = GuideHelper;

    DataDoo.GuideHelper = GuideHelper;

    GuideHelper.prototype.updateGeometry = function () {

    };

    GuideHelper.prototype.drawGuides = function (point) {
        var px = point.x, py = point.y, pz = point.z;

        this.horGuide.geometry.vertices[0] = new THREE.Vector3(0, 0, 0);
        this.horGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, 0);
        this.horGuide.geometry.vertices[2] = new THREE.Vector3(0, 0, pz);
        this.horGuide.geometry.vertices[3] = new THREE.Vector3(px, 0, pz);
        this.horGuide.geometry.dynamic = true;
        this.horGuide.geometry.verticesNeedUpdate = true;
        this.horGuide.visible = true;

        this.yGuide.geometry.vertices[0] = new THREE.Vector3(0, py, 0);
        this.yGuide.geometry.vertices[1] = new THREE.Vector3(px, py, pz);
        this.yGuide.geometry.computeLineDistances();
        this.yGuide.geometry.verticesNeedUpdate = true;

        this.hGuide.geometry.vertices[0] = new THREE.Vector3(px, py, pz);
        this.hGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, pz);
        this.hGuide.geometry.computeLineDistances();
        this.hGuide.geometry.verticesNeedUpdate = true;

        this.xGuide.geometry.vertices[0] = new THREE.Vector3(px, 0, 0);
        this.xGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, pz);
        this.xGuide.geometry.computeLineDistances();
        this.xGuide.geometry.verticesNeedUpdate = true;

        this.zGuide.geometry.vertices[0] = new THREE.Vector3(0, 0, pz);
        this.zGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, pz);
        this.zGuide.geometry.computeLineDistances();
        this.zGuide.geometry.verticesNeedUpdate = true;

        this.yGuide.visible = true;
        this.hGuide.visible = true;
        this.xGuide.visible = true;
        this.zGuide.visible = true;
    };

    GuideHelper.prototype.hideGuides = function () {
        this.yGuide.geometry.verticesNeedUpdate = true;
        this.hGuide.geometry.verticesNeedUpdate = true;
        this.xGuide.geometry.verticesNeedUpdate = true;
        this.zGuide.geometry.verticesNeedUpdate = true;
        this.yGuide.visible = false;
        this.hGuide.visible = false;
        this.xGuide.visible = false;
        this.zGuide.visible = false;

        this.horGuide.geometry.dynamic = true;
        this.horGuide.geometry.verticesNeedUpdate = true;
        this.horGuide.visible = false;
    };
})(window.DataDoo);

//A primitive is the most atomic element of DataDoo.
//It is used to represent the data and the relations.
//Essentially it is a wrapper around THREE.Object3D class.

(function(DataDoo){
    function Primitive(configObj, rowData, ddI){
        THREE.Object3D.call(this, configObj, rowData, ddI);

        //default properties of every primitive
        this.ddI = ddI;
        this.row = rowData;
        this.shape = configObj.shape || null;
        this.text = configObj.text || null;
        this.add(this.shape);


        this.hoverOutline = new THREE.Mesh(this.shape.geometry, new THREE.MeshBasicMaterial( { color:0x000000, transparent:true, opacity:0.7, side:THREE.BackSide} ));
        this.hoverOutline.scale.multiplyScalar(1.02);

        /*this.boundingBox = new THREE.BoxHelper(this.shape);
        this.boundingBox.scale.multiplyScalar(1.05);
        this.boundingBox.material.color = 0x000000;
        this.boundingBox.material.linewidth = 1;
        this.boundingBox.material.opacity = 0.6;*/

        return this;
    }
    
    Primitive.prototype = new THREE.Object3D();
    Primitive.prototype.constructor = Primitive;

    Primitive.prototype.onHoverIn = function(){
        this.shape.scale.multiplyScalar(1.02);
        this.shape.add(this.hoverOutline);

        this.ddI.guides.drawGuides(this.position);
    };

    Primitive.prototype.onHoverOut = function(){
        this.shape.scale.set(1,1,1);
        this.shape.remove(this.hoverOutline);

        this.ddI.guides.hideGuides();
    };

    DataDoo.Primitive = Primitive;
})(window.DataDoo);
(function (DataDoo) {
    function OrbitControls(object, domElement, ddI) {

        this.object = object;
        this.domElement = ( domElement !== undefined ) ? domElement : document;

        // API

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the control orbits around
        // and where it pans with respect to.
        this.target = new THREE.Vector3();
        // center is old, deprecated; use "target" instead
        this.center = this.target;

        // This option actually enables dollying in and out; left as "zoom" for
        // backwards compatibility
        this.noZoom = false;
        this.zoomSpeed = 1.0;
        // Limits to how far you can dolly in and out
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // Set to true to disable this control
        this.noRotate = false;
        this.rotateSpeed = 1.0;

        // Set to true to disable this control
        this.noPan = false;
        this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // Set to true to disable use of the keys
        this.noKeys = false;
        // The four arrow keys
        this.keys = { LEFT : 37, UP : 38, RIGHT : 39, BOTTOM : 40 };

        ////////////
        // internals

        var scope = this;

        var EPS = 0.000001;

        var rotateStart = new THREE.Vector2();
        var rotateEnd = new THREE.Vector2();
        var rotateDelta = new THREE.Vector2();

        var panStart = new THREE.Vector2();
        var panEnd = new THREE.Vector2();
        var panDelta = new THREE.Vector2();

        var dollyStart = new THREE.Vector2();
        var dollyEnd = new THREE.Vector2();
        var dollyDelta = new THREE.Vector2();

        var phiDelta = 0;
        var thetaDelta = 0;
        var scale = 1;
        var pan = new THREE.Vector3();

        var lastPosition = new THREE.Vector3();

        var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
        var state = STATE.NONE;
        //this.state = state;

        // events

        var changeEvent = { type : 'change' };

        var mouse = {x : 0, y : 0};
        var INTERSECTED;

        this.rotateLeft = function (angle) {

            if (angle === undefined) {

                angle = getAutoRotationAngle();

            }

            thetaDelta -= angle;

        };

        this.rotateUp = function (angle) {

            if (angle === undefined) {

                angle = getAutoRotationAngle();

            }

            phiDelta -= angle;

        };

        // pass in distance in world space to move left
        this.panLeft = function (distance) {

            var panOffset = new THREE.Vector3();
            var te = this.object.matrix.elements;
            // get X column of matrix
            panOffset.set(te[0], te[1], te[2]);
            panOffset.multiplyScalar(-distance);

            pan.add(panOffset);

        };

        // pass in distance in world space to move up
        this.panUp = function (distance) {

            var panOffset = new THREE.Vector3();
            var te = this.object.matrix.elements;
            // get Y column of matrix
            panOffset.set(te[4], te[5], te[6]);
            panOffset.multiplyScalar(distance);

            pan.add(panOffset);
        };

        // main entry point; pass in Vector2 of change desired in pixel space,
        // right and down are positive
        this.pan = function (delta) {

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if (scope.object.fov !== undefined) {

                // perspective
                var position = scope.object.position;
                var offset = position.clone().sub(scope.target);
                var targetDistance = offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);
                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                scope.panLeft(2 * delta.x * targetDistance / element.clientHeight);
                scope.panUp(2 * delta.y * targetDistance / element.clientHeight);

            }
            else if (scope.object.top !== undefined) {

                // orthographic
                scope.panLeft(delta.x * (scope.object.right - scope.object.left) / element.clientWidth);
                scope.panUp(delta.y * (scope.object.top - scope.object.bottom) / element.clientHeight);

            }
            else {

                // camera neither orthographic or perspective - warn user
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');

            }

        };

        this.dollyIn = function (dollyScale) {

            if (dollyScale === undefined) {

                dollyScale = getZoomScale();

            }

            scale /= dollyScale;

        };

        this.dollyOut = function (dollyScale) {

            if (dollyScale === undefined) {

                dollyScale = getZoomScale();

            }

            scale *= dollyScale;

        };

        this.update = function () {

            var position = this.object.position;
            var offset = position.clone().sub(this.target);

            // angle from z-axis around y-axis

            var theta = Math.atan2(offset.x, offset.z);

            // angle from y-axis

            var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

            if (this.autoRotate) {

                this.rotateLeft(getAutoRotationAngle());

            }

            theta += thetaDelta;
            phi += phiDelta;

            // restrict phi to be between desired limits
            phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

            var radius = offset.length() * scale;

            // restrict radius to be between desired limits
            radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

            // move target to panned location
            //this.target.add( pan );

            offset.x = radius * Math.sin(phi) * Math.sin(theta);
            offset.y = radius * Math.cos(phi);
            offset.z = radius * Math.sin(phi) * Math.cos(theta);

            position.copy(this.target).add(offset);

            this.object.lookAt(this.target);

            thetaDelta = 0;
            phiDelta = 0;
            scale = 1;
            pan.set(0, 0, 0);

            if (lastPosition.distanceTo(this.object.position) > 0) {

                this.dispatchEvent(changeEvent);

                lastPosition.copy(this.object.position);

            }
        };

        function getIntersection() {
            //find intersections
            var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
            ddI.projector.unprojectVector(vector, ddI.camera);
            ddI.raycaster.set(ddI.camera.position, vector.sub(ddI.camera.position).normalize());
            var intersects = ddI.raycaster.intersectObjects(ddI._intersectables);

            if (intersects.length > 0) {
                ddI.renderer.domElement.style.cursor="pointer";
                if (INTERSECTED != intersects[ 0 ].object) {
                    if (INTERSECTED)INTERSECTED.parent.onHoverOut();
                    INTERSECTED = intersects[ 0 ].object;
                    INTERSECTED.parent.onHoverIn();
                }
            }
            else {
                ddI.renderer.domElement.style.cursor="default";
                if (INTERSECTED) INTERSECTED.parent.onHoverOut();
                INTERSECTED = null;
            }
        }

        function getAutoRotationAngle() {

            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

        }

        function getZoomScale() {

            return Math.pow(0.95, scope.zoomSpeed);

        }

        function onMouseDown(event) {
            if (scope.enabled === false) {
                return;
            }
            event.preventDefault();

            if (event.button === 0) {
                if (scope.noRotate === true) {
                    return;
                }

                state = STATE.ROTATE;

                rotateStart.set(event.clientX, event.clientY);

            }
            else if (event.button === 1) {
                if (scope.noZoom === true) {
                    return;
                }

                state = STATE.DOLLY;

                dollyStart.set(event.clientX, event.clientY);

            }
            else if (event.button === 2) {
                if (scope.noPan === true) {
                    return;
                }

                state = STATE.PAN;

                panStart.set(event.clientX, event.clientY);

            }
        }

        function onMouseMove(event) {

            if (scope.enabled === false) return;

            event.preventDefault();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if (state === STATE.NONE) {
                mouse.x = ( event.clientX / ddI.renderer.domElement.width ) * 2 - 1;
                mouse.y = -( event.clientY / ddI.renderer.domElement.height ) * 2 + 1;
                getIntersection();
            }
            else if (state === STATE.ROTATE) {

                if (scope.noRotate === true) return;

                rotateEnd.set(event.clientX, event.clientY);
                rotateDelta.subVectors(rotateEnd, rotateStart);

                // rotating across whole screen goes 360 degrees around
                scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
                // rotating up and down along whole screen attempts to go 360, but limited to 180
                scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

                rotateStart.copy(rotateEnd);
                $(ddI._labelsDom).fadeOut(100);

                ddI.render3DLabels();
            }
            else if (state === STATE.DOLLY) {

                if (scope.noZoom === true) return;

                dollyEnd.set(event.clientX, event.clientY);
                dollyDelta.subVectors(dollyEnd, dollyStart);

                if (dollyDelta.y > 0) {

                    scope.dollyIn();

                }
                else {

                    scope.dollyOut();

                }

                dollyStart.copy(dollyEnd);
                $(ddI._labelsDom).fadeOut(100);

                ddI.render3DLabels();
            }
            else if (state === STATE.PAN) {

                if (scope.noPan === true) return;

                panEnd.set(event.clientX, event.clientY);
                panDelta.subVectors(panEnd, panStart);

                scope.pan(panDelta);

                panStart.copy(panEnd);
                $(ddI._labelsDom).fadeOut(100);

                ddI.render3DLabels();
            }
            scope.update();


        }

        function onMouseUp(/* event */) {
            if (scope.enabled === false) return;
            state = STATE.NONE;
            $(ddI._labelsDom).fadeIn(100);
            ddI.renderLabels();
            ddI.render3DLabels();
            ddI.renderSprites();
        }

        function onMouseWheel(event) {

            if (scope.enabled === false || scope.noZoom === true) return;

            var delta = 0;

            if (event.wheelDelta) { // WebKit / Opera / Explorer 9

                delta = event.wheelDelta;

            }
            else if (event.detail) { // Firefox

                delta = -event.detail;

            }

            if (delta > 0) {

                scope.dollyOut();

            }
            else {

                scope.dollyIn();

            }

            ddI.render3DLabels();

            if (this.timer) {
                $(ddI._labelsDom).fadeOut(100);
                window.clearTimeout(this.timer);
            }
            this.timer = window.setTimeout(function () {
                $(ddI._labelsDom).fadeIn(100);
                ddI.renderLabels.apply(ddI);
                ddI.render3DLabels.apply(ddI);
                ddI.renderSprites.apply(ddI);
            }, 100);
        }

        function onKeyDown(event) {

            if (scope.enabled === false) {
                return;
            }
            if (scope.noKeys === true) {
                return;
            }
            if (scope.noPan === true) {
                return;
            }

            // pan a pixel - I guess for precise positioning?
            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            var needUpdate = false;

            switch (event.keyCode) {

                case scope.keys.UP:
                    scope.pan(new THREE.Vector2(0, scope.keyPanSpeed));
                    needUpdate = true;
                    break;
                case scope.keys.BOTTOM:
                    scope.pan(new THREE.Vector2(0, -scope.keyPanSpeed));
                    needUpdate = true;
                    break;
                case scope.keys.LEFT:
                    scope.pan(new THREE.Vector2(scope.keyPanSpeed, 0));
                    needUpdate = true;
                    break;
                case scope.keys.RIGHT:
                    scope.pan(new THREE.Vector2(-scope.keyPanSpeed, 0));
                    needUpdate = true;
                    break;
            }

            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            if (needUpdate) {

                scope.update();

            }
            ddI.renderLabels();
            ddI.render3DLabels();
            ddI.renderSprites();

        }

        function touchstart(event) {

            if (scope.enabled === false) {
                return;
            }

            switch (event.touches.length) {

                case 1:	// one-fingered touch: rotate
                    if (scope.noRotate === true) {
                        return;
                    }

                    state = STATE.TOUCH_ROTATE;

                    rotateStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                    break;

                case 2:	// two-fingered touch: dolly
                    if (scope.noZoom === true) {
                        return;
                    }

                    state = STATE.TOUCH_DOLLY;

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    dollyStart.set(0, distance);
                    break;

                case 3: // three-fingered touch: pan
                    if (scope.noPan === true) {
                        return;
                    }

                    state = STATE.TOUCH_PAN;

                    panStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                    break;

                default:
                    state = STATE.NONE;

            }
        }

        function touchmove(event) {

            if (scope.enabled === false) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            switch (event.touches.length) {

                case 1: // one-fingered touch: rotate
                    if (scope.noRotate === true) {
                        return;
                    }
                    if (state !== STATE.TOUCH_ROTATE) {
                        return;
                    }

                    rotateEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                    rotateDelta.subVectors(rotateEnd, rotateStart);

                    // rotating across whole screen goes 360 degrees around
                    scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

                    rotateStart.copy(rotateEnd);
                    break;

                case 2: // two-fingered touch: dolly
                    if (scope.noZoom === true) {
                        return;
                    }
                    if (state !== STATE.TOUCH_DOLLY) {
                        return;
                    }

                    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                    var distance = Math.sqrt(dx * dx + dy * dy);

                    dollyEnd.set(0, distance);
                    dollyDelta.subVectors(dollyEnd, dollyStart);

                    if (dollyDelta.y > 0) {

                        scope.dollyOut();

                    }
                    else {

                        scope.dollyIn();

                    }

                    dollyStart.copy(dollyEnd);
                    break;

                case 3: // three-fingered touch: pan
                    if (scope.noPan === true) {
                        return;
                    }
                    if (state !== STATE.TOUCH_PAN) {
                        return;
                    }

                    panEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                    panDelta.subVectors(panEnd, panStart);

                    scope.pan(panDelta);

                    panStart.copy(panEnd);
                    break;

                default:
                    state = STATE.NONE;

            }

            ddI.renderLabels();
            ddI.render3DLabels();
            ddI.renderSprites();

        }

        function touchend(/* event */) {

            if (scope.enabled === false) {
                return;
            }

            state = STATE.NONE;
            ddI.renderLabels();
            ddI.render3DLabels();
            ddI.renderSprites();
        }

        document.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        }, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousewheel', onMouseWheel, false);
        document.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

        document.addEventListener('keydown', onKeyDown, false);

        document.addEventListener('touchstart', touchstart, false);
        document.addEventListener('touchend', touchend, false);
        document.addEventListener('touchmove', touchmove, false);

    }
    OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
    OrbitControls.prototype.constructor = OrbitControls;

    DataDoo.OrbitControls = OrbitControls;
})(window.DataDoo);
(function (DataDoo) {
    function Label(message, posn3D, ddInstance) {
        THREE.Object3D.call(this, message, posn3D, ddInstance);

        //Trick borrowed from MathBox!
        var element = document.createElement('div');
        var inner = document.createElement('div');
        element.appendChild(inner);

        // Position at anchor point
        element.className = 'datadoo-label';
        inner.className = 'datadoo-wrap';
        inner.style.position = 'relative';
        inner.style.display = 'inline-block';
        /*inner.style.fontSize = '11px';*/
        inner.style.left = '-50%';
        inner.style.top = '-.5em';
        inner.style.padding = "5px";
        inner.style.backgroundColor = "transparent";
        //inner.style.border = "1px dashed silver";


        element.style.display = 'none'; // start as hidden. made visible only when position is set
        element.style.position = 'absolute';
        element.style.fontSize = '11px';
        element.style.width = message.length * parseInt(this.fontSize, 10) + 10 + "px";
        element.style.left = 0;
        element.style.top = 0;
        element.style.opacity=1;
        element.style.zIndex=1;

        this.message = (message).toString() || "empty label";
        inner.appendChild(document.createTextNode(this.message));

        this.inner = inner;
        this.element = element;


        //The following position property refers to the 3d point in the scene, to which the html-label is supposed to be attached.
        //The html-label's cordinates are calculated from it (by unprojection algo).
        this.position = posn3D || new THREE.Vector3(0,0,0);

        this.type = "label";
        ddInstance._labelsDom.appendChild(element);

        //internal
        this._posX=0;
        this._posY=0;
        this._width=0;
        this._height=0;
        this._distance = 0;
        this._zIndex = 1;
        this.visible = true;

        ddInstance._labels.push(this);
    }

    Label.prototype = new THREE.Object3D();
    Label.prototype.constructor = Label;

    DataDoo.Label = Label;

    Label.prototype.hide = function () {
        this.element.style.display = "none";
        this.visible = false;
    };

    Label.prototype.show = function () {
        this.element.style.display = "block";
        this.visible = true;
    };

    Label.prototype.update = function (pos, op, z, fsize, rotAngle) {
        this.element.style.top = pos.top + 10 +  "px";
        this.element.style.left = pos.left + 10 + "px";
        this.element.style.opacity = op;
        this.element.style.zIndex = z;
        this.element.style.fontSize = fsize;

        /*$(this.element).css({
            "webkitTransform":"rotate(" + rotAngle + "deg)",
            "MozTransform":"rotate(" + rotAngle + "deg)",
            "transform":"rotate(" + rotAngle + "deg)"
        });*/
    };


})(window.DataDoo);

(function (DataDoo) {
    function Sprite(message, parameters, ddInstance) {
        THREE.Object3D.call(this);

        if (parameters === undefined) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ? parameters.fontface : "Arial";

        var fontsize = 4 * (parameters.hasOwnProperty("fontsize") ? parameters.fontsize : 15);

        var textColor = parameters.hasOwnProperty("textColor") ? parameters.textColor : "rgba(0, 0, 0, 1.0)";

        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters.backgroundColor : { r : 255, g : 255, b : 255, a : 1.0 };

        var spriteAlignment = THREE.SpriteAlignment.centerLeft;

        var canvas = document.getElementById("helperCanvas");
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.setAttribute("id", "helperCanvas");
            canvas.width = 1000;
            canvas.height = 100;
        }

        var context = canvas.getContext('2d');
        context.clearRect(0,0,1000,100);


        context.font = fontsize + "px " + fontface;
        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;
        var textHeight = fontsize;

        context.textAlign = "center";
        context.textBaseline = "middle";

        // text color
        var tColor = new THREE.Color(textColor);

        //context.fillStyle ="rgba{155,155,255,1.0}";
        /*context.beginPath();
         context.moveTo(x + r, y);
         context.lineTo(x + w - r, y);
         context.quadraticCurveTo(x + w, y, x + w, y + r);
         context.lineTo(x + w, y + h - r);
         context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
         context.lineTo(x + r, y + h);
         context.quadraticCurveTo(x, y + h, x, y + h - r);
         context.lineTo(x, y + r);
         context.quadraticCurveTo(x, y, x + r, y);
         context.closePath();*/
        //context.fillRect(0,0,1000,100);

        //context.fillStyle = "rgba(" + tColor.r * 255 + "," + tColor.g * 255 + "," + tColor.b * 255 + "," + " 1.0)";
        context.fillStyle = "rgba(0, 0, 0, 1.0)";

        context.fillText(message, textWidth / 2, textHeight / 2);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({ map : texture, useScreenCoordinates : false, sizeAttenuation : true, alignment : spriteAlignment });
        //spriteMaterial.transparent = true;


        var textObject = new THREE.Object3D();
        var sprite = new THREE.Sprite(spriteMaterial);
        textObject.textHeight = fontsize;
        textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
        sprite.scale.set(50,5, 1);
        //sprite.scale.multiplyScalar(20);

        sprite.type = "sprite";
        ddInstance._sprites.push(sprite);
        return sprite;
    }
    DataDoo.Sprite = Sprite;

})(window.DataDoo);
