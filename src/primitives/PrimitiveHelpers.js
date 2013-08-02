(function(DataDoo) {

    /**
     * Primitive constructor helper mixin
     */
    DataDoo.PrimitiveHelpers = _.chain(DataDoo).pairs().filter(function (pair) {
        // filter out Primitive constructor classes from DataDoo
        return _.isFunction(pair[1]) && ("setDirection" in pair[1].prototype) && (pair[0] != "Primitive");
    }).map(function(pair) {
        var className = pair[0];
        var primClass = pair[1];
        return ["add" + className, function() {
            var args = arguments;
            var F = function() {
                return primClass.apply(this, args);
            };
            F.prototype = primClass.prototype;
            var primitive = new F();
            primitive.constructor = primClass;
            this.add(primitive);
            return primitive;
        }];
    }).object().value();
    
})(window.DataDoo);
