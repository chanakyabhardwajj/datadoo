//A primitive is the most atomic element of DataDoo.
//It is used to represent the data and the relations.
//Essentially it is a wrapper around THREE.Object3D class.

(function(DataDoo){
    function Primitive(param){
        THREE.Object3D.call(this, param);

        //default properties of every primitive
        this.thickness = 1;
        this.color = 0x000000;
        this.opacity = 1;
        this.geometry = null;
        this.material = null;
        this.mesh = null;
    }

    Primitive.prototype = new THREE.Object3D();
    Primitive.prototype.constructor = Primitive;

    DataDoo.Primitive = Primitive;
})(window.DataDoo);