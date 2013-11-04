(function (DataDoo) {
    function AxesHelper(ddI) {
        THREE.Object3D.call(this, ddI);
        this.ddI = ddI;
        this.datasets = ddI.datasets;

        //First of all, we need to make sure that all the datasets are compatible
        //i.e. all the column names and type, match!
        //Note : Columns need to be ordered similarly as well.

        //Stuff all the column-name-arrays in this super-array.
        var allColNames = [], colNames, i, j, x, y, tempArr = [], label;
        for (i = 0, j = this.datasets.length; i < j; i++) {
            var ds = this.datasets[i];
            allColNames.push(ds.columnNames());
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
        this.xAxis.positionHash = {};
        this.xAxis.notchLabelsArray = [];

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[0]).data);
            if (this.ddI.params.axes.x.type !== "number" || this.datasets[x].column(colNames[0]).type !== "number") {
                this.xAxis.colType = "mixed";
                this.ddI.params.axes.x.type = this.xAxis.colType;

            }
        }
        this.xAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.yAxis = new THREE.Object3D();
        this.yAxis.colName = colNames[1];
        this.yAxis.colType = "number";
        this.yAxis.colUniqs = [];
        this.yAxis.positionHash = {};
        this.yAxis.notchLabelsArray = [];

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[1]).data);
            if (this.ddI.params.axes.y.type !== "number" || this.datasets[x].column(colNames[1]).type !== "number") {
                this.yAxis.colType = "mixed";
                this.ddI.params.axes.y.type = this.yAxis.colType;
            }
        }
        this.yAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.zAxis = new THREE.Object3D();
        this.zAxis.colName = colNames[2];
        this.zAxis.colType = "number";
        this.zAxis.colUniqs = [];
        this.zAxis.positionHash = {};
        this.zAxis.notchLabelsArray = [];

        for (x = 0, y = this.datasets.length; x < y; x++) {
            tempArr.push(this.datasets[x].column(colNames[2]).data);
            if (this.ddI.params.axes.z.type !== "number" || this.datasets[x].column(colNames[2]).type !== "number") {
                this.zAxis.colType = "mixed";
                this.ddI.params.axes.z.type = this.zAxis.colType;
            }
        }
        this.zAxis.colUniqs = _.chain(tempArr).flatten().uniq().value();
        tempArr = [];

        this.xObj = ddI.axesConf.x;
        this.yObj = ddI.axesConf.y;
        this.zObj = ddI.axesConf.z;

        var notchLabel, notchShape;
        var coneGeometry = new THREE.CylinderGeometry(0, ddI.gridStep / 8, ddI.gridStep / 5, 25, 5);
        var xcone, xline, xlineGeometry = new THREE.Geometry();
        var ycone, yline, ylineGeometry = new THREE.Geometry();
        var zcone, zline, zlineGeometry = new THREE.Geometry();
        var labelGeom, labelMaterial = new THREE.MeshBasicMaterial({ color : 0x666666, overdraw : true });
        var labelConfig = {size : 2.5, height : 0.1, curveSegments : 10, font : "helvetiker"};

        if (this.xAxis.colType === "number") {
            this.xAxis.length = Math.max(_.max(this.xAxis.colUniqs), 0) - Math.min(_.min(this.xAxis.colUniqs), 0) + this.ddI.gridStep;
            this.xAxis.from = new THREE.Vector3(Math.min(_.min(this.xAxis.colUniqs), 0), 0, 0);
            this.xAxis.to = new THREE.Vector3(Math.max(_.max(this.xAxis.colUniqs)+ this.ddI.gridStep, 0), 0, 0);
        }
        else {
            this.xAxis.length = this.xAxis.colUniqs.length * ddI.gridStep;
            this.xAxis.from = new THREE.Vector3(0, 0, 0);
            this.xAxis.to = new THREE.Vector3(this.ddI.gridStep + (this.xAxis.colUniqs.length + 1) * ddI.gridStep, 0, 0);
        }

        if (this.yAxis.colType === "number") {
            this.yAxis.length = Math.max(_.max(this.yAxis.colUniqs), 0) - Math.min(_.min(this.yAxis.colUniqs), 0) + this.ddI.gridStep;
            this.yAxis.from = new THREE.Vector3(0, Math.min(_.min(this.yAxis.colUniqs), 0), 0);
            this.yAxis.to = new THREE.Vector3(0, Math.max(_.max(this.yAxis.colUniqs)+ this.ddI.gridStep, 0), 0);
        }
        else {
            this.yAxis.length = this.yAxis.colUniqs.length * this.ddI.gridStep;
            this.yAxis.from = new THREE.Vector3(0, 0, 0);
            this.yAxis.to = new THREE.Vector3(0, this.ddI.gridStep + (this.yAxis.colUniqs.length + 1) * ddI.gridStep, 0);
        }

        if (this.zAxis.colType === "number") {
            this.zAxis.length = Math.max(_.max(this.zAxis.colUniqs), 0) - Math.min(_.min(this.zAxis.colUniqs), 0) + this.ddI.gridStep;
            this.zAxis.from = new THREE.Vector3(0, 0, Math.min(_.min(this.zAxis.colUniqs), 0));
            this.zAxis.to = new THREE.Vector3(0, 0, Math.max(_.max(this.zAxis.colUniqs) + this.ddI.gridStep, 0));
        }
        else {
            this.zAxis.length = this.zAxis.colUniqs.length * ddI.gridStep;
            this.zAxis.from = new THREE.Vector3(0, 0, 0);
            this.zAxis.to = new THREE.Vector3(0, 0, this.ddI.gridStep + (this.zAxis.colUniqs.length + 1) * ddI.gridStep);
        }

        xlineGeometry.vertices.push(this.xAxis.from);
        xlineGeometry.vertices.push(this.xAxis.to);
        xlineGeometry.computeLineDistances();

        labelGeom = new THREE.TextGeometry(this.xAxis.colName, labelConfig);
        label = new THREE.Mesh(labelGeom, labelMaterial);
        label.position = new THREE.Vector3(this.xAxis.to.x + ddI.gridStep / 2, this.xAxis.to.y, this.xAxis.to.z + ddI.gridStep / 2);
        label.rotateX(-Math.PI / 2);
        label.rotateZ(Math.PI / 2);
        ddI._3Dlabels.push(label);

        xline = new THREE.Line(xlineGeometry, new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, color : /*this.axesConf.x.color*/ ddI.theme[0] }), THREE.LinePieces);
        xline.matrixAutoUpdate = false;

        xcone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color : ddI.theme[0] }));
        xcone.rotateZ(-Math.PI / 2);
        xcone.position = this.xAxis.to;
        this.xAxis.add(xcone);
        this.xAxis.add(label);
        this.xAxis.add(xline);

        ylineGeometry.vertices.push(this.yAxis.from);
        ylineGeometry.vertices.push(this.yAxis.to);
        ylineGeometry.computeLineDistances();

        labelGeom = new THREE.TextGeometry(this.yAxis.colName, labelConfig);
        label = new THREE.Mesh(labelGeom, labelMaterial);
        label.position = new THREE.Vector3(this.yAxis.to.x + ddI.gridStep / 4, this.yAxis.to.y + ddI.gridStep / 2, this.yAxis.to.z + ddI.gridStep / 4);
        ddI._3Dlabels.push(label);

        yline = new THREE.Line(ylineGeometry, new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, color : /*this.axesConf.y.color*/ ddI.theme[0] }), THREE.LinePieces);
        yline.matrixAutoUpdate = false;

        ycone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color : ddI.theme[0] }));
        ycone.rotateZ(0);
        ycone.position = this.yAxis.to;
        this.yAxis.add(ycone);
        this.yAxis.add(label);
        this.yAxis.add(yline);

        zlineGeometry.vertices.push(this.zAxis.from);
        zlineGeometry.vertices.push(this.zAxis.to);
        zlineGeometry.computeLineDistances();

        labelGeom = new THREE.TextGeometry(this.zAxis.colName, labelConfig);
        label = new THREE.Mesh(labelGeom, labelMaterial);
        label.position = new THREE.Vector3(this.zAxis.to.x, this.zAxis.to.y, this.zAxis.to.z + ddI.gridStep / 2);
        label.rotateX(-Math.PI/2);
        ddI._3Dlabels.push(label);

        zline = new THREE.Line(zlineGeometry, new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, color : /*this.axesConf.z.color*/ ddI.theme[0] }), THREE.LinePieces);
        zline.matrixAutoUpdate = false;

        zcone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color : ddI.theme[0] }));
        zcone.rotateX(Math.PI / 2);
        zcone.position = this.zAxis.to;
        this.zAxis.add(zcone);
        this.zAxis.add(label);
        this.zAxis.add(zline);

        var notchGeom = new THREE.CubeGeometry(ddI.gridStep / 100, ddI.gridStep / 10, ddI.gridStep / 100);
        var notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.x.color*/ 0x666666, opacity : 1});

        for (i = 0, j = this.xAxis.length / ddI.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);

            if (this.xAxis.colType === "number") {
                notchShape.position.set((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * i), this.xAxis.from.y, this.xAxis.from.z);
                notchLabelGeom = new THREE.TextGeometry((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * i), labelConfig);
            }
            else {
                notchShape.position.set((this.xAxis.from.x - (this.xAxis.from.x % ddI.gridStep)) + (ddI.gridStep * (i + 1)), this.xAxis.from.y, this.xAxis.from.z);
                notchLabelGeom = new THREE.TextGeometry(this.xAxis.colUniqs[i], labelConfig);
            }

            this.xAxis.positionHash[this.xAxis.colUniqs[i]] = i + 1;
            notchLabel = new THREE.Mesh(notchLabelGeom, labelMaterial);
            ddI._3Dlabels.push(notchLabel);
            notchLabel.position = new THREE.Vector3(notchShape.position.x, notchShape.position.y, notchShape.position.z - ddI.gridStep / 5);

            notchLabel.rotateX(-Math.PI / 2);
            notchLabel.rotateZ(Math.PI / 2);

            notchLabel.myAxis = "X";


            this.xAxis.add(notchShape);
            this.xAxis.add(notchLabel);
            this.xAxis.notchLabelsArray.push(notchLabel);
        }

        notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.y.color*/ ddI.theme[1], opacity : 0.4});

        for (i = 0, j = this.yAxis.length / ddI.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);
            if (this.yAxis.colType === "number") {
                notchShape.position.set(this.yAxis.from.x, (this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * i), this.yAxis.from.z);
                notchLabelGeom = new THREE.TextGeometry((this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * i), labelConfig);
            }
            else {
                notchShape.position.set(this.yAxis.from.x, (this.yAxis.from.y - (this.yAxis.from.y % ddI.gridStep)) + (ddI.gridStep * (i + 1)), this.yAxis.from.z);
                notchLabelGeom = new THREE.TextGeometry(this.yAxis.colUniqs[i], labelConfig);
            }
            this.yAxis.positionHash[this.yAxis.colUniqs[i]] = i + 1;

            notchShape.rotateZ(Math.PI / 2);
            notchLabel = new THREE.Mesh(notchLabelGeom, labelMaterial);
            ddI._3Dlabels.push(notchLabel);
            notchLabel.position = new THREE.Vector3(notchShape.position.x + ddI.gridStep / 5, notchShape.position.y, notchShape.position.z);

            notchLabel.myAxis = "Y";

            this.yAxis.add(notchShape);
            this.yAxis.add(notchLabel);
            this.yAxis.notchLabelsArray.push(notchLabel);
        }

        notchMat = new THREE.MeshBasicMaterial({color : /*this.axesConf.z.color*/ ddI.theme[1], opacity : 0.4});

        for (i = 0, j = this.zAxis.length / ddI.gridStep; i < j; i++) {
            notchShape = new THREE.Mesh(notchGeom, notchMat);
            if (this.zAxis.colType === "number") {
                notchShape.position.set(this.zAxis.from.x, this.zAxis.from.y, (this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * i));
                notchLabelGeom = new THREE.TextGeometry((this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * i), labelConfig);
            }
            else {
                notchShape.position.set(this.zAxis.from.x, this.zAxis.from.y, (this.zAxis.from.z - (this.zAxis.from.z % ddI.gridStep)) + (ddI.gridStep * (i + 1)));
                notchLabelGeom = new THREE.TextGeometry(this.zAxis.colUniqs[i], labelConfig);
            }
            notchLabelGeom.computeBoundingBox();
            notchLabel = new THREE.Mesh(notchLabelGeom, labelMaterial);
            ddI._3Dlabels.push(notchLabel);
            this.zAxis.positionHash[this.zAxis.colUniqs[i]] = i + 1;
            notchLabel.rotateX(-Math.PI/2);
            notchLabel.position = new THREE.Vector3(notchLabelGeom.boundingBox.min.x - notchLabelGeom.boundingBox.max.x - ddI.gridStep / 5, notchShape.position.y, notchShape.position.z);

            notchLabel.myAxis = "Z";

            this.zAxis.add(notchShape);
            this.zAxis.add(notchLabel);
            this.zAxis.notchLabelsArray.push(notchLabel);
        }

        this.add(this.xAxis);
        this.add(this.yAxis);
        this.add(this.zAxis);

        return this;
    }

    AxesHelper.prototype = new THREE.Object3D();
    AxesHelper.prototype.constructor = AxesHelper;

    DataDoo.AxesHelper = AxesHelper;

    AxesHelper.prototype.hideAllLabels = function(){
        _.each(this.xAxis.notchLabelsArray, function(o){o.visible = false;});
        _.each(this.yAxis.notchLabelsArray, function(o){o.visible = false;});
        _.each(this.zAxis.notchLabelsArray, function(o){o.visible = false;});
    };

    AxesHelper.prototype.showAllLabels = function(){
        _.each(this.xAxis.notchLabelsArray, function(o){o.visible = true;});
        _.each(this.yAxis.notchLabelsArray, function(o){o.visible = true;});
        _.each(this.zAxis.notchLabelsArray, function(o){o.visible = true;});
    };

    AxesHelper.prototype.highlightLabels = function (xLabelIndex, yLabelIndex, zLabelIndex) {
        if(xLabelIndex && this.xAxis.notchLabelsArray[xLabelIndex]) {
            this.xAxis.notchLabelsArray[xLabelIndex].visible = true;
            this.xAxis.notchLabelsArray[xLabelIndex].scale.set(1.6,1.6,3.2);
            //this.xAxis.notchLabelsArray[xLabelIndex].lookAtCam = true;
        }
        if(yLabelIndex && this.yAxis.notchLabelsArray[yLabelIndex]) {
            this.yAxis.notchLabelsArray[yLabelIndex].scale.set(1.6,1.6,3.2);
            this.yAxis.notchLabelsArray[yLabelIndex].visible = true;
            //this.yAxis.notchLabelsArray[yLabelIndex].lookAtCam = true;
        }
        if(zLabelIndex && this.zAxis.notchLabelsArray[zLabelIndex]) {
            this.zAxis.notchLabelsArray[zLabelIndex].scale.set(1.6,1.6,3.2);
            this.zAxis.notchLabelsArray[zLabelIndex].visible = true;
            //this.zAxis.notchLabelsArray[zLabelIndex].lookAtCam = true;
        }
    };

    AxesHelper.prototype.unhighlightLabels = function (xLabelIndex, yLabelIndex, zLabelIndex) {
        if(xLabelIndex && this.xAxis.notchLabelsArray[xLabelIndex]) {
            this.xAxis.notchLabelsArray[xLabelIndex].scale.set(1,1,1);
            //this.xAxis.notchLabelsArray[xLabelIndex].lookAtCam = false;
            /*this.xAxis.notchLabelsArray[xLabelIndex].rotation.x = -Math.PI/2;
            this.xAxis.notchLabelsArray[xLabelIndex].rotation.y = 0;
            this.xAxis.notchLabelsArray[xLabelIndex].rotation.z = Math.PI/2;*/
        }
        if(yLabelIndex && this.yAxis.notchLabelsArray[yLabelIndex]) {
            this.yAxis.notchLabelsArray[yLabelIndex].scale.set(1,1,1);
            //this.yAxis.notchLabelsArray[yLabelIndex].lookAtCam = false;
            /*this.yAxis.notchLabelsArray[yLabelIndex].rotation.x = 0;
            this.yAxis.notchLabelsArray[yLabelIndex].rotation.y = 0;
            this.yAxis.notchLabelsArray[yLabelIndex].rotation.z = 0;*/
        }
        if(zLabelIndex && this.zAxis.notchLabelsArray[zLabelIndex]) {
            this.zAxis.notchLabelsArray[zLabelIndex].scale.set(1,1,1);
            //this.zAxis.notchLabelsArray[zLabelIndex].lookAtCam = false;
            /*this.zAxis.notchLabelsArray[zLabelIndex].rotation.x = -Math.PI/2;
            this.zAxis.notchLabelsArray[zLabelIndex].rotation.y = 0;
            this.zAxis.notchLabelsArray[zLabelIndex].rotation.z = 0;*/
        }

    };

})(window.DataDoo);
