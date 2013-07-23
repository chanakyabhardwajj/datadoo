(function(DataDoo) {
    DataDoo.utils = {
        rDefault: function(target, source) {
            for(var prop in source) {
                if(prop in target) {
                    this.rDefault(target[prop], source[prop]);
                } else {
                    target[prop] = source[prop];
                }
            }
        },

        // Request animationframe helper
        _raf : (
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            }
        ),

        requestAnimationFrame: function(callback) {
            return this._raf.call(window, callback);
        },

        makeTextSprite : function(message, parameters) {
        if (parameters === undefined) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters.fontface : "Arial";

        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters.fontsize : 18;

        var textColor = parameters.hasOwnProperty("textColor") ?
            parameters.textColor : "rgba(0, 0, 0, 1.0)";

        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters.borderThickness : 0;

        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters.borderColor : { r : 0, g : 0, b : 0, a : 1.0 };

        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters.backgroundColor : { r : 255, g : 255, b : 255, a : 1.0 };

        var spriteAlignment = THREE.SpriteAlignment.topLeft;

        var canvas = document.getElementById("helperCanvas");
        if(!canvas){
            canvas = document.createElement('canvas');
        }
        canvas.setAttribute("id", "helperCanvas");
        var context = canvas.getContext('2d');
        context.clearRect();
        context.font = fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;

        // background color
        context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;
        //DataDoo.utils.makeRoundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        var tColor = new THREE.Color(textColor);

        context.fillStyle = "rgba(" + tColor.r*255 + "," + tColor.g*255 + "," + tColor.b*255 + "," + " 1.0)";
        //context.fillStyle = "rgba(0.99, 0,0, 1.0)";

        context.fillText(message, borderThickness, fontsize + borderThickness);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            { map : texture, useScreenCoordinates : false, alignment : spriteAlignment });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(100, 50, 1.0);
        return sprite;
    },

    makeRoundRect : function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

};
})(window.DataDoo);
