(function (DataDoo) {
    function Sprite(message, parameters, ddInstance) {
        THREE.Object3D.call(this);

        if (parameters === undefined) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ? parameters.fontface : "Arial";

        var fontsize = 4 * (parameters.hasOwnProperty("fontsize") ? parameters.fontsize : 12);

        var textColor = parameters.hasOwnProperty("textColor") ? parameters.textColor : "rgba(0, 0, 0, 1.0)";

        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? parameters.backgroundColor : { r : 255, g : 255, b : 255, a : 1.0 };

        var spriteAlignment = THREE.SpriteAlignment.topLeft;

        var canvas = document.getElementById("helperCanvas");
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.setAttribute("id", "helperCanvas");
            canvas.width = 400;
            canvas.height = 200;
            canvas.style.width = 400 + "px";
            canvas.style.height = 200 + "px";
        }

        var context = canvas.getContext('2d');
        context.clearRect(0,0,400,200);

        /*context.fillStyle ="rgba{155,155,255,1.0}";
        context.fillRect(0,0,400,200);*/

        context.font = fontsize + "px " + fontface;
        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;
        var textHeight = fontsize;

        context.textAlign = "center";
        context.textBaseline = "middle";

        // text color
        var tColor = new THREE.Color(textColor);

        //context.fillStyle = "rgba(" + tColor.r * 255 + "," + tColor.g * 255 + "," + tColor.b * 255 + "," + " 1.0)";
        context.fillStyle = "rgba(0, 0, 0, 1.0)";

        context.fillText(message, textWidth / 2, textHeight / 2);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        //texture.magFilter = THREE.NearestFilter;
        //texture.minFilter = THREE.NearestMipMapLinearFilter;

        var spriteMaterial = new THREE.SpriteMaterial({ map : texture, useScreenCoordinates : false,sizeAttenuation : false, alignment : spriteAlignment });
        spriteMaterial.transparent = true;


        var textObject = new THREE.Object3D();
        var sprite = new THREE.Sprite(spriteMaterial);
        textObject.textHeight = fontsize;
        textObject.textWidth = (textWidth / textHeight) * textObject.textHeight;
        sprite.scale.set(120,50, 1);
        //sprite.scale.multiplyScalar(10);

        sprite.type = "sprite";
        console.log(this);
        ddInstance._sprites.push(sprite);
        return sprite;
    }
    DataDoo.Sprite = Sprite;

})(window.DataDoo);
