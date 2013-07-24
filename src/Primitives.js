(function(DataDoo) {
    /**
     *  Primitive base class
     */
    function Primitive() {
        this.objects = [];
    }
    Primitive.prototype.getPositions = function() {
        return [];
    };
    Primitive.prototype.onResolve = function() {
        throw new Error("Primitive : onResolve not implemented");
    };

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
    DataDoo.Primitive = Primitive;

    /**
     *  Sphere primitive
     */
    function Sphere(radius, color, center) {
        this.radius = radius || 10;
        this.color = color || 0x8888ff;
        this.center = center || new DataDoo.Position(0,0,0);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius,20,20);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.objects = [this.mesh];
    }
    Sphere.prototype = Object.create(Primitive.prototype);
    /**
     * Sets the radius of the sphere
     */
    Sphere.prototype.setRadius = function(radius) {
        this.radius = radius;
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh.setGeometry(this.geometry);
    };
    Sphere.prototype.getPositions = function() {
        return [this.center];
    };
    Sphere.prototype.onResolve = function() {
        this.center.applyToVector(this.mesh.position);
    };
    DataDoo.Sphere = Sphere;

    /**
     *  Line primitive
     */
    function Line(startPos, endPos, lineLength, dir, color, thickness, opacity) {
        THREE.Object3D.call(this);

        this.thickness = thickness || 1;
        this.opacity = opacity || 1;
        this.color = color || 0xcccccc;
        this.startPos = startPos || new DataDoo.Position(0,0,0);
        this.direction = dir || new THREE.Vector3(1,0,0);
        this.lineLength = lineLength || 50;
        this.direction.normalize();

        if(endPos){
            this.endPos = endPos;
        }
        else{
            var endPosX = this.startPos.x + (this.lineLength*this.direction.x);
            var endPosY = this.startPos.y + (this.lineLength*this.direction.y);
            var endPosZ = this.startPos.z + (this.lineLength*this.direction.z);

            this.endPos = new DataDoo.Position(endPosX, endPosY, endPosZ);
        }

        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
        this.lineMaterial = new THREE.LineBasicMaterial( { color: this.color, linewidth: this.thickness, opacity: this.opacity } );
        this.line = new THREE.Line( this.lineGeometry, this.lineMaterial );

        this.objects = [this.line];
    }
    Line.prototype = Object.create(Primitive.prototype);
    Line.prototype.getPositions = function() {
        return [this.startPos, this.endPos];
    };
    Line.prototype.onResolve = function() {
        this.startPos.applyToVector(this.lineGeometry.vertices[0]);
        this.endPos.applyToVector(this.lineGeometry.vertices[1]);
        this.lineGeometry.computeLineDistances();
    };
    DataDoo.Line = Line;


    /**
     *  Cone primitive
     */
    function Cone(height, topRadius, baseRadius, position, dir, color, opacity) {
        THREE.Object3D.call(this);

        this.position = position || new DataDoo.Position(0,0,0);
        this.height = height || 5;
        this.topRadius = topRadius || 0;
        this.baseRadius = baseRadius || 5;
        this.opacity = opacity || 1;
        this.color = color || 0xcccccc;
        this.direction = dir || new THREE.Vector3(0,1,0);


        var coneGeometry = new THREE.CylinderGeometry(this.topRadius, this.baseRadius, this.height, 10, 10);
        var coneMat = new THREE.MeshLambertMaterial({ color : this.color, opacity : this.opacity  });
        this.cone = new THREE.Mesh(coneGeometry, coneMat);
        this.setDirection(this.direction, this.cone);

        this.objects = [this.cone];
    }
    Cone.prototype = Object.create(Primitive.prototype);
    Cone.prototype.getPositions = function() {
        return [this.position];
    };
    Cone.prototype.onResolve = function() {
        this.position.applyToVector(this.cone.position);
    };
    DataDoo.Cone = Cone;

    /**
     *  Arrow primitive
     */
    function Arrow(configObj) {
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

        THREE.Object3D.call(this);
        this.type = configObj.type;

        this.fromPosition = configObj.from || new DataDoo.Position(0,0,0);


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

        if(configObj.to){
            this.toPosition = configObj.to;
        }
        else{
            var toPosX = this.fromPosition.x + (this.arrowLineLength*this.arrowLineDirection.x);
            var toPosY = this.fromPosition.y + (this.arrowLineLength*this.arrowLineDirection.y);
            var toPosZ = this.fromPosition.z + (this.arrowLineLength*this.arrowLineDirection.z);

            this.toPosition = new DataDoo.Position(toPosX, toPosY, toPosZ);
        }
        this.arrow = new THREE.Object3D();

        this.line = new DataDoo.Line(this.fromPosition, this.toPosition, this.arrowLineLength, this.arrowLineDirection, this.arrowLineColor, this.arrowLineThickness, this.arrowLineOpacity);
        this.arrow.add(this.line);

        if(this.fromCone){
            this.fromCone = new DataDoo.Cone(this.fromConeHeight, this.fromConeTopRadius, this.fromConeBaseRadius, this.fromPosition, this.arrowLineDirection.clone().negate(), this.fromConeColor, this.fromConeOpacity);
            this.arrow.add(this.fromCone);
        }

        if(this.toCone){
            this.toCone = new DataDoo.Cone(this.toConeHeight, this.toConeTopRadius, this.toConeBaseRadius, this.toPosition, this.arrowLineDirection, this.toConeColor, this.toConeOpacity);
            this.arrow.add(this.toCone);
        }

        this.objects = [this.arrow];

    }
    Arrow.prototype = Object.create(Primitive.prototype);
    Arrow.prototype.getPositions = function() {
        return [this.fromPosition, this.toPosition];
    };
    Arrow.prototype.onResolve = function() {
        //ToDo : Fix this area!!

        /*this.fromPosition.applyToVector(this.line.geometry.vertices[0]);
        this.toPosition.applyToVector(this.line.geometry.vertices[1]);*/
        this.line.onResolve();
        if(this.fromCone){
            this.fromPosition.applyToVector(this.fromCone.position);
        }
        if(this.toCone){
            this.toPosition.applyToVector(this.toCone.position);
        }
    };
    DataDoo.Arrow = Arrow;

    /**
     *  DashedLine primitive
     */
    function DashedLine(startPos, endPos, color, dashSize, gapSize, radius) {
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0x8888ff;
        this.radius = radius || 3;
        this.startPos = startPos;
        this.endPos = endPos;

        this.sphereMaterial = new THREE.MeshLambertMaterial({color: this.color});
        this.sphereGeometry = new THREE.SphereGeometry(this.radius);
        this.sphere1 = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
        this.sphere2 = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);


        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
        this.lineMaterial = new THREE.LineDashedMaterial( { color: this.color, dashSize: this.dashSize, gapSize: this.gapSize } );
        this.line = new THREE.Line( this.lineGeometry, this.lineMaterial );

        this.objects = [this.sphere1, this.sphere2, this.line];
    }
    DashedLine.prototype = Object.create(Primitive.prototype);
    DashedLine.prototype.getPositions = function() {
        return [this.startPos, this.endPos];
    };
    DashedLine.prototype.onResolve = function() {
        this.startPos.applyToVector(this.lineGeometry.vertices[0]);
        this.endPos.applyToVector(this.lineGeometry.vertices[1]);
        this.lineGeometry.computeLineDistances();

        this.startPos.applyToVector(this.sphere1.position);
        this.endPos.applyToVector(this.sphere2.position);
    };
    DataDoo.DashedLine = DashedLine;

    /**
     *  Spline primitive
     */
    function Spline(points, color, subdivisions){
        this.points = points;
        this.color = color || 0xfc12340;
        this.subdivisions = subdivisions || 6;
        this.spline = new THREE.Spline( points );
        this.geometrySpline = new THREE.Geometry();
        this.position = new DataDoo.Position(0,0,0);

        for ( var i = 0; i < this.points.length * this.subdivisions; i ++ ) {
            var index = i / ( this.points.length * this.subdivisions );
            var position = this.spline.getPoint( index );
            this.geometrySpline.vertices[ i ] = new THREE.Vector3( position.x, position.y, position.z );
        }
        this.geometrySpline.computeLineDistances();

        this.mesh = new THREE.Line( this.geometrySpline, new THREE.LineDashedMaterial( { color: this.color, dashSize: 4, gapSize: 2, linewidth : 3 } ), THREE.LineStrip );
        this.objects = [this.mesh];
    }
    Spline.prototype = Object.create(Primitive.prototype);
    Spline.prototype.getPositions = function() {
        return [this.position];
    };
    Spline.prototype.onResolve = function() {
        this.position.applyToVector(this.mesh.position);
    };
    DataDoo.Spline = Spline;

    /**
     *  Sprite primitive
     */
    function Sprite(url, datadooPosition, scale){
        this.map = THREE.ImageUtils.loadTexture(url);
        this.scale = scale;
        this.material = new THREE.SpriteMaterial( { map: this.map, useScreenCoordinates: false, color: 0xffffff, fog: true } );
        this.position = datadooPosition || new DataDoo.Position(0,0,0);
        this.sprite = new THREE.Sprite( this.material );
        this.sprite.scale.x = this.sprite.scale.y = this.sprite.scale.z = this.scale;
        this.objects = [this.sprite];
    }
    Sprite.prototype = Object.create(Primitive.prototype);
    Sprite.prototype.getPositions = function() {
        return [this.position];
    };
    Sprite.prototype.onResolve = function() {
        this.position.applyToVector(this.sprite.position);
        //this.sprite.position.multiplyScalar(this.radius);
    };
    DataDoo.Sprite = Sprite;


    /**
     *  Label primitive
     */
    function Label(message, position, offset){
        THREE.Object3D.call(this);

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

        this.message = message;
        this.position = position;
        this.element = element;
        this.distanceX = offset.x || 10;
        this.distanceY = offset.y || 10;
        this.width = 0;
        this.height = 0;
        this.visible = true;
        this.content = this.message;

        element.style.position = 'absolute';
        element.style.left = 0;
        element.style.top = 0;
        //element.style.opacity = 0;
        inner.appendChild(document.createTextNode(this.message));

        this.objects = [this.element];
        document.body.appendChild(element);
    }
    Label.prototype = Object.create(Primitive.prototype);
    Label.prototype.getPositions = function() {
        return [this.position];
    };
    Label.prototype.onResolve = function() {};
    Label.prototype.updateElemPos = function(top, left) {
        this.element.style.top = top + this.distanceY + "px";
        this.element.style.left = left + this.distanceX + "px";
    };
    DataDoo.Label = Label;

})(window.DataDoo);
