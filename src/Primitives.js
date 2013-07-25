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

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe});
        this.geometry = new THREE.SphereGeometry(this.radius, 20, 20);
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
     *  Line primitive
     */
    function Line(startPos, endPos, lineLength, dir, color, thickness, opacity) {
        Primitive.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0xffaa00;
        this.startPos = startPos || new THREE.Vector3(0, 0, 0);
        this.direction = dir || new THREE.Vector3(1, 0, 0);
        this.lineLength = lineLength || 50;
        this.direction.normalize();

        if (endPos) {
            this.endPos = endPos;
        }
        else {
            var endPosX = this.startPos.x + (this.lineLength * this.direction.x);
            var endPosY = this.startPos.y + (this.lineLength * this.direction.y);
            var endPosZ = this.startPos.z + (this.lineLength * this.direction.z);

            this.endPos = new DataDoo.Position(endPosX, endPosY, endPosZ);
        }

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(startPos, endPos);
        this.lineMaterial = new THREE.LineBasicMaterial({ color : this.color, linewidth : this.thickness, opacity : this.opacity });
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);

        this.add(this.line);
    }
    Line.prototype = Object.create(Primitive.prototype);
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
        //ToDo : rename or abstract "vectorOrAnchor" function to make it easier for developers.
        this.startPos = this.vectorOrAnchor(startPos);
        this.endPos = this.vectorOrAnchor(endPos);

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(startPos, endPos);
        this.lineMaterial = new THREE.LineDashedMaterial({color : this.color, opacity:this.opacity, linewidth:this.thickness, dashSize:this.dashSize, gapSize:this.gapSize});
        this.line = new THREE.Line(this.lineGeometry, this.lineMaterial);
        this.add(this.line);
    }
    DashedLine.prototype = Object.create(Primitive.prototype);
    DataDoo.DashedLine = DashedLine;

    /**
     *  Cone primitive
     */
    function Cone(height, topRadius, baseRadius, position, dir, color, opacity) {
        Primitive.call(this);

        this.position = position || new DataDoo.Position(0, 0, 0);
        this.height = height || 5;
        this.topRadius = topRadius || 0;
        this.baseRadius = baseRadius || 5;
        this.opacity = opacity || 1;
        this.color = color || 0xcccccc;
        this.direction = dir || new THREE.Vector3(0, 1, 0);

        var coneGeometry = new THREE.CylinderGeometry(this.topRadius, this.baseRadius, this.height, 10, 10);
        var coneMat = new THREE.MeshLambertMaterial({ color : this.color, opacity : this.opacity  });
        this.cone = new THREE.Mesh(coneGeometry, coneMat);
        this.setDirection(this.direction, this.cone);

        this.add(this.cone);
    }
    Cone.prototype = Object.create(Primitive.prototype);
    DataDoo.Cone = Cone;

    /**
     *  Arrow primitive
     */
    function Arrow(configObj) {
        Primitive.call(this);
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

        this.type = configObj.type;

        this.fromPosition = configObj.from || new DataDoo.Position(0, 0, 0);

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

        if (configObj.to) {
            this.toPosition = configObj.to;
        }
        else {
            var toPosX = this.fromPosition.x + (this.arrowLineLength * this.arrowLineDirection.x);
            var toPosY = this.fromPosition.y + (this.arrowLineLength * this.arrowLineDirection.y);
            var toPosZ = this.fromPosition.z + (this.arrowLineLength * this.arrowLineDirection.z);

            this.toPosition = new DataDoo.Position(toPosX, toPosY, toPosZ);
        }

        this.line = new DataDoo.Line(this.fromPosition, this.toPosition, this.arrowLineLength, this.arrowLineDirection, this.arrowLineColor, this.arrowLineThickness, this.arrowLineOpacity);
        this.add(this.line);

        if (this.fromCone) {
            this.fromCone = new DataDoo.Cone(this.fromConeHeight, this.fromConeTopRadius, this.fromConeBaseRadius, this.fromPosition, this.arrowLineDirection.clone().negate(), this.fromConeColor, this.fromConeOpacity);
            this.add(this.fromCone);
        }

        if (this.toCone) {
            this.toCone = new DataDoo.Cone(this.toConeHeight, this.toConeTopRadius, this.toConeBaseRadius, this.toPosition, this.arrowLineDirection, this.toConeColor, this.toConeOpacity);
            this.add(this.toCone);
        }
    }

    Arrow.prototype = Object.create(Primitive.prototype);
    DataDoo.Arrow = Arrow;


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

        for (var i = 0; i < this.points.length * this.subdivisions; i++) {
            var index = i / ( this.points.length * this.subdivisions );
            var position = this.spline.getPoint(index);
            this.geometrySpline.vertices[ i ] = new THREE.Vector3(position.x, position.y, position.z);
        }
        this.geometrySpline.computeLineDistances();

        this.mesh = new THREE.Line(this.geometrySpline, new THREE.LineDashedMaterial({ color : this.color, dashSize : 4, gapSize : 2, linewidth : 3 }), THREE.LineStrip);
        this.add(this.mesh);
    }

    Spline.prototype = Object.create(Primitive.prototype);
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
        inner.style.left = '-50%';
        inner.style.top = '-.5em';

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

        labelPos = labelPos || new DataDoo.RVector3(0,0,0);
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
