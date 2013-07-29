(function(DataDoo) {
    function Timer(dd, id, timeout) {
        this.timeout = Math.max(timeout || 0, 1/60);
        this.id = id;
        this.oldTime = 0;
        this.elapsedTime = 0;
        this.started = false;
        this.dd = dd;
        dd.timers.push(this);
    }
    DataDoo.Timer = Timer;
    Timer.prototype.tick = function() {
        if(!this.started) {
            this.oldTime = DataDoo.utils.performanceNow();
            this.started = true;
        }
        var newTime = DataDoo.utils.performanceNow();
        var diff = 0.001 * (newTime - this.oldTime);
        this.elapsedTime += diff;
        if(diff > this.timeout) {
            this.oldTime = newTime;
            this.dd.eventBus.enqueue(this, "TIMER.FIRE", {
                time: newTime,
                delta: diff,
                elapsedTime: this.elapsedTime,
            });
        }
    };
})(window.DataDoo);
