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
        requestAnimationFrame : (
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            }
        )
    };
})(window.DataDoo);
