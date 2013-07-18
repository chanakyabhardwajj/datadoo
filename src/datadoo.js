window.DataDoo = (function() {
    function EventBus() {
        this.queue = [];
        this.listeners = {};
    }
    EventBus.prototype.enqueue = function(priority, eventName, creator, data) {
        this.queue.push({
            priority: priority,
            eventName: eventName,
            creator: creator,
            data: data
        });
        // TODO: do queue sorting magic
    };
    EventBus.prototype.subscribe = function(creator, eventName, callback) {
        if(!this.listeners[creator]) {
            this.listeners[creator] = {};
        }
        if(!this.listeners[creator][eventName]) {
            this.listeners[creator][eventName] = [];
        }
        this.listeners[creator][eventName].push(callback);
    };
    EventBus.prototype.fireTillEmpty = function() {
        while(this.queue.length > 0) {
            var event = this.queue.shift();
            var callbacks = this.listeners[event.creator][event.eventName];
            _.each(callbacks, function(callback) {
                callback(event.data);
            });
        }
    };

    function DataDoo(params) {
        params = _.defaults(params, {}); // TODO: add default options

        // initialize global eventbus and bucket
        this.eventBus = new EventBus();
        this.bucket = {};

        // create three.js stuff
        this.scene = new THREE.Scene();
        this.camera = new THREE.camera(); // TODO: write camera stuff
        this.renderer = new THREE.WebGLRenderer(params.canvas);
    }

    /**
     * Starts the visualization render loop
     */
    DataDoo.prototype.startVis = function() {
        var self = this;
        function renderFrame() {
            requestAnimationFrame(renderFrame);

            // we clear the eventbus, to make sure all the components have run
            self.eventBus.fireTillEmpty();

            // render the frame
            self.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(renderFrame);
    }

    // Request animationframe helper
    var requestAnimationFrame = (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            return window.setTimeout(callback, 1000 / 60);
        }
    );
});
