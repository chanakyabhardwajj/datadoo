//Following the module pattern for DataDoo.
//Details here : http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html

window.DataDoo = (function(){
    "use strict";
     function DataDoo(params){

        //params is of the type :
         //{
         //    canvas : id,
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
         //    }
         //}

        params = params || {};
        params = _.extend(DataDoo.sceneDefaultParams, params);

        if(params.canvas === undefined){
            params.canvas = document.createElement( 'canvas' );
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
        this.renderer.setClearColor(0xffffff, 1);

        this.axesConf = params.axes;
        this.cameraConf = params.camera;
        this.gridBoolean = params.grid;
        this.lightsConf = params.lights;
        this.sceneConf = params.scene;
        this.goldenDim = 500;
    }

    DataDoo.sceneDefaultParams = {
        grid : true,
        camera : {
            type : "PERSPECTIVE",
            fov : 45,
            nearP : 0.1,
            farP : 20000,
            nearO : -50,
            farO : 10000,
            position : {x : 0, y : 150, z : 400}
        },
        axes : {
            x : {
                type : "NUMBER",
                label : "x-axis",
                length : 150,
                withCone : false,
                thickness : 1,
                lineColor : "0x000000",
                coneColor : "0x000000",
                notches : true,
                notchSpacing : 5,
                notchStartingFrom : 0,
                origin : new THREE.Vector3(0, 0, 0)
            },
            y : {
                type : "NUMBER",
                label : "y-axis",
                length : 150,
                withCone : false,
                thickness : 1,
                lineColor : "0x000000",
                coneColor : "0x000000",
                notchSpacing : 5,
                notchStartingFrom : 0,
                origin : new THREE.Vector3(0, 0, 0)
            },
            z : {
                type : "NUMBER",
                label : "z-axis",
                length : 150,
                withCone : false,
                thickness : 1,
                lineColor : "0x000000",
                coneColor : "0x000000",
                notchSpacing : 5,
                notchStartingFrom : 0,
                origin : new THREE.Vector3(0, 0, 0)
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
        this.renderer.setSize(this.canvas.width, this.canvas.height);

        //AXES
        /*this.axes = new DataDoo.AxesHelper(this.axesConf.x, this.axesConf.y, this.axesConf.z);
        this.bucket.axes = this.axes;
        this.scene.add(this.axes);*/

        //CAMERA
        var camSettings = this.cameraConf;
        this.camera = new THREE.CombinedCamera( this.renderer.domElement.width / 2, this.renderer.domElement.height / 2, this.cameraConf.fov, this.cameraConf.nearP, this.cameraConf.farP, this.cameraConf.nearO, this.cameraConf.farO );
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
        this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.cameraControls.maxDistance=10000;
        this.cameraControls.minDistance=5;
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

    DataDoo.prototype.run = function(){
        //Find out which form of requestAnimationFrame is supported.
        //Or else fall back to setTimeout
        var raf = this._raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            };

        this.prepareScene();
        var self = this;

        function renderFrame() {
            raf(renderFrame);
            self.renderer.render(self.scene, self.camera);
            self.cameraControls.update();
        }
        raf(renderFrame);
    };

    return DataDoo;
})();