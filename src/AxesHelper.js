(function (DataDoo) {

    /*
     This is just a wrapper around THREE.js stuff.
     Did not want to make changes in threejs files because then they would be bound to the DataDoo repo.
     */

    function AxisHelper(configObj) {
        /*dir, origin, length, axisLineColor, axisLabel, axisLabelColor*/
        console.dir(configObj);
        THREE.Object3D.call(this);
        this.type = configObj.type;
        this.axisWithCone = configObj.axisWithCone || false;
        this.axisDir = configObj.axisDir || new THREE.Vector3(1, 0, 0);
        this.origin = configObj.origin || new THREE.Vector3(0, 0, 0);
        this.axisLength = configObj.axisLength || 50;
        this.axisDivisions = configObj.axisDivisions || 10;
        this.axisLabelStartingFrom  = configObj.axisLabelStartingFrom || 0;

        this.axisLineColor = configObj.axisLineColor || 0xffff00;
        this.axisLabel = configObj.axisLabel || "empty label";
        this.axisLabelColor = configObj.axisLabelColor || 0xffff00;

        this.axisDir.normalize();

        this.position = this.origin;

        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lineGeometry.vertices.push(new THREE.Vector3(0, this.axisLength, 0));

        this.line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color : this.axisLineColor, opacity : 0.5, linewidth : 2  }));
        this.line.matrixAutoUpdate = false;
        this.add(this.line);

        var coneGeometry = new THREE.CylinderGeometry(0, 5, 10, 10, 10);
        //coneGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0.875, 0));

        this.cone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color : this.axisLineColor, opacity : 0.5, linewidth : 2  }));
        this.cone.position.set(0, this.axisLength , 0);
        //this.cone.matrixAutoUpdate = false;
        this.add(this.cone);
        this.cone.visible = this.axisWithCone;

        this.labelSprite = DataDoo.utils.makeTextSprite(this.axisLabel || "X Axis", {textColor : this.axisLabelColor});
        this.add(this.labelSprite);
        this.labelSprite.position.set(-0.1, this.axisLength, 0);



        if(this.type === DataDoo.NUMBER){
            var num = parseInt(this.axisLength/this.axisDivisions, 10);
            console.log("this.axisLength :", this.axisLength);
            console.log("this.axisDivisions :", this.axisDivisions);
            var ptGeom = new THREE.SphereGeometry(0.01 * 100);
            var ptMat = new THREE.MeshBasicMaterial({color:0x000000});
            var labelNum = this.axisLabelStartingFrom;
            var params = {
                fontSize : 0.1 * 100,
                textColor : 0x000000
            };

            for(var x = 0; x < num; x++){
                var pt = new THREE.Mesh(ptGeom, ptMat);
                var label = DataDoo.utils.makeTextSprite(labelNum + x, params);
                pt.add(label);
                this.line.add(pt);
                pt.position.set(0, (x/num)*(this.axisLength), 0);
            }

        }

        this.setDirection(this.axisDir);
//        this.setLength(this.axisLength);

    }

    AxisHelper.prototype = Object.create(THREE.Object3D.prototype);

    AxisHelper.prototype.setDirection = function () {
        var axis = new THREE.Vector3();
        var radians;

        return function (dir) {
            // dir is assumed to be normalized
            if (dir.y > 0.99999) {
                this.quaternion.set(0, 0, 0, 1);
            }
            else if (dir.y < -0.99999) {
                this.quaternion.set(1, 0, 0, 0);
            }
            else {
                axis.set(dir.z, 0, -dir.x).normalize();
                radians = Math.acos(dir.y);
                this.quaternion.setFromAxisAngle(axis, radians);
            }
        };
    }();

    AxisHelper.prototype.setLength = function (length) {
        this.scale.set(length, length, length);
    };

    AxisHelper.prototype.setColor = function (hex) {
        this.line.material.color.setHex(hex);
        this.cone.material.color.setHex(hex);
    };

    function AxesHelper(xObj, yObj, zObj) {
        THREE.Object3D.call(this);

        this.xObj = xObj || {};
        this.yObj = yObj || {};
        this.zObj = zObj || {};

        this.xAxis = new DataDoo.AxisHelper(this.xObj);
        this.add(this.xAxis);

        this.yAxis = new DataDoo.AxisHelper(this.yObj);
        this.add(this.yAxis);

        this.zAxis = new DataDoo.AxisHelper(this.zObj);
        this.add(this.zAxis);
    }

    AxesHelper.prototype = Object.create(THREE.Object3D.prototype);

    DataDoo.AxisHelper = AxisHelper;
    DataDoo.AxesHelper = AxesHelper;
})(window.DataDoo);