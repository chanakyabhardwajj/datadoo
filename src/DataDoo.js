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
        /*this.renderer.setClearColor(0xffffff, 1);*/
        this.renderer.setClearColor(this.theme[4], 1);

        this.axesConf = params.axes;
        this.cameraConf = params.camera;

        this.lightsConf = params.lights;
        this.sceneConf = params.scene;

        //Internal Arrays
        this._labels = [];
        this._nodes = [];

    }

    DataDoo.prototype.prepareScene = function () {
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
        this.renderer.setSize(this.renderer.domElement.width, this.renderer.domElement.height);

        //AXES
        /*this.axes = new DataDoo.AxesHelper(this.axesConf.x, this.axesConf.y, this.axesConf.z);
         this.bucket.axes = this.axes;
         this.scene.add(this.axes);*/

        //CAMERA
        var camSettings = this.cameraConf;
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
        this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement, this);
        this.cameraControls.maxDistance = 10000;
        this.cameraControls.minDistance = 5;
        this.cameraControls.autoRotate = false;

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

    DataDoo.prototype.prepareAxes = function () {
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

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[2]).data);
            if (this.datasets[x].column(colNames[2]).type !== "number") {
                this.zAxis.colType = "mixed";
            }
        }
        this.zAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.xObj = this.axesConf.x;
        this.yObj = this.axesConf.y;
        this.zObj = this.axesConf.z;

        //GRID
        if (this.gridBoolean) {
            //the following code-block is similar to THREE.GridHelper
            //but manually coding it, to keep the customising options open
            var size = this.goldenDim, step = this.gridStep;

            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({ color : /*0xBED6E5*/ this.theme[2], opacity : 0.5, linewidth : 1 });

            for (i = -size; i <= size; i += step) {

                geometry.vertices.push(new THREE.Vector3(-size, 0, i));
                geometry.vertices.push(new THREE.Vector3(size, 0, i));

                geometry.vertices.push(new THREE.Vector3(i, 0, -size));
                geometry.vertices.push(new THREE.Vector3(i, 0, size));

            }

            this.grid = new THREE.Line(geometry, material, THREE.LinePieces);
            this.grid.position.y = -0.1;
            this.scene.add(this.grid);
        }

        var notchLabel, notchShape;
        var xline, xlineGeometry = new THREE.Geometry();
        var yline, ylineGeometry = new THREE.Geometry();
        var zline, zlineGeometry = new THREE.Geometry();

        if (this.xAxis.colType === "number") {
            this.xAxis.length = Math.max(_.max(this.xAxis.colUniqs), 0) - Math.min(_.min(this.xAxis.colUniqs), 0) + this.gridStep;
            this.xAxis.from = new THREE.Vector3(Math.min(_.min(this.xAxis.colUniqs), 0), 0, 0);
            this.xAxis.to = new THREE.Vector3(Math.max(_.max(this.xAxis.colUniqs), 0), 0, 0);
        }
        else {
            this.xAxis.length = this.xAxis.colUniqs.length * this.gridStep;
            this.xAxis.from = new THREE.Vector3(0, 0, 0);
            this.xAxis.to = new THREE.Vector3((this.xAxis.colUniqs.length + 1) * this.gridStep, 0, 0);
        }

        if (this.yAxis.colType === "number") {
            this.yAxis.length = Math.max(_.max(this.yAxis.colUniqs), 0) - Math.min(_.min(this.yAxis.colUniqs), 0) + this.gridStep;
            this.yAxis.from = new THREE.Vector3(0, Math.min(_.min(this.yAxis.colUniqs), 0), 0);
            this.yAxis.to = new THREE.Vector3(0, Math.max(_.max(this.yAxis.colUniqs), 0), 0);
        }
        else {
            this.yAxis.length = this.yAxis.colUniqs.length * this.gridStep;
            this.yAxis.from = new THREE.Vector3(0, 0, 0);
            this.yAxis.to = new THREE.Vector3(0, (this.yAxis.colUniqs.length + 1) * this.gridStep, 0);
        }

        if (this.zAxis.colType === "number") {
            this.zAxis.length = Math.max(_.max(this.zAxis.colUniqs), 0) - Math.min(_.min(this.zAxis.colUniqs), 0) + this.gridStep;
            this.zAxis.from = new THREE.Vector3(0, 0, Math.min(_.min(this.zAxis.colUniqs), 0));
            this.zAxis.to = new THREE.Vector3(0, 0, Math.max(_.max(this.zAxis.colUniqs), 0));
        }
        else {
            this.zAxis.length = this.zAxis.colUniqs.length * this.gridStep;
            this.zAxis.from = new THREE.Vector3(0, 0, 0);
            this.zAxis.to = new THREE.Vector3(0, 0, (this.zAxis.colUniqs.length + 1) * this.gridStep);
        }

        xlineGeometry.vertices.push(this.xAxis.from);
        xlineGeometry.vertices.push(this.xAxis.to);
        xlineGeometry.computeLineDistances();
        label = new DataDoo.Label(this.xAxis.colName, new THREE.Vector3(this.xAxis.length + Math.max(this.xAxis.length / 10, 10), 1, 0), this);
        xline = new THREE.Line(xlineGeometry, new THREE.LineDashedMaterial({ dashSize : this.gridStep / 4, linewidth : 2, color : /*this.axesConf.x.color*/ this.theme[0] }), THREE.LinePieces);
        xline.matrixAutoUpdate = false;
        this.xAxis.add(label);
        this.xAxis.add(xline);

        ylineGeometry.vertices.push(this.yAxis.from);
        ylineGeometry.vertices.push(this.yAxis.to);
        ylineGeometry.computeLineDistances();
        label = new DataDoo.Label(this.yAxis.colName, new THREE.Vector3(1, this.yAxis.length + Math.max(this.yAxis.length / 10, 10), 0), this);
        yline = new THREE.Line(ylineGeometry, new THREE.LineDashedMaterial({ dashSize : this.gridStep / 4, linewidth : 2, color : /*this.axesConf.y.color*/ this.theme[0] }), THREE.LinePieces);
        yline.matrixAutoUpdate = false;
        this.yAxis.add(label);
        this.yAxis.add(yline);

        zlineGeometry.vertices.push(this.zAxis.from);
        zlineGeometry.vertices.push(this.zAxis.to);
        zlineGeometry.computeLineDistances();
        label = new DataDoo.Label(this.zAxis.colName, new THREE.Vector3(0, 1, this.zAxis.length + Math.max(this.zAxis.length / 10, 10)), this);
        zline = new THREE.Line(zlineGeometry, new THREE.LineDashedMaterial({ dashSize : this.gridStep / 4, linewidth : 2, color : /*this.axesConf.z.color*/ this.theme[0] }), THREE.LinePieces);
        zline.matrixAutoUpdate = false;
        this.zAxis.add(label);
        this.zAxis.add(zline);

        /*
         var xconeGeometry = new THREE.CylinderGeometry( 0, 5, 10, 25, 5 );
         this.xcone = new THREE.Mesh( xconeGeometry, new THREE.MeshBasicMaterial( { color: this.xObj.color } ) );
         //this.xcone.matrixAutoUpdate = false;
         this.xcone.rotateZ(-Math.PI/2);
         this.xcone.position = new THREE.Vector3( this.xObj.length, 0, 0 );
         this.xAxis.add(this.xcone);
         */

        var notchGeom = new THREE.CubeGeometry(0.2, 0.2, 0.2);
        var notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.x.color*/ this.theme[1], opacity : 0.4});

        for (i = 0, j = this.xAxis.length / this.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);

            if (this.xAxis.colType === "number") {
                notchShape.position.set((this.xAxis.from.x - (this.xAxis.from.x % this.gridStep)) + (this.gridStep * i), this.xAxis.from.y, this.xAxis.from.z);
                notchLabel = new DataDoo.Label((this.xAxis.from.x - (this.xAxis.from.x % this.gridStep)) + (this.gridStep * i), notchShape.position, this);
            }
            else {
                notchShape.position.set((this.xAxis.from.x - (this.xAxis.from.x % this.gridStep)) + (this.gridStep * (i + 1)), this.xAxis.from.y, this.xAxis.from.z);
                notchLabel = new DataDoo.Label(this.xAxis.colUniqs[i], notchShape.position, this);
            }
            this.xAxis.add(notchShape);
            this.xAxis.add(notchLabel);
        }

        notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.y.color*/ this.theme[1], opacity : 0.4});

        for (i = 0, j = this.yAxis.length / this.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);
            if (this.yAxis.colType === "number") {
                notchShape.position.set(this.yAxis.from.x, (this.yAxis.from.y - (this.yAxis.from.y % this.gridStep)) + (this.gridStep * i), this.yAxis.from.z);
                notchLabel = new DataDoo.Label((this.yAxis.from.y - (this.yAxis.from.y % this.gridStep)) + (this.gridStep * i), notchShape.position, this);
            }
            else {
                notchShape.position.set(this.yAxis.from.x, (this.yAxis.from.y - (this.yAxis.from.y % this.gridStep)) + (this.gridStep * (i + 1)), this.yAxis.from.z);
                notchLabel = new DataDoo.Label(this.yAxis.colUniqs[i], notchShape.position, this);
            }
            this.yAxis.add(notchShape);
            this.yAxis.add(notchLabel);
        }

        notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.z.color*/ this.theme[1], opacity : 0.4});

        for (i = 0, j = this.zAxis.length / this.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);
            if (this.zAxis.colType === "number") {
                notchShape.position.set(this.zAxis.from.x, this.zAxis.from.y, (this.zAxis.from.z - (this.zAxis.from.z % this.gridStep)) + (this.gridStep * i));
                notchLabel = new DataDoo.Label((this.zAxis.from.z - (this.zAxis.from.z % this.gridStep)) + (this.gridStep * i), notchShape.position, this);
            }
            else {
                notchShape.position.set(this.zAxis.from.x, this.zAxis.from.y, (this.zAxis.from.z - (this.zAxis.from.z % this.gridStep)) + (this.gridStep * (i + 1)));
                notchLabel = new DataDoo.Label(this.zAxis.colUniqs[i], notchShape.position, this);
            }
            this.zAxis.add(notchShape);
            this.zAxis.add(notchLabel);
        }

        this.scene.add(this.xAxis);
        this.scene.add(this.yAxis);
        this.scene.add(this.zAxis);

    };

    DataDoo.prototype.renderLabels = function () {
        var self = this, vector = new THREE.Vector3(), w = self.renderer.domElement.width, h = self.renderer.domElement.height, dist, zInd, op;

        self.projScreenMatrix.multiplyMatrices(self.camera.projectionMatrix, self.camera.matrixWorldInverse);
        self.frustum.setFromMatrix(self.projScreenMatrix);

        _.each(self._labels, function (label) {
            vector.getPositionFromMatrix(label.matrixWorld);

            if (!label.visible || !self.frustum.containsPoint(vector)) {
                label.hide();
            }
            else {
                var vector2 = self.projector.projectVector(vector.clone(), self.camera);
                vector2.x = (vector2.x + 1) / 2 * w;
                vector2.y = -(vector2.y - 1) / 2 * h;

                dist = vector.distanceTo(self.camera.position);
                zInd = Math.floor(10000 - dist);
                if (dist > 10 * this.goldenDim) {
                    op = 0;
                }
                else {
                    op = this.goldenDim / dist;
                }

                label.update({top : vector2.y, left : vector2.x}, op, zInd);
                label.show();
            }
        }, self);
    };

    DataDoo.prototype.build = function () {
        var i, j, x,y;
        for(i=0,j=this.datasets.length; i<j; i++){
            var ds = this.datasets[i];
            for(x = 0,y = ds.length; x<y; x++){
                var row = ds.rowByPosition(x);
                var returnedObj = ds.builder(row, x);
                console.log(returnedObj);

                var node = returnedObj.shape;
                var colNames= ds.columnNames();
                var posArr = [];
                for(var k= 0,l=colNames.length; k<l; k++){
                    if(ds.column(colNames[k]).type === "number"){
                        posArr.push(row[colNames[k]]);
                    }
                    else{
                        posArr.push(this.gridStep * (x + 1));
                    }
                }

                node.position.set(posArr[0],posArr[1],posArr[2]);
                var label = new DataDoo.Label(returnedObj.text, node.position, this);
                node.add(label);

                this._nodes.push(node);
                this.scene.add(node);
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
                self.build();
            });
        }

        function renderFrame() {
            raf(renderFrame);
            self.renderer.render(self.scene, self.camera);
            self.cameraControls.update();
            //self.renderLabels();
        }

        raf(renderFrame);
        setTimeout(function () {
            self.renderLabels();
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
            farP : 20000,
            nearO : -50,
            farO : 10000,
            position : {x : 100, y : 100, z : 200}
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