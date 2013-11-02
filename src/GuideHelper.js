(function (DataDoo) {
    function GuideHelper(ddI) {
        THREE.Object3D.call(this, ddI);

        var guideMaterial = new THREE.LineDashedMaterial({ dashSize : ddI.gridStep / 4, linewidth : 2, opacity : 0.6, color : 0x1d4b5e });

        var yGuideGeometry = new THREE.Geometry();
        yGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        yGuideGeometry.vertices.push(new THREE.Vector3(100, 0, 100));
        yGuideGeometry.dynamic = true;
        yGuideGeometry.verticesNeedUpdate = true;
        yGuideGeometry.computeLineDistances();

        var hGuideGeometry = new THREE.Geometry();
        hGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        hGuideGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
        hGuideGeometry.dynamic = true;
        hGuideGeometry.verticesNeedUpdate = true;
        hGuideGeometry.computeLineDistances();

        var xGuideGeometry = new THREE.Geometry();
        xGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        xGuideGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
        xGuideGeometry.dynamic = true;
        xGuideGeometry.verticesNeedUpdate = true;
        xGuideGeometry.computeLineDistances();

        var zGuideGeometry = new THREE.Geometry();
        zGuideGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        zGuideGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
        zGuideGeometry.dynamic = true;
        zGuideGeometry.verticesNeedUpdate = true;
        zGuideGeometry.computeLineDistances();

        this.yGuide = new THREE.Line(yGuideGeometry, guideMaterial, THREE.LinePieces);
        this.hGuide = new THREE.Line(hGuideGeometry, guideMaterial, THREE.LinePieces);
        this.xGuide = new THREE.Line(xGuideGeometry, guideMaterial, THREE.LinePieces);
        this.zGuide = new THREE.Line(zGuideGeometry, guideMaterial, THREE.LinePieces);

        this.yGuide.visible = false;
        this.hGuide.visible = false;
        this.xGuide.visible = false;
        this.zGuide.visible = false;

        this.add(this.yGuide);
        this.add(this.hGuide);
        this.add(this.xGuide);
        this.add(this.zGuide);

        var horPlaneMat = new THREE.MeshBasicMaterial({ color : 0x377c97, transparent : true, opacity : 0.4, side : THREE.DoubleSide, overdraw : true });

        var horPlaneGeom = new THREE.PlaneGeometry(100,100,1,1);
/*        horPlaneGeom.vertices.push(new THREE.Vector3(0, 0, 0));
        horPlaneGeom.vertices.push(new THREE.Vector3(100, 0, 0));
        horPlaneGeom.vertices.push(new THREE.Vector3(100, 0, 100));
        horPlaneGeom.vertices.push(new THREE.Vector3(0, 0, 100));*/

        horPlaneGeom.dynamic = true;
        horPlaneGeom.verticesNeedUpdate = true;

        this.horGuide = new THREE.Mesh(horPlaneGeom, horPlaneMat);
        this.horGuide.visible = false;

        this.add(this.horGuide);
        return this;
    }

    GuideHelper.prototype = new THREE.Object3D();
    GuideHelper.prototype.constructor = GuideHelper;

    DataDoo.GuideHelper = GuideHelper;

    GuideHelper.prototype.updateGeometry = function () {

    };

    GuideHelper.prototype.drawGuides = function (point) {
        var px = point.x, py = point.y, pz = point.z;

        this.horGuide.geometry.vertices[0] = new THREE.Vector3(0, 0, 0);
        this.horGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, 0);
        this.horGuide.geometry.vertices[2] = new THREE.Vector3(0, 0, pz);
        this.horGuide.geometry.vertices[3] = new THREE.Vector3(px, 0, pz);
        this.horGuide.geometry.dynamic = true;
        this.horGuide.geometry.verticesNeedUpdate = true;
        this.horGuide.visible = true;

        this.yGuide.geometry.vertices[0] = new THREE.Vector3(0, py, 0);
        this.yGuide.geometry.vertices[1] = new THREE.Vector3(px, py, pz);
        this.yGuide.geometry.computeLineDistances();
        this.yGuide.geometry.verticesNeedUpdate = true;

        this.hGuide.geometry.vertices[0] = new THREE.Vector3(px, py, pz);
        this.hGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, pz);
        this.hGuide.geometry.computeLineDistances();
        this.hGuide.geometry.verticesNeedUpdate = true;

        this.xGuide.geometry.vertices[0] = new THREE.Vector3(px, 0, 0);
        this.xGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, pz);
        this.xGuide.geometry.computeLineDistances();
        this.xGuide.geometry.verticesNeedUpdate = true;

        this.zGuide.geometry.vertices[0] = new THREE.Vector3(0, 0, pz);
        this.zGuide.geometry.vertices[1] = new THREE.Vector3(px, 0, pz);
        this.zGuide.geometry.computeLineDistances();
        this.zGuide.geometry.verticesNeedUpdate = true;

        this.yGuide.visible = true;
        this.hGuide.visible = true;
        this.xGuide.visible = true;
        this.zGuide.visible = true;
    };

    GuideHelper.prototype.hideGuides = function () {
        this.yGuide.geometry.verticesNeedUpdate = true;
        this.hGuide.geometry.verticesNeedUpdate = true;
        this.xGuide.geometry.verticesNeedUpdate = true;
        this.zGuide.geometry.verticesNeedUpdate = true;
        this.yGuide.visible = false;
        this.hGuide.visible = false;
        this.xGuide.visible = false;
        this.zGuide.visible = false;

        this.horGuide.geometry.dynamic = true;
        this.horGuide.geometry.verticesNeedUpdate = true;
        this.horGuide.visible = false;
    };
})(window.DataDoo);
