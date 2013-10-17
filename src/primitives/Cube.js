(function(DataDoo) {

    Cube.prototype = Object.create(DataDoo.Primitive.prototype);

    /**
     *  Cube primitive
     */
    function Cube(width, height, depth, color, opacity, wireframe) {
        DataDoo.Primitive.call(this);
        this.width = width || 10;
        this.height = height || 10;
        this.depth = depth || 10;
        this.color = color || 0x767676;
        this.opacity = opacity || 1;
        this.wireframe = wireframe || false;

        this.material = new THREE.MeshLambertMaterial({color : this.color, opacity : this.opacity, wireframe : this.wireframe, transparent : true});

        this.materials = [
             new THREE.MeshLambertMaterial( { color : this.color, opacity : this.opacity, wireframe : false, transparent : true } ),
             new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, wireframeLinewidth : 1})
            /*new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, opacity: 0.5 } ),
            new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 0.5, wireframe: true } )*/
        ];
        this.geometry = new THREE.CubeGeometry(this.width, this.height, this.depth);
        //this.geometry = new THREE.CubeGeometry(5,60,4, this.materials);
        //this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshFaceMaterial(this.materials));
        this.mesh = THREE.SceneUtils.createMultiMaterialObject(this.geometry, this.materials );
        this.add(this.mesh);
    }

    Cube.prototype.updateGeometry = function () {
        this.geometry.computeLineDistances();
    };


    DataDoo.Cube = Cube;

})(window.DataDoo);
