(function(DataDoo) {
    /**
     *  Line primitive
     */
    function DashedLine(color, dashSize, gapSize, sourceNode, destNode) {
        this.dashSize = dashSize || 4;
        this.gapSize = gapSize || 2;
        this.color = color || 0x8888ff;
        this.sourcePosition = sourceNode.position || new THREE.Vector3(0,0,0);
        this.destinationPosition = destNode.position || new THREE.Vector3(10,10,10);

        this.material = new THREE.MeshLambertMaterial({color: this.color});
        this.geometry = new THREE.SphereGeometry(this.radius);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.objects = [this.mesh];

        this.lineGeometry = new THREE.Geometry();
        var vertArray = this.lineGeometry.vertices;
        vertArray.push( this.sourcePosition, this.destinationPosition);
        this.lineGeometry.computeLineDistances();
        this.lineMaterial = new THREE.LineDashedMaterial( { color: this.color, dashSize: this.dashSize, gapSize: this.gapSize } );
        this.mesh = new THREE.Line( this.lineGeometry, this.lineMaterial );
        this.objects = [this.mesh];
    }

    /**
     * Relation is a visual representation of connections between nodes
     * It contains a set of graphics primitives that represent itself.
     */
    function Relation(/*array of nodes*/ nodes, /*optional*/ data) {
        this.nodes = nodes;
        this.primitives = [];
        this.data = data;
    }

    Relation.prototype.addDashedLine = function(color, dashSize, gapSize, sourceNode, destNode) {
        var line = new DashedLine(color, dashSize, gapSize, sourceNode, destNode);
        this.primitives.push(line);
        return line;
    };

    DataDoo.Relation = Relation;
})(window.DataDoo);


