(function (DataDoo) {
    DataDoo.utils = {
        rDefault : function (target, source) {
            if (source !== null && typeof source === 'object') {
                for (var prop in source) {
                    if (prop in target) {
                        this.rDefault(target[prop], source[prop]);
                    }
                    else {
                        target[prop] = source[prop];
                    }
                }
            }
        },

        traverseObject3D : function (object, iter, context) {
            _.each(object.children, function (child) {
                iter.call(context, child);
                this.traverseObject3D(child, iter, context);
            }, this);
        },

        onResolveAll : (function () {
            function clear(array) {
                for (var i = 0; i < array.length; i++) {
                    array[i] = false;
                }
            }

            function makeCallback(i, array, finalCallback) {
                return function () {
                    array[i] = true;
                    if (_.every(array)) {
                        finalCallback();
                        clear(array);
                    }
                };
            }

            return function () {
                var finalCallback = _.last(arguments);
                var objects = _.first(arguments, arguments.length - 1);
                var resolved = new Array(objects.length);
                clear(resolved);
                _.each(objects, function (object, i) {
                    object.bindOnResolve(makeCallback(i, resolved, finalCallback));
                });
            };
        })(),

        // Request animationframe helper
        _raf : (
            window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                function (callback) {
                    return window.setTimeout(callback, 1000 / 60);
                }
            ),

        requestAnimationFrame : function (callback) {
            return this._raf.call(window, callback);
        },

        makeTextSprite : function (message, parameters) {
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
            if (!canvas) {
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

            context.fillStyle = "rgba(" + tColor.r * 255 + "," + tColor.g * 255 + "," + tColor.b * 255 + "," + " 1.0)";
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

        makeRoundRect : function (ctx, x, y, w, h, r) {
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
        },

        swatches : [
            ["#14a697", "#f2c12e", "#f29d35", "#f27649", "#f25252"],

            ["#2c3e50", "#fc4349", "#d7dadb", "#6dbcdb", "#ffffff"],

            ["#252526", "#3e3e40", "#038c7e", "#03a688", "#73bf86"],

            ["#f4fac7", "#7bad8d", "#ffb158", "#f77f45", "#c2454e"],

            ["#0b0d0e", "#137074", "#7eb7a3", "#f1ddbb", "#ec6766"],

            ["#3fb8af", "#7fc7af", "#dad8a7", "#ffb38b", "#ff3f34"],

            ["#002a4a", "#17607d", "#fff1ce", "#ff9311", "#d64700"],

            ["#324759", "#f2d95c", "#f2ac57", "#f28d52", "#f25757"],

            ["#bf2431", "#f24150", "#2a4557", "#3b848c", "#eff2e4"],

            ["#e53481", "#fcb215", "#9ccb3b", "#25b0e6", "#8151a1"],

            ["#59323c", "#260126", "#f2eeb3", "#bfaf80", "#8c6954"],

            ["#7ac5df", "#ff5452", "#ebf7f8", "#9aa5b8", "#525c72"],

            ["#96ca2d", "#b5e655", "#f9fff2", "#4bb5c1", "#00191c"],

            ["#002e40", "#2a5769", "#ffffff", "#fabd4a", "#f09000"],

            ["#c7422f", "#e84c3d", "#1bb696", "#129078", "#2d3e50"],

            ["#002e40", "#306378", "#404040", "#fabd4a", "#fa9600"],

            ["#272d40", "#364659", "#55736d", "#9dbf8e", "#d0d991"],

            ["#012d3d", "#38ad9e", "#ffeb9e", "#ff6867", "#d0dbed"],

            ["#2d3340", "#5d768c", "#d9d3b8", "#bfae8e", "#8c7961"],

            ["#004466", "#126d9c", "#3a9dd1", "#65bee8", "#ace2ff"],

            ["#08afc7", "#adf7ff", "#fffef9", "#906a91", "#522554"],

            ["#1e446b", "#4e78a1", "#9fdaff", "#fff5eb", "#616c6e"],

            ["#195962", "#f56f6c", "#ffffff", "#252932", "#191c21"],

            ["#edfeff", "#4e8c77", "#b4da81", "#fffee9", "#b5e0cb"],

            ["#0e3559", "#027bbb", "#ffffff", "#e8560f", "#b31d10"],

            ["#df3d4a", "#61274b", "#52ebb9", "#51ab83", "#a0ae9c"],

            ["#5dbea9", "#efeddf", "#ef7247", "#4e3f35", "#d1cbba"],

            ["#d30027", "#fcfbe7", "#9fd3da", "#008c9a", "#05484f"],

            ["#371547", "#ed5715", "#a2c606", "#87025f", "#f9de19"],

            ["#449bb5", "#043d5d", "#eb5055", "#68c39f", "#fffcf5"],

            ["#3cb874", "#61d296", "#eaeff0", "#34465c", "#253342"],

            ["#382f27", "#4bad9b", "#d9aa33", "#e3e0c9", "#d93d31"],

            ["#590000", "#8c0000", "#fff7e3", "#807966", "#403533"],

            ["#75bfbf", "#e7f2d5", "#f2d852", "#f2ae30", "#f29422"],

            ["#e6e7e8", "#bad531", "#26a1d6", "#223032", "#000000"],

            ["#114a63", "#c7c2b2", "#478396", "#cee830", "#ffffff"],

            ["#0a111f", "#263248", "#7e8aa2", "#e3e3e3", "#a80b00"],

            ["#eb6e44", "#ffe69e", "#cfee7f", "#8dcdc1", "#4f4a47"],

            ["#fffed6", "#53eff0", "#8d5cd4", "#ff549d", "#ffcb28"],

            ["#2e4350", "#f55a42", "#ecf0f1", "#42b2e3", "#4766b5"],

            ["#2d2d3f", "#75a0a5", "#b8bf9e", "#bf9159", "#f2af5e"],

            ["#35c1cf", "#95e2e8", "#fdfffe", "#ffb12a", "#ff7211"],

            ["#101e26", "#f2f2f2", "#8c8c88", "#f28c0f", "#f2790f"],

            ["#505050", "#129793", "#9bd7d5", "#ffeaab", "#ff7260"],

            ["#ffd5e4", "#ffc1af", "#ffded2", "#b0908b", "#daf5ef"],

            ["#043c4a", "#436873", "#e6e4e3", "#c96003", "#7d1b05"],

            ["#143840", "#177373", "#5ba691", "#96d9ad", "#cef2d7"],

            ["#073a59", "#2d9aa6", "#f2e2dc", "#f23322", "#a61b1b"],

            ["#a6032f", "#037e8c", "#f2efc2", "#f2ab27", "#f25e3d"],

            ["#2d5955", "#7ca68b", "#f2eeae", "#f2cda0", "#f29966"],

            ["#36413a", "#b5c00b", "#1c231e", "#ffffff", "#4c5b52"],

            ["#a6032f", "#037e8c", "#f2efc2", "#f2ab27", "#f25e3d"],

            ["#9bc92e", "#f1fbff", "#28333d", "#5a707a", "#a7bdc6"],

            ["#49bfa6", "#f2efa8", "#f2b431", "#6b432f", "#f2552b"],

            ["#88c95f", "#6aa15f", "#ffd135", "#382830", "#ff4834"],

            ["#9fa2a6", "#ebeef2", "#4f6273", "#4ed9bf", "#f25e5e"],

            ["#c0ae72", "#fcfbfa", "#c2daa6", "#779a91", "#3b404f"],

            ["#2f8a8a", "#f2ca04", "#d88e04", "#bf3503", "#721602"],

            ["#e02d03", "#eb5825", "#ffdeb4", "#ffffff", "#0f8dcc"],

            ["#d90718", "#242526", "#f2f2f2", "#848b8c", "#4f5859"],

            ["#f8bd00", "#ed4500", "#fcfbe5", "#d9224c", "#bbd400"],

            ["#98d3f5", "#cef0f7", "#ebfff1", "#ffe0c0", "#feb5a9"],

            ["#032429", "#134a46", "#377d6a", "#7ab893", "#b2e3af"],

            ["#1a402a", "#467339", "#75a644", "#a6d95b", "#edf2c9"],

            ["#223245", "#637792", "#6a8ea9", "#c6beb5", "#9a9187"],

            ["#607580", "#ffffff", "#c0eaff", "#4a6d80", "#9abbcc"],

            ["#2651a3", "#3b7fff", "#8ab33f", "#faa918", "#ee3c27"],

            ["#a20e30", "#e93c4f", "#dcdcd4", "#adbcc3", "#2d4255"],

            ["#00afef", "#58595b", "#808285", "#bcbec0", "#d1d3d4"],

            ["#049dd9", "#f2cb57", "#f29c50", "#f2783f", "#d93425"],

            ["#505050", "#129793", "#9bd7d5", "#ffeaab", "#ff7260"],

            ["#2c4259", "#9ed9d8", "#ede9f0", "#faf5f7", "#d4d0d1"]

        ]

    };
})(window.DataDoo);
