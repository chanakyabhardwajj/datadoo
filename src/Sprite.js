(function (DataDoo) {
    function Sprite(message, parameters, ddInstance) {
        THREE.Object3D.call(this);

        if (parameters === undefined) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ? parameters.fontface : "Arial";

        var fontsize = 4 * (parameters.hasOwnProperty("fontsize") ? parameters.fontsize : 15);

        var textColor = parameters.hasOwnProperty("textColor") ? parameters.textColor : "rgba(0, 0, 0, 1.0)";

        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters.backgroundColor : { r : 255, g : 255, b : 255, a : 1.0 };

        var spriteAlignment = THREE.SpriteAlignment.centerLeft;

        var canvas = document.getElementById("helperCanvas");
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.setAttribute("id", "helperCanvas");
            canvas.width = 1000;
            canvas.height = 100;
        }

        var context = canvas.getContext('2d');
        context.clearRect(0,0,1000,100);


        context.font = fontsize + "px " + fontface;
        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;
        var textHeight = fontsize;

        context.textAlign = "center";
        context.textBaseline = "middle";

        // text color
        var tColor = new THREE.Color(textColor);

        //context.fillStyle ="rgba{155,155,255,1.0}";
        /*context.beginPath();
         context.moveTo(x + r, y);
         context.lineTo(x + w - r, y);
         context.quadraticCurveTo(x + w, y, x + w, y + r);
         context.lineTo(x + w, y + h - r);
         context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
         context.lineTo(x + r, y + h);
         context.quadraticCurveTo(x, y + h, x, y + h - r);
         context.lineTo(x, y + r);
         context.quadraticCurveTo(x, y, x + r, y);
         context.closePath();*/
        //context.fillRect(0,0,1000,100);

        //context.fillStyle = "rgba(" + tColor.r * 255 + "," + tColor.g * 255 + "," + tColor.b * 255 + "," + " 1.0)";
        context.fillStyle = "rgba(0, 0, 0, 1.0)";

        context.fillText(message, textWidth / 2, textHeight / 2);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({ map : texture, useScreenCoordinates : false, sizeAttenuation : true, alignment : spriteAlignment });
        //spriteMaterial.transparent = true;


        var textObject = new THREE.Object3D();
        var sprite = new THREE.Sprite(spriteMaterial);
        textObject.textHeight = fontsize;
        textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
        sprite.scale.set(50,5, 1);
        //sprite.scale.multiplyScalar(20);

        sprite.type = "sprite";
        ddInstance._sprites.push(sprite);
        return sprite;
    }
    DataDoo.Sprite = Sprite;

})(window.DataDoo);
