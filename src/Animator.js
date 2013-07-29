(function(DataDoo) {
    function Animator(dd, id, inputs, appFn, timeout) {
        this.dd = dd;
        this.id = id;
        this.appFn = appFn;
        this.inputs = inputs;

        if(!_.isUndefined(timeout)) {
            inputs.push(new DataDoo.Timer(dd, this.id + "_timer", timeout));
        }
        
        _.each(inputs, function(input) {
            dd.eventBus.subscribe(this, input);
        }, this);
    }
    DataDoo.Animator = Animator;
    Animator.prototype.collapseEvents = true;
    Animator.prototype.priority = 4;
    Animator.prototype.handler = function(events) {
        var timerEvent = _.find(events, function(event) {
            return event.eventName == "TIMER.FIRE";
        });
        if(timerEvent) {
            var timerData = timerEvent.data;
            var result = this.appFn(this.dd.bucket, timerData.time, timerData.delta, timerData.elapsedTime);
            this.dd.eventBus.enqueue(this, "ANIMATOR.ANIMATED", result);
        } else {
            this.dd.eventBus.enqueue(this, "ANIMATOR.PASSTHRU");
        }
    };
})(window.DataDoo);
