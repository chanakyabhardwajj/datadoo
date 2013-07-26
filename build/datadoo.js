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
        DESCENDING: 8,

        // coordinate system types
        CARTESIAN: 9,
        SPHERICAL: 10
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

        traverseObject3D : function (object, iter, context) {
            _.each(object.children, function (child) {
                iter.call(context, child);
                this.traverseObject3D(child, iter, context);
            }, this);
        },

        onResolveAll : (function () {
            function clear(array) {
                for (var i = 0; i < array.length; i++) {
                    array[i] = false;
                }
            }

            function makeCallback(i, array, finalCallback) {
                return function () {
                    array[i] = true;
                    if (_.every(array)) {
                        finalCallback();
                        clear(array);
                    }
                };
            }

            return function () {
                var finalCallback = _.last(arguments);
                var objects = _.first(arguments, arguments.length - 1);
                var resolved = new Array(objects.length);
                clear(resolved);
                _.each(objects, function (object, i) {
                    object.bindOnResolve(makeCallback(i, resolved, finalCallback));
                });
            };
        })(),

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
                parameters.backgroundColor : { r : 255, g : 255, b : 255, a : 1.0 };

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
        },

        swatches : [
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

        ]

    };
})(window.DataDoo);

(function(DataDoo) {

    function DDObject3D() {
        THREE.Object3D.call(this);
        this.matrixAutoUpdate = false;
        this.position = new DataDoo.RVector3(this);
        this.dependants = [];
        this.dependencies = [];
    }
    DDObject3D.prototype = Object.create(THREE.Object3D.prototype);
    DataDoo.DDObject3D = DDObject3D;

    DDObject3D.prototype.addDependant = function(object) {
        if(!(object instanceof DDObject3D)) {
            throw new Error("Cannot set dependency on non-DDObject3D objects");
        }
        this.dependants.push(object);
    };

    DDObject3D.prototype.addDependancy = function() {
        var list = _.flatten(arguments);
        _.each(list, function(object) {
            if(object instanceof DDObject3D) {
                this.dependencies.push(object);
            }
        }, this);
    };

    DDObject3D.prototype.getVectors = function() {
        var points = _.flatten(arguments);
        return _.map(points, function(point) {
            if(point instanceof THREE.Object3D) {
                return point.position;
            } else if(point instanceof THREE.Vector3){
                return point;
            }
            throw new Error("DDObject3D : getVectors cannot find vector in argument");
        });
    };

    DDObject3D.prototype.update = function(axesConf) {
        if(!this.matrixWorldNeedsUpdate) {
            return;
        }

        // check if all of this object's dependencies have updated
        var check = [this.parent.matrixWorldNeedsUpdate];
        if(this.position.relative) {
            check.push(this.position.target.matrixWorldNeedsUpdate);
        }
        _.each(this.dependencies, function(dependency) {
            check.push(dependency.matrixWorldNeedsUpdate);
        });
        if(!_.every(check, function(v) {return !v;})) {
            // all of the dependencies' matrixWorldNeedsUpdate are not false
            // so return for now.
            return;
        }

        //resolve the position
        if(this.position.setOnAxes) {
            _.each(["x", "y", "z"], function(axis) {
                var axisConf = axesConf[axis];
                if(axisConf.type == DataDoo.NUMBER) {
                    this.position[axis] = this.position["r"+axis];
                }
                if(axisConf.type == DataDoo.COLUMNVALUE) {
                    this.position[axis] = axisConf.posMap[this.position["r"+axis]];
                }
            }, this);
        }
        if(this.position.relative) {
            var target = this.position.target;
            var worldPos = target.parent.localToWorld(target.position);
            var finalPos = this.parent.worldToLocal(worldPos);
            finalPos.x += finalPos.rx;
            finalPos.y += finalPos.ry;
            finalPos.z += finalPos.rz;
            this.position.copy(finalPos);
        }

        // update the geometry
        if(this.updateGeometry) {
            this.updateGeometry();
        }

        // update this object's world matrix
        this.updateMatrix();
        if(this.parent === undefined) {
            this.matrixWorld.copy(this.matrix);
        } else {
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }
        this.matrixWorldNeedsUpdate = false;


        // call update on all dependants
        _.each(this.dependants, function(object) {
            object.update(axesConf);
        }, this);

        // call update or updateMatrixWorld on all children
        _.each(this.children, function(child) {
            if(child instanceof DDObject3D) {
                child.update(axesConf);
            } else {
                child.updateMatrixWorld(true);
            }
        });
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
     * DataDoo Resolvable vector
     */
    function RVector3(parent) {
        THREE.Vector3.call(this);
        this.parent = parent;
        this.setOnAxes = false;
        this.relative = false;
    }
    DataDoo.RVector3 = RVector3;
    RVector3.prototype = Object.create(THREE.Vector3.prototype);

    RVector3.prototype.set = function(x, y, z) {
        this.setOnAxes = true;
        this.relative = false;
        this.x = x;
        this.y = y;
        this.z = z;
        this.target = undefined;
    };

    RVector3.prototype.setOnAxes = function(rx, ry, rz){
        this.setOnAxes = true;
        this.relative = false;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
    };

    RVector3.prototype.setRelative = function(target, rx, ry, rz) {
        this.relative = true;
        this.setOnAxes = false;
        this.rx = rx || 0;
        this.ry = ry || 0;
        this.rz = rz || 0;
        this.target = target;
        target.addDependant(this.parent);
        this.parent.addDependancy(target);
    };

    /**
     * Anchored vector.
     * These are vectors that can be anchored to
     * another DDObject3D. The position will
     * always resolve to the correct position irrespective
     * of the object hierarchy
     * parent - The parent DDObject3D. The final position will be
     *          relative to this object.
     * srcParent - The DDObject3D to which the position should be
     *             anchored. The source vector is relative to this
     *             object.
     * srcVector - The vector to be translated, this vector is 
     *             relative to srcParent. Defaults to srcParent's
     *             position.
     */
    function AnchoredVector3(parent, srcParent, srcVector) {
        THREE.Vector3.call(this);
        this.parent = parent;
        this.srcVector = srcVector;
        this.srcParent = srcParent;

        var self = this;
        DataDoo.utils.onResolveAll(this.parent, this.srcParent, function() {
            self._resolve();
        });
    }
    DataDoo.AnchoredVector3 = AnchoredVector3;
    AnchoredVector3.prototype = Object.create(THREE.Vector3.prototype);
    AnchoredVector3.prototype._resolve = function() {
        var obj;

        if(this.srcVector) {
            this.copy(this.srcVector);
            obj = this.srcParent;
        } else {
            this.copy(this.srcParent.position);
            obj = this.srcParent.parent;
        }

        while(obj) {
            this.add(obj.position);
            obj = obj.parent;
        }

        obj = this.parent;
        while(obj) {
            this.sub(obj.position);
            obj = obj.parent;
        }
    };
})(window.DataDoo);

(function (DataDoo) {
    /**
     *  Primitive base class
     */
    function Primitive() {
        DataDoo.DDObject3D.call(this);
    }

    Primitive.prototype = Object.create(DataDoo.DDObject3D.prototype);
    DataDoo.Primitive = Primitive;

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

    /**
     *  Sphere primitive
     */
    function Sphere(radius, color, opacity, wireframe) {
        Primitive.call(this);
        this.radius = radius || 10;
        this.color = color || 0x8888ff;
        this.opacity = opacity || 1;
        this.wireframe = wireframe || false;

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent:true});
        this.geometry = new THREE.SphereGeometry(this.radius, 50, 50);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }
    Sphere.prototype = Object.create(Primitive.prototype);
    DataDoo.Sphere = Sphere;
    Sphere.prototype.setRadius = function (radius) {
        this.radius = radius;
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh.setGeometry(this.geometry);
    };

    /**
     *  Cube primitive
     */
    function Cube(width, height, depth, color, opacity, wireframe) {
        Primitive.call(this);
        this.width = width || 10;
        this.height = height || 10;
        this.depth = depth || 10;
        this.color = color || 0x767676;
        this.opacity = opacity || 1;
        this.wireframe = wireframe || false;

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent:true});
        this.geometry = new THREE.CubeGeometry(this.width, this.height, this.depth);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }
    Cube.prototype = Object.create(Primitive.prototype);
    Cube.prototype.updateGeometry = function(){
        this.geometry.computeLineDistances();
    };
    DataDoo.Cube = Cube;

    /**
     *  Line primitive
     */
    function Line(startPos, endPos, color, thickness, opacity) {
        Primitive.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0x000000;

        this.addDependancy(startPos, endPos);
        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(this.getVectors(startPos, endPos));
        this.lineMaterial = new THREE.LineBasicMaterial({ color : this.color, linewidth : this.thickness, opacity : this.opacity, transparent:true });
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);

        this.add(this.line);
    }
    Line.prototype = Object.create(Primitive.prototype);
    Line.prototype.updateGeometry = function(){
        this.lineGeometry.computeLineDistances();
    };
    DataDoo.Line = Line;

    /**
     *  DashedLine primitive
     */
    function DashedLine(startPos, endPos, color, dashSize, gapSize, thickness, opacity) {
        Primitive.call(this);
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0xffaa00;
        this.thickness = thickness || 1;
        this.opacity = opacity || 0.6;

        this.addDependancy(startPos, endPos);
        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(this.getVectors(startPos, endPos));
        this.lineMaterial = new THREE.LineDashedMaterial({color : this.color, opacity:this.opacity, linewidth:this.thickness, dashSize:this.dashSize, gapSize:this.gapSize, transparent:true});
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
        this.add(this.line);
    }
    DashedLine.prototype = Object.create(Primitive.prototype);
    DashedLine.prototype.updateGeometry = function(){
        this.lineGeometry.computeLineDistances();
    };
    DataDoo.DashedLine = DashedLine;

    /**
     *  Cone primitive
     */
    function Cone(height, topRadius, baseRadius, color, opacity) {
        Primitive.call(this);

        this.height = height || 5;
        this.topRadius = topRadius || 0;
        this.baseRadius = baseRadius || 5;
        this.opacity = opacity || 1;
        this.color = color || 0x767676;


        var coneGeometry = new THREE.CylinderGeometry(this.topRadius, this.baseRadius, this.height, 20, 20);
        var coneMat = new THREE.MeshLambertMaterial({ color : this.color, opacity : this.opacity, transparent:true});
        this.cone = new THREE.Mesh(coneGeometry, coneMat);


        this.add(this.cone);
    }
    Cone.prototype = Object.create(Primitive.prototype);
    Cone.prototype.setDirection = function(dir){
        this.setDirection(dir, this.cone);
    };
    DataDoo.Cone = Cone;

    /**
     *  Arrow primitive
     */
    function Arrow(configObj) {
         /*
             from : new THREE.Vector3(0,0,0),
             to : new THREE.Vector3(0,100,0),

             lineDivisions : 10,
             lineColor : "0x000000",
             lineThickness : 1,
             lineOpacity : 1,

             fromCone : false,
             fromConeHeight : 10,
             fromConeTopRadius : 1,
             fromConeBaseRadius : 5,
             fromConeColor : "0xff0000",
             fromConeOpacity : 1,

             toCone : true,
             toConeHeight : 5,
             toConeTopRadius : 0,
             toConeBaseRadius : 3,
             toConeColor : "0x000000",
             toConeOpacity : 0.5
         */


        Primitive.call(this);
        configObj = configObj || {};

        this.fromPosition = configObj.from;
        this.toPosition = configObj.to;

        //this.arrowLineDirection = this.toPosition.clone().sub(this.fromPosition).normalize();

        this.arrowLineOpacity = configObj.lineOpacity || 1;
        this.arrowLineThickness = configObj.lineThickness || 1;
        this.arrowLineDivisions = configObj.lineDivisions || 0;
        this.arrowLineColor = configObj.lineColor || "0x000000";


        this.fromCone = configObj.fromCone || false;
        this.fromConeHeight = configObj.fromConeHeight || 5;
        this.fromConeTopRadius = configObj.fromConeTopRadius || 0;
        this.fromConeBaseRadius = configObj.fromConeBaseRadius || 3;
        this.fromConeColor = configObj.fromConeColor || "0x000000";
        this.fromConeOpacity = configObj.fromConeOpacity || 1;

        this.toCone = configObj.toCone || false;
        this.toConeHeight = configObj.toConeHeight || 5;
        this.toConeTopRadius = configObj.toConeTopRadius || 0;
        this.toConeBaseRadius = configObj.toConeBaseRadius || 3;
        this.toConeColor = configObj.toConeColor || "0x000000";
        this.toConeOpacity = configObj.toConeOpacity || 1;

        this.line = new DataDoo.Line(this.fromPosition, this.toPosition, this.arrowLineColor, this.arrowLineThickness, this.arrowLineOpacity);
        this.add(this.line);

        if (this.fromCone) {
            this.fromCone = new DataDoo.Cone(this.fromConeHeight, this.fromConeTopRadius, this.fromConeBaseRadius, this.fromConeColor, this.fromConeOpacity);
            this.add(this.fromCone);
            this.fromCone.position = this.fromPosition;
        }

        if (this.toCone) {
            this.toCone = new DataDoo.Cone(this.toConeHeight, this.toConeTopRadius, this.toConeBaseRadius, this.toConeColor, this.toConeOpacity);
            this.add(this.toCone);
            this.toCone.position = this.toPosition;
        }
    }

    Arrow.prototype = Object.create(Primitive.prototype);
    Arrow.prototype.updateGeometry = function(){
        var positions = this.getVectors(this.toPosition, this.fromPosition);
        this.arrowLineDirection = positions[0].clone().sub(positions[1]).normalize();
        if(this.toCone) this.setDirection(this.arrowLineDirection, this.toCone);
        if(this.fromCone) this.setDirection(this.arrowLineDirection.clone().negate(), this.fromCone);
    };
    DataDoo.Arrow = Arrow;

    /**
     *  AxesHelper primitive
     */
    function AxesHelper(xObj, yObj, zObj) {
        /*
         x : {
             type : DataDoo.NUMBER,
             label : "x-axis",
             lineColor : "0x000000",
             labelColor : "0x000000",
             length : 150,
             withCone : false,
             thickness : 1
         }
        */

        Primitive.call(this);
        this.xObj = xObj || {};
        this.yObj = yObj || {};
        this.zObj = zObj || {};

        this.xAxis = new DataDoo.Arrow({
            from : new THREE.Vector3(0,0,0),
            to : new THREE.Vector3(150,0,0),
            lineDivisions : 10,
            fromCone : false,
            toCone : true
        });
        this.xlabel = new DataDoo.Label(this.xObj.label, new THREE.Vector3(150,1,0));
        this.add(this.xAxis);
        this.add(this.xlabel);

        this.yAxis = new DataDoo.Arrow({
            from : new THREE.Vector3(0,0,0),
            to : new THREE.Vector3(0,150,0),
            lineDivisions : 10,
            fromCone : false,
            toCone : true
        });
        this.ylabel = new DataDoo.Label(this.yObj.label, new THREE.Vector3(0,150,0));
        this.add(this.yAxis);
        this.add(this.ylabel);

        this.zAxis = new DataDoo.Arrow({
            from : new THREE.Vector3(0,0,0),
            to : new THREE.Vector3(0,0,150),
            lineDivisions : 10,
            fromCone : false,
            toCone : true
        });
        this.zlabel = new DataDoo.Label(this.zObj.label, new THREE.Vector3(0,0,150));
        this.add(this.zAxis);
        this.add(this.zlabel);
    }
    AxesHelper.prototype = Object.create(Primitive.prototype);
    DataDoo.AxesHelper = AxesHelper;

    /**
     *  Spline primitive
     */
    function Spline(points, color, subdivisions) {
        Primitive.call(this);
        this.points = points;
        this.color = color || 0xfc12340;
        this.subdivisions = subdivisions || 6;
        this.spline = new THREE.Spline(points);
        this.geometrySpline = new THREE.Geometry();
        this.mesh = new THREE.Line(this.geometrySpline, new THREE.LineDashedMaterial({ color : this.color, dashSize : 4, gapSize : 2, linewidth : 3 , transparent:true}), THREE.LineStrip);
        this.add(this.mesh);
    }

    Spline.prototype = Object.create(Primitive.prototype);
    Spline.prototype.updateGeometry = function(){
        var points = this.getVectors(this.points);
        for (var i = 0; i < points.length * this.subdivisions; i++) {
            var index = i / ( points.length * this.subdivisions );
            var position = this.spline.getPoint(index);
            this.geometrySpline.vertices[ i ] = new THREE.Vector3(position.x,position.y,position.z);
        }
        this.geometrySpline.computeLineDistances();
    };
    DataDoo.Spline = Spline;

    /**
     *  Sprite primitive
     */
    function Sprite(url, scale) {
        Primitive.call(this);
        this.map = THREE.ImageUtils.loadTexture(url);
        this.scale = scale;
        this.material = new THREE.SpriteMaterial({ map : this.map, useScreenCoordinates : false, color : 0xffffff, fog : true });
        this.sprite = new THREE.Sprite(this.material);
        this.sprite.scale.x = this.sprite.scale.y = this.sprite.scale.z = this.scale;
        this.add(this.sprite);
    }

    Sprite.prototype = Object.create(Primitive.prototype);
    DataDoo.Sprite = Sprite;

    /**
     *  Label primitive
     */
    //ToDo : Fix label toscreen coords for objects that are behind the camera!!
    function Label(message, labelPos) {
        Primitive.call(this);

        //Trick borrowed from MathBox!
        var element = document.createElement('div');
        var inner = document.createElement('div');
        element.appendChild(inner);

        // Position at anchor point
        element.className = 'datadoo-label';
        inner.className = 'datadoo-wrap';
        inner.style.position = 'relative';
        inner.style.display = 'inline-block';
        //inner.style.left = '-50%';
        //inner.style.top = '-.5em';

        this.message = message || "empty label";
        this.element = element;
        this.width = 0;
        this.height = 0;
        this.visible = true;
        this.content = this.message;

        element.style.position = 'absolute';
        element.style.left = 0;
        element.style.top = 0;
        inner.appendChild(document.createTextNode(this.message));

        labelPos = labelPos || new DataDoo.RVector3(this);
        this.position = labelPos;

        document.body.appendChild(element);
    }

    Label.prototype = Object.create(Primitive.prototype);
    DataDoo.Label = Label;
    Label.prototype.updateElemPos = function (top, left) {
        this.element.style.top = top + "px";
        this.element.style.left = left + "px";
    };


    /**
     * Primitive constructor helper mixin
     */
    DataDoo.PrimitiveHelpers = _.chain(DataDoo).pairs().filter(function(pair) {
        // filter out Primitive constructor classes from DataDoo
        return _.isFunction(pair[1]) && ("setDirection" in pair[1].prototype) && (pair[0] != "Primitive");
    }).map(function(pair) {
        var className = pair[0];
        var primClass = pair[1];
        return ["add" + className, function() {
            var args = arguments;
            function F() {
                return primClass.apply(this, args);
            }
            F.prototype = primClass.prototype;
            var primitive = new F();
            this.add(primitive);
            return primitive;
        }];
    }).object().value();

})(window.DataDoo);

