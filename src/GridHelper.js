(function(DataDoo) {
    function GridHelper(ddI) {
        THREE.Object3D.call(this, ddI);

        //GRID
        if (ddI.gridBoolean) {
            //the following code-block is similar to THREE.GridHelper
            //but manually coding it, to keep the customising options open
            var size = (Math.max(ddI.axes.xAxis.notchLabelsArray.length, ddI.axes.zAxis.notchLabelsArray.length) + 2) * ddI.gridStep, step = ddI.gridStep;

            var geometry = new THREE.Geometry();
            var material = new THREE.LineBasicMaterial({ color : /*0xBED6E5*/ ddI.theme[2], opacity : 1, linewidth : 1 });

            for (i = -size; i <= size; i += step) {
                geometry.vertices.push(new THREE.Vector3(-size, 0, i));
                geometry.vertices.push(new THREE.Vector3(size, 0, i));
                geometry.vertices.push(new THREE.Vector3(i, 0, -size));
                geometry.vertices.push(new THREE.Vector3(i, 0, size));
            }

            this.grid = new THREE.Line(geometry, material, THREE.LinePieces);
            this.grid.position.y = -0.1;
            this.add(this.grid);
            return this;
        }
    }

    GridHelper.prototype = new THREE.Object3D();
    GridHelper.prototype.constructor = GridHelper;

    DataDoo.GridHelper = GridHelper;

    GridHelper.prototype.updateGeometry = function () {

    };
})(window.DataDoo);
