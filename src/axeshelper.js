(function (DataDoo) {

    /**
     * @author WestLangley / http://github.com/WestLangley
     * @author zz85 / http://github.com/zz85
     * @author bhouston / http://exocortex.com
     *
     * Creates an arrow for visualizing directions
     *
     * Parameters:
     *  dir - Vector3
     *  origin - Vector3
     *  length - Number
     *  hex - color in hex value
     */

    function ArrowHelper( dir, origin, length, axisLineColor, axisLabel, axisLabelColor ) {

        // dir is assumed to be normalized

        THREE.Object3D.call( this );

        if ( dir === undefined ) dir = new THREE.Vector3(1,0,0);
        if ( origin === undefined ) origin = new THREE.Vector3(0,0,0);
        if ( length === undefined ) length = 1;
        if ( axisLineColor === undefined ) axisLineColor = 0xffff00;
        if ( axisLabel === undefined ) axisLabel = "empty label";
        if ( axisLabelColor === undefined ) axisLabelColor = 0xffff00;

        dir.normalize();

        this.position = origin;

        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        lineGeometry.vertices.push( new THREE.Vector3( 0, 1, 0 ) );

        this.line = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial( { color: axisLineColor, opacity : 0.5, linewidth : 2  } ) );
        this.line.matrixAutoUpdate = false;
        this.add( this.line );

        var coneGeometry = new THREE.CylinderGeometry( 0, 0.05, 0.15, 10, 10 );
        coneGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.875, 0 ) );

        this.cone = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: axisLineColor, opacity : 0.5, linewidth : 2  } ) );
        this.cone.matrixAutoUpdate = false;
        this.add( this.cone );

        this.labelSprite = this.makeTextSprite(axisLabel || "X Axis", {textColor:axisLabelColor});
        this.add(this.labelSprite);
        //this.labelSprite.setDirection(dir);
        this.labelSprite.position.set(-0.1,1,0);

        this.setDirection( dir );

        this.setLength( length );
    }

    ArrowHelper.prototype = Object.create( THREE.Object3D.prototype );

    ArrowHelper.prototype.setDirection = function () {
        var axis = new THREE.Vector3();
        var radians;

        return function ( dir ) {
            // dir is assumed to be normalized
            if ( dir.y > 0.99999 ) {
                this.quaternion.set( 0, 0, 0, 1 );
            }
            else if ( dir.y < - 0.99999 ) {
                this.quaternion.set( 1, 0, 0, 0 );
            }
            else {
                axis.set( dir.z, 0, - dir.x ).normalize();
                radians = Math.acos( dir.y );
                this.quaternion.setFromAxisAngle( axis, radians );
            }
        };
    }();

    ArrowHelper.prototype.setLength = function ( length ) {
        this.scale.set( length, length, length );
    };

    ArrowHelper.prototype.setColor = function ( hex ) {
        this.line.material.color.setHex( hex );
        this.cone.material.color.setHex( hex );
    };

    ArrowHelper.prototype.makeTextSprite = function(message, parameters) {
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

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;

        // background color
        context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;
        //this.roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        var tColor = new THREE.Color(textColor);

        context.fillStyle = "rgba(" + tColor.r*255 + "," + tColor.g*255 + "," + tColor.b*255 + "," + " 1.0)";
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
    };

    ArrowHelper.prototype.roundRect = function(ctx, x, y, w, h, r) {
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
    };


    function AxesHelper(xObj, yObj, zObj) {
        THREE.Object3D.call( this );

        this.xObj = xObj || {};
        this.yObj = yObj || {};
        this.zObj = zObj || {};

        this.xAxis = new DataDoo.ArrowHelper(this.xObj.dir || new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), this.xObj.length || 50, this.xObj.axisLineColor || 0xfc12340, this.xObj.axisLabel || "x axis", this.xObj.axisLabelColor || 0xfc12340 );
        this.add(this.xAxis);

        this.yAxis = new DataDoo.ArrowHelper(this.yObj.dir || new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), this.yObj.length || 50, this.yObj.axisLineColor || 0xfc12340, this.yObj.axisLabel || "y axis", this.yObj.axisLabelColor || 0xfc12340 );
        this.add(this.yAxis);

        this.zAxis = new DataDoo.ArrowHelper(this.zObj.dir || new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0), this.zObj.length || 50, this.zObj.axisLineColor || 0xfc12340, this.zObj.axisLabel || "z axis", this.zObj.axisLabelColor || 0xfc12340 );
        this.add(this.zAxis);
    }

    AxesHelper.prototype = Object.create( THREE.Object3D.prototype );


    DataDoo.ArrowHelper = ArrowHelper;
    DataDoo.AxesHelper = AxesHelper;
})(window.DataDoo);