(function(DataDoo) {
    function Animator(dd, id, inputs, appFn, timer) {
        this.dd = dd;
        this.id = id;
        
        _.each(inputs, function(input) {
            dd.eventBus.subscribe(this, input);
        });
    }
    DataDoo.Animator = Animator;
    Animator.prototype.collapseEvents = true;
    Animator.prototype.priority = 4;
})(window.DataDoo);
