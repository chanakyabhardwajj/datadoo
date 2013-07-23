(function (DataDoo) {

    /*
     This is just a wrapper around THREE.js stuff.
     Did not want to make changes in threejs files because then they would be bound to the DataDoo repo.
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

        this.labelSprite = DataDoo.utils.makeTextSprite(axisLabel || "X Axis", {textColor:axisLabelColor});
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