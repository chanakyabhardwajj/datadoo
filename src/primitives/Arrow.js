(function(DataDoo) {

    /**
     *  Arrow primitive
     */
    function Arrow(configObj) {
        /*
         from : new THREE.Vector3(0,0,0),
         to : new THREE.Vector3(0,100,0),

         lineColor : "0x000000",
         lineThickness : 1,
         lineOpacity : 1,

         fromCone : false,
         fromConeHeight : 10,
         fromConeTopRadius : 1,
         fromConeBaseRadius : 5,
         fromConeColor : "0xff0000",
         fromConeOpacity : 1,

         toCone : true,
         toConeHeight : 5,
         toConeTopRadius : 0,
         toConeBaseRadius : 3,
         toConeColor : "0x000000",
         toConeOpacity : 0.5
         */

        DataDoo.Primitive.call(this);
        configObj = configObj || {};

        this.fromPosition = this.makeRVector(configObj.from);
        this.toPosition = this.makeRVector(configObj.to);

        //this.arrowLineDirection = this.toPosition.clone().sub(this.fromPosition).normalize();

        this.arrowLineOpacity = configObj.lineOpacity || 1;
        this.arrowLineThickness = configObj.lineThickness || 1;
        this.arrowLineColor = configObj.lineColor || "0x000000";

        this.fromCone = configObj.fromCone || false;
        this.fromConeHeight = configObj.fromConeHeight || 5;
        this.fromConeTopRadius = configObj.fromConeTopRadius || 0;
        this.fromConeBaseRadius = configObj.fromConeBaseRadius || 3;
        this.fromConeColor = configObj.fromConeColor || "0x000000";
        this.fromConeOpacity = configObj.fromConeOpacity || 1;

        this.toCone = configObj.toCone || false;
        this.toConeHeight = configObj.toConeHeight || 5;
        this.toConeTopRadius = configObj.toConeTopRadius || 0;
        this.toConeBaseRadius = configObj.toConeBaseRadius || 3;
        this.toConeColor = configObj.toConeColor || "0x000000";
        this.toConeOpacity = configObj.toConeOpacity || 1;

        this.line = new DataDoo.Line([this.fromPosition, this.toPosition], this.arrowLineColor, this.arrowLineThickness, this.arrowLineOpacity);
        this.add(this.line);

        if (this.fromCone) {
            this.fromCone = new DataDoo.Cone(this.fromConeHeight, this.fromConeTopRadius, this.fromConeBaseRadius, this.fromConeColor, this.fromConeOpacity);
            this.add(this.fromCone);
            this.fromCone.position = this.fromPosition;
        }

        if (this.toCone) {
            this.toCone = new DataDoo.Cone(this.toConeHeight, this.toConeTopRadius, this.toConeBaseRadius, this.toConeColor, this.toConeOpacity);
            this.add(this.toCone);
            this.toCone.position = this.toPosition;
        }
    }

    Arrow.prototype = Object.create(DataDoo.Primitive.prototype);

    Arrow.prototype.updateGeometry = function(){
        this.arrowLineDirection = this.toPosition.clone().sub(this.fromPosition).normalize();
        if(this.toCone) this.setDirection(this.arrowLineDirection, this.toCone);
        if(this.fromCone) this.setDirection(this.arrowLineDirection.clone().negate(), this.fromCone);
    };

    DataDoo.Arrow = Arrow;
})(window.DataDoo);
