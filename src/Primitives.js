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

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent : true});
        this.geometry = new THREE.SphereGeometry(1, 50, 50);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scale.set(this.radius, this.radius, this.radius);
        this.add(this.mesh);
    }

    Sphere.prototype = Object.create(Primitive.prototype);
    DataDoo.Sphere = Sphere;
    Sphere.prototype.setRadius = function (radius) {
        this.radius = radius;
        this.scale.set(this.radius, this.radius, this.radius);
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

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent : true});
        this.geometry = new THREE.CubeGeometry(this.width, this.height, this.depth);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }

    Cube.prototype = Object.create(Primitive.prototype);
    Cube.prototype.updateGeometry = function () {
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

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices = this.makeRVectors(startPos, endPos);
        this.lineMaterial = new THREE.LineBasicMaterial({ color : this.color, linewidth : this.thickness, opacity : this.opacity, transparent:true });
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);

        this.add(this.line);
    }

    Line.prototype = Object.create(Primitive.prototype);
    Line.prototype.updateGeometry = function () {
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

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices = this.makeRVectors(startPos, endPos);
        this.lineGeometry.computeLineDistances();
        this.lineMaterial = new THREE.LineDashedMaterial({color : this.color, opacity : this.opacity, linewidth : this.thickness, dashSize : this.dashSize, gapSize : this.gapSize, transparent : true});
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
        this.add(this.line);
    }

    DashedLine.prototype = Object.create(Primitive.prototype);
    DashedLine.prototype.updateGeometry = function () {
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
        var coneMat = new THREE.MeshLambertMaterial({ color : this.color, opacity : this.opacity, transparent : true});
        this.cone = new THREE.Mesh(coneGeometry, coneMat);

        this.add(this.cone);
    }

    Cone.prototype = Object.create(Primitive.prototype);
    Cone.prototype.setDirection = function (dir) {
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

        this.fromPosition = this.makeRVector(configObj.from);
        this.toPosition = this.makeRVector(configObj.to);

        //this.arrowLineDirection = this.toPosition.clone().sub(this.fromPosition).normalize();

        this.arrowLineOpacity = configObj.lineOpacity || 1;
        this.arrowLineThickness = configObj.lineThickness || 1;
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
        this.arrowLineDirection = this.toPosition.clone().sub(this.fromPosition).normalize();
        if(this.toCone) this.setDirection(this.arrowLineDirection, this.toCone);
        if(this.fromCone) this.setDirection(this.arrowLineDirection.clone().negate(), this.fromCone);
    };
    DataDoo.Arrow = Arrow;

    /**
     *  AxesHelper primitive
     */
    function AxesHelper(xObj, yObj, zObj) {
        /*
         type: DataDoo.COLUMNVALUE,
         column : "ds1.one",

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
         */

        Primitive.call(this);
        this.xObj = xObj || {};
        this.yObj = yObj || {};
        this.zObj = zObj || {};

        var i, j, notch, notchShape;
        this.notchGeom = new THREE.SphereGeometry(0.9);
        this.notchMat = new THREE.MeshBasicMaterial({color:"0x000000", opacity:0.4});

        this.xAxis = new DataDoo.Arrow({
            from : this.xObj.origin,
            to : new THREE.Vector3(this.xObj.length, this.xObj.origin.y, this.xObj.origin.z),
            fromCone : false,
            toCone : this.xObj.withCone,
            lineColor : this.xObj.lineColor,
            toConeColor : this.xObj.coneColor,
            lineThickness : this.xObj.thickness
        });
        this.xlabel = new DataDoo.Label(this.xObj.label, new THREE.Vector3(this.xObj.length, this.xObj.origin.y, this.xObj.origin.z));
        this.xAxis.add(this.xlabel);

        if (this.xObj.notches) {
            if (this.xObj.type === 6) {
                for (i = 0, j = this.xObj.length / this.xObj.notchSpacing; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.xObj.origin.x + (this.xObj.notchSpacing * i), this.xObj.origin.y, this.xObj.origin.z);
                    notch = new DataDoo.Label(this.xObj.notchStartingFrom + i, new THREE.Vector3(this.xObj.origin.x + (this.xObj.notchSpacing * i), this.xObj.origin.y, this.xObj.origin.z));
                    this.xAxis.add(notchShape);
                    this.xAxis.add(notch);
                }
            }
        }

        this.add(this.xAxis);

        this.yAxis = new DataDoo.Arrow({
            from : this.yObj.origin,
            to : new THREE.Vector3(this.yObj.origin.x, this.yObj.length, this.yObj.origin.z),
            fromCone : false,
            toCone : this.yObj.withCone,
            lineColor : this.yObj.lineColor,
            toConeColor : this.yObj.coneColor,
            lineThickness : this.yObj.thickness
        });
        this.ylabel = new DataDoo.Label(this.yObj.label, new THREE.Vector3(this.yObj.origin.x, this.yObj.length, this.yObj.origin.z));
        this.yAxis.add(this.ylabel);
        if (this.yObj.notches) {
            if (this.yObj.type === 6) {
                for (i = 0, j = this.yObj.length / this.yObj.notchSpacing; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.yObj.origin.x, this.yObj.origin.y + (this.yObj.notchSpacing * i), this.yObj.origin.z);
                    notch = new DataDoo.Label(this.yObj.notchStartingFrom + i, new THREE.Vector3(this.yObj.origin.x, this.yObj.origin.y + (this.yObj.notchSpacing * i), this.yObj.origin.z));
                    this.yAxis.add(notchShape);
                    this.yAxis.add(notch);
                }
            }
        }
        this.add(this.yAxis);

        this.zAxis = new DataDoo.Arrow({
            from : this.zObj.origin,
            to : new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.length),
            fromCone : false,
            toCone : this.zObj.withCone,
            lineColor : this.zObj.lineColor,
            toConeColor : this.zObj.coneColor,
            lineThickness : this.zObj.thickness
        });
        this.zlabel = new DataDoo.Label(this.zObj.label, new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.length));
        this.zAxis.add(this.zlabel);
        if (this.zObj.notches) {
            if (this.zObj.type === 6) {
                for (i = 0, j = this.zObj.length / this.zObj.notchSpacing; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + (this.zObj.notchSpacing * i));
                    notch = new DataDoo.Label(this.zObj.notchStartingFrom + i, new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + (this.zObj.notchSpacing * i)));
                    this.zAxis.add(notchShape);
                    this.zAxis.add(notch);
                }
            }
        }
        this.add(this.zAxis);
    }

    AxesHelper.prototype = Object.create(Primitive.prototype);
    AxesHelper.prototype.updateGeometry = function () {

        if (this.xObj.notches) {
            if (this.xObj.type === 5) {
                for (i = 0, j = this.xObj.values.length; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.xObj.origin.x + this.xObj.posMap[this.xObj.values[i]], this.xObj.origin.y, this.xObj.origin.z);
                    notch = new DataDoo.Label(this.xObj.values[i], new THREE.Vector3(this.xObj.origin.x + this.xObj.posMap[this.xObj.values[i]], this.xObj.origin.y, this.xObj.origin.z));
                    this.xAxis.add(notchShape);
                    this.xAxis.add(notch);
                }
            }
        }

        if (this.yObj.notches) {
            if (this.yObj.type === 5) {
                for (i = 0, j = this.yObj.values.length; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.yObj.origin.x, this.yObj.origin.y + this.yObj.posMap[this.yObj.values[i]], this.yObj.origin.z);
                    notch = new DataDoo.Label(this.yObj.values[i], new THREE.Vector3(this.yObj.origin.x, this.yObj.origin.y + this.yObj.posMap[this.yObj.values[i]], this.yObj.origin.z));
                    this.yAxis.add(notchShape);
                    this.yAxis.add(notch);
                }
            }
        }

        if (this.zObj.notches) {
            if (this.zObj.type === 5) {
                for (i = 0, j = this.zObj.values.length; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + this.zObj.posMap[this.zObj.values[i]]);
                    notch = new DataDoo.Label(this.zObj.values[i], new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + this.zObj.posMap[this.zObj.values[i]]));
                    this.zAxis.add(notchShape);
                    this.zAxis.add(notch);
                }
            }
        }
    };
    DataDoo.AxesHelper = AxesHelper;

    /**
     *  Spline primitive
     */
    function Spline(points, color, subdivisions) {
        Primitive.call(this);
        this.points = this.makeRVectors(points);
        this.color = color || "0xfc12340";
        this.subdivisions = subdivisions || 6;
        this.spline = new THREE.Spline(this.points);
        this.geometrySpline = new THREE.Geometry();
        this.mesh = new THREE.Line(this.geometrySpline, new THREE.LineDashedMaterial({ color : this.color, dashSize : 4, gapSize : 2, linewidth : 3 , transparent:true}), THREE.LineStrip);
        this.add(this.mesh);
    }

    Spline.prototype = Object.create(Primitive.prototype);
    Spline.prototype.updateGeometry = function(){
        var points = this.points;
        for (var i = 0; i < points.length * this.subdivisions; i++) {
            var index = i / ( points.length * this.subdivisions );
            var position = this.spline.getPoint(index);
            this.geometrySpline.vertices[ i ] = new THREE.Vector3(position.x, position.y, position.z);
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

        this.message = (message).toString() || "empty label";
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
    DataDoo.PrimitiveHelpers = _.chain(DataDoo).pairs().filter(function (pair) {
        // filter out Primitive constructor classes from DataDoo
        return _.isFunction(pair[1]) && ("setDirection" in pair[1].prototype) && (pair[0] != "Primitive");
    }).map(function(pair) {
        var className = pair[0];
        var primClass = pair[1];
        return ["add" + className, function() {
            var args = arguments;
            var F = function() {
                return primClass.apply(this, args);
            };
            F.prototype = primClass.prototype;
            var primitive = new F();
            primitive.constructor = primClass;
            this.add(primitive);
            return primitive;
        }];
    }).object().value();

})(window.DataDoo);
