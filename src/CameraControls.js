(function(DataDoo) {
    /**
     * DataDoo Camera Controls
     */
    function CameraControls(object, domElement) {
        THREE.OrbitControls.call(object, domElement);

        this.zoomIn = function ( zoomScale ) {
            if ( zoomScale === undefined ) {
                zoomScale = getZoomScale();
            }

            if(this.object.inOrthographicMode){
                var z = this.object.zoom;
                if(z-1>0){
                    this.object.setZoom(--z);
                }
            }
            else{
                scale /= zoomScale;
            }
        };

        this.zoomOut = function ( zoomScale ) {
            if ( zoomScale === undefined ) {
                zoomScale = getZoomScale();
            }
            if(this.object.inOrthographicMode){
                var z = this.object.zoom;
                this.object.setZoom(++z);
            }
            else{
                scale *= zoomScale;
            }
        };
    }
    CameraControls.prototype = Object.create(THREE.OrbitControls.prototype);
    DataDoo.CameraControls = CameraControls;


})(window.DataDoo);
