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
        }
    };
})(window.DataDoo);