(function(DataDoo) {

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(data) {
        DataDoo.DDObject3D.call(this);
        this.data = data || {};
    }
    Relation.prototype = Object.create(DataDoo.DDObject3D.prototype);
    _.extend(Relation.prototype, DataDoo.PrimitiveHelpers);
    DataDoo.Relation = Relation;


    function RelationSet() {
        Array.call(this);
    }
    RelationSet.prototype = Object.create(Array.prototype);
    DataDoo.RelationSet = RelationSet;
    RelationSet.prototype.addRelation = function() {
        var relation = new Relation();
        this.push(relation);
        return relation;
    };
})(window.DataDoo);



(function(DataDoo) {
    /**
     *  RelationGenerator class generates relations between nodes
     */
    function RelationGenerator(dd, id, /*array of nodeGenerators*/  ngs, appFn) {
        this.dd = dd;
        this.id = id;
        this.ngs = ngs;
        this.relations = new DataDoo.RelationSet();
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
        var oldRelations = this.relations;
        this.generateRelations();
        this.dd.eventBus.enqueue(this, "RELATION.UPDATE", {removed: oldRelations, added: this.relations});
    };

    RelationGenerator.prototype.generateRelations = function() {
        this.relations = new DataDoo.RelationSet();
        this.dd.bucket[this.id] = this.relations;
        this.appFn.call(this.relations, this.dd.bucket);
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
    DataDoo.NodeGenerator = NodeGenerator;
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
                this.dd.eventBus.enqueue(this, "NODE.UPDATE", {added: updatedNodes, removed: oldNodes});
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
        DataDoo.DDObject3D.call(this);
        this.data = data || {};
    }
    Node.prototype = Object.create(DataDoo.DDObject3D.prototype);
    _.extend(Node.prototype, DataDoo.PrimitiveHelpers);
    DataDoo.Node = Node;

})(window.DataDoo);

(function (DataDoo) {

    /*
     This is just a wrapper around the Arrow primitive.
     */


})(window.DataDoo);