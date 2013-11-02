//A primitive is the most atomic element of DataDoo.
//It is used to represent the data and the relations.
//Essentially it is a wrapper around THREE.Object3D class.

(function(DataDoo){
    function Primitive(configObj, rowData, ddI){
        THREE.Object3D.call(this, configObj, rowData, ddI);

        //default properties of every primitive
        this.ddI = ddI;
        this.row = rowData;
        this.shape = configObj.shape || null;
        this.text = configObj.text || null;
        this.add(this.shape);


        this.hoverOutline = new THREE.Mesh(this.shape.geometry, new THREE.MeshBasicMaterial( { color:0x000000, transparent:true, opacity:0.7, side:THREE.BackSide} ));
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
        this.shape.scale.multiplyScalar(1.02);
        this.shape.add(this.hoverOutline);

        this.ddI.guides.drawGuides(this.position);
    };

    Primitive.prototype.onHoverOut = function(){
        this.shape.scale.set(1,1,1);
        this.shape.remove(this.hoverOutline);

        this.ddI.guides.hideGuides();
    };

    DataDoo.Primitive = Primitive;
})(window.DataDoo);