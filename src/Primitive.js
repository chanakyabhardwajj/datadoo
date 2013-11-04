//A primitive is the most atomic element of DataDoo.
//It is used to represent the data and the relations.
//Essentially it is a wrapper around THREE.Object3D class.

(function(DataDoo){
    function Primitive(configObj, rowData, ddI){
        THREE.Object3D.call(this, configObj, rowData, ddI);

        //default properties of every primitive
        this.ddI = ddI;
        this.row = rowData;

        this.myxVal = this.row[this.ddI.axes.xAxis.colName];
        this.myxIndex = this.ddI.params.axes.x.type === "number" ? this.ddI.axes.xAxis.positionHash[this.myxVal] : this.ddI.axes.xAxis.positionHash[this.myxVal] - 1;

        this.myyVal = this.row[this.ddI.axes.yAxis.colName];
        this.myyIndex = this.ddI.params.axes.y.type === "number" ? this.ddI.axes.yAxis.positionHash[this.myyVal] : this.ddI.axes.yAxis.positionHash[this.myyVal] - 1;

        this.myzVal = this.row[this.ddI.axes.zAxis.colName];
        this.myzIndex = this.ddI.params.axes.z.type === "number" ? this.ddI.axes.zAxis.positionHash[this.myzVal] : this.ddI.axes.zAxis.positionHash[this.myzVal] - 1;

        this.shape = configObj.shape || null;
        this.text = configObj.text || null;
        this.add(this.shape);

        this.label = new DataDoo.Label(this.text, new THREE.Vector3(0, 0, 0), ddI);
        this.add(this.label);


        this.hoverOutline = new THREE.Mesh(this.shape.geometry, new THREE.MeshBasicMaterial( { color:0x000000, transparent:true, opacity:0.8, side:THREE.BackSide} ));
        this.hoverOutline.scale.multiplyScalar(1.02);

        /*this.boundingBox = new THREE.BoxHelper(this.shape);
        this.boundingBox.scale.multiplyScalar(1.05);
        this.boundingBox.material.color = 0x000000;
        this.boundingBox.material.linewidth = 1;
        this.boundingBox.material.opacity = 0.6;*/

        return this;
    }
    
    Primitive.prototype = new THREE.Object3D();
    Primitive.prototype.constructor = Primitive;

    Primitive.prototype.onHoverIn = function(){
        this.ddI.renderer.domElement.style.cursor = "pointer";
        _.each(this.ddI._nodes, function(o){o.shape.visible = false;});
        this.shape.visible = true;
        this.shape.add(this.hoverOutline);
        this.shape.material.opacity += 0.3;

        _.each(this.ddI._labels, function(o){o.element.style.display = "none";});
        this.label.element.style.display = "block";

        this.ddI.guides.drawGuides(this.position);

        this.ddI.axes.hideAllLabels();
        this.ddI.axes.highlightLabels(this.myxIndex, this.myyIndex, this.myzIndex);
    };

    Primitive.prototype.onHoverOut = function(){
        this.ddI.renderer.domElement.style.cursor = "default";
        _.each(this.ddI._nodes, function(o){o.shape.visible = true;});
        this.shape.remove(this.hoverOutline);
        this.shape.material.opacity -= 0.3;

        _.each(this.ddI._labels, function(o){o.element.style.display = "block";});

        this.ddI.guides.hideGuides();

        this.ddI.axes.showAllLabels();
        this.ddI.axes.unhighlightLabels(this.myxIndex, this.myyIndex, this.myzIndex);
    };

    DataDoo.Primitive = Primitive;
})(window.DataDoo);