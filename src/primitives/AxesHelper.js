(function(DataDoo) {
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

        DataDoo.Primitive.call(this);
        this.xObj = xObj || {};
        this.yObj = yObj || {};
        this.zObj = zObj || {};

        var i, j, notchLabel, notchShape, elem;
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
        this.xlabel = new DataDoo.Label(this.xObj.label, new THREE.Vector3(this.xObj.length+ 2, this.xObj.origin.y, this.xObj.origin.z));
        this.xAxis.add(this.xlabel);

        if (this.xObj.notches) {
            this.xObj.notchShapesArray = [];
            this.xObj.notchLabelsArray = [];
            if (this.xObj.type === 6) {
                for (i = 0, j = this.xObj.length / this.xObj.notchSpacing; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.xObj.origin.x + (this.xObj.notchSpacing * i), this.xObj.origin.y, this.xObj.origin.z);
                    notchLabel = new DataDoo.Label(this.xObj.notchStartingFrom + i, new THREE.Vector3(this.xObj.origin.x + (this.xObj.notchSpacing * i), this.xObj.origin.y, this.xObj.origin.z));
                    this.xAxis.add(notchShape);
                    this.xObj.notchShapesArray.push(notchShape);
                    this.xAxis.add(notchLabel);
                    this.xObj.notchLabelsArray.push(notchLabel);
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
        this.ylabel = new DataDoo.Label(this.yObj.label, new THREE.Vector3(this.yObj.origin.x, this.yObj.length+ 2, this.yObj.origin.z));
        this.yAxis.add(this.ylabel);
        if (this.yObj.notches) {
            this.yObj.notchShapesArray = [];
            this.yObj.notchLabelsArray = [];
            if (this.yObj.type === 6) {
                for (i = 0, j = this.yObj.length / this.yObj.notchSpacing; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.yObj.origin.x, this.yObj.origin.y + (this.yObj.notchSpacing * i), this.yObj.origin.z);
                    notchLabel = new DataDoo.Label(this.yObj.notchStartingFrom + i, new THREE.Vector3(this.yObj.origin.x, this.yObj.origin.y + (this.yObj.notchSpacing * i), this.yObj.origin.z));
                    this.yAxis.add(notchShape);
                    this.yObj.notchShapesArray.push(notchShape);
                    this.yAxis.add(notchLabel);
                    this.yObj.notchLabelsArray.push(notchLabel);
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
        this.zlabel = new DataDoo.Label(this.zObj.label, new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.length+ 2));
        this.zAxis.add(this.zlabel);
        if (this.zObj.notches) {
            this.zObj.notchShapesArray = [];
            this.zObj.notchLabelsArray = [];
            if (this.zObj.type === 6) {
                for (i = 0, j = this.zObj.length / this.zObj.notchSpacing; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + (this.zObj.notchSpacing * i));
                    notchLabel = new DataDoo.Label(this.zObj.notchStartingFrom + i, new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + (this.zObj.notchSpacing * i)));
                    this.zAxis.add(notchShape);
                    this.zObj.notchShapesArray.push(notchShape);
                    this.zAxis.add(notchLabel);
                    this.zObj.notchLabelsArray.push(notchLabel);
                }
            }
        }
        this.add(this.zAxis);
    }

    AxesHelper.prototype = Object.create(DataDoo.Primitive.prototype);

    DataDoo.AxesHelper = AxesHelper;

    AxesHelper.prototype.updateGeometry = function () {
        var i, j, notchLabel, notchShape;
        if (this.xObj.notches) {
            if (this.xObj.type === 5) {

                for(i=0, j=this.xObj.notchShapesArray.length; i<j; i++){
                    this.xAxis.remove(this.xObj.notchShapesArray[i]);
                }
                this.xObj.notchShapesArray = [];

                for(i=0, j=this.xObj.notchLabelsArray.length; i<j; i++){
                    this.xAxis.remove(this.xObj.notchLabelsArray[i]);
                    elem = this.xObj.notchLabelsArray[i].element;
                    elem.parentNode.removeChild(elem);
                }
                this.xObj.notchLabelsArray = [];

                for (i = 0, j = this.xObj.values.length; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.xObj.origin.x + this.xObj.posMap[this.xObj.values[i]], this.xObj.origin.y, this.xObj.origin.z);
                    notchLabel = new DataDoo.Label(this.xObj.values[i], new THREE.Vector3(this.xObj.origin.x + this.xObj.posMap[this.xObj.values[i]], this.xObj.origin.y, this.xObj.origin.z));
                    this.xAxis.add(notchShape);
                    this.xObj.notchShapesArray.push(notchShape);
                    this.xAxis.add(notchLabel);
                    this.xObj.notchLabelsArray.push(notchLabel);
                }
            }
        }

        if (this.yObj.notches) {
            if (this.yObj.type === 5) {
                for(i=0, j=this.yObj.notchShapesArray.length; i<j; i++){
                    this.yAxis.remove(this.yObj.notchShapesArray[i]);
                }
                this.yObj.notchShapesArray = [];

                for(i=0, j=this.yObj.notchLabelsArray.length; i<j; i++){
                    this.yAxis.remove(this.yObj.notchLabelsArray[i]);
                    elem = this.yObj.notchLabelsArray[i].element;
                    elem.parentNode.removeChild(elem);
                }
                this.yObj.notchLabelsArray = [];
                for (i = 0, j = this.yObj.values.length; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.yObj.origin.x, this.yObj.origin.y + this.yObj.posMap[this.yObj.values[i]], this.yObj.origin.z);
                    notchLabel = new DataDoo.Label(this.yObj.values[i], new THREE.Vector3(this.yObj.origin.x, this.yObj.origin.y + this.yObj.posMap[this.yObj.values[i]], this.yObj.origin.z));
                    this.yAxis.add(notchShape);
                    this.yObj.notchShapesArray.push(notchShape);
                    this.yAxis.add(notchLabel);
                    this.yObj.notchLabelsArray.push(notchLabel);
                }
            }
        }

        if (this.zObj.notches) {
            if (this.zObj.type === 5) {
                for(i=0, j=this.zObj.notchShapesArray.length; i<j; i++){
                    this.zAxis.remove(this.zObj.notchShapesArray[i]);
                }
                this.zObj.notchShapesArray = [];

                for(i=0, j=this.zObj.notchLabelsArray.length; i<j; i++){
                    this.zAxis.remove(this.zObj.notchLabelsArray[i]);
                    elem = this.zObj.notchLabelsArray[i].element;
                    elem.parentNode.removeChild(elem);
                }
                this.zObj.notchLabelsArray = [];

                for (i = 0, j = this.zObj.values.length; i < j; i++) {
                    notchShape = new THREE.Mesh(this.notchGeom, this.notchMat);
                    notchShape.position.set(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + this.zObj.posMap[this.zObj.values[i]]);
                    notchLabel = new DataDoo.Label(this.zObj.values[i], new THREE.Vector3(this.zObj.origin.x, this.zObj.origin.y, this.zObj.origin.z + this.zObj.posMap[this.zObj.values[i]]));
                    this.zAxis.add(notchShape);
                    this.zObj.notchShapesArray.push(notchShape);
                    this.zAxis.add(notchLabel);
                    this.zObj.notchLabelsArray.push(notchLabel);
                }
            }
        }
    };
})(window.DataDoo);
