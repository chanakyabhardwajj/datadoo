window.DataDoo = (function() {

    /**
     * Main DataDoo class 
     */
    function DataDoo(params) {
        _.defaults(params, {
            camera: {}
        });
        _.defaults(params.camera, {
            type: DataDoo.PERSPECTIVE,
            viewAngle: 45,
            near: 0.1,
            far: 20000
        });

        // initialize global eventbus and bucket
        this.eventBus = new EventBus();
        this.bucket = {};

        // create three.js stuff
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({canvas: params.canvas});
        switch(params.camera.type) {
            case DataDoo.PERSPECTIVE:
                var canvas = this.renderer.domElement;
                this.camera = new THREE.PerspectiveCamera(params.camera.viewAngle,
                                                          canvas.innerWidth/canvas.innerHeight,
                                                          params.camera.near,
                                                          params.camera.far);
                break;
            default:
                throw new Error("DataDoo : unknown camera type");
        }
    }
    /**
     * Sets the size of the canvas
     */
    DataDoo.prototype.setSize = function(width, height) {
        this.renderer.setSize(width, height);
        if(this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = width/height;
        }
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

    /**
     * DataDoo constants TODO: move to separate file
     */
    DataDoo.PERSPECTIVE = 1;

    /**
     * DataDoo's special priority event bus for propagating
     * changes in the object hierarchy
     */
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
        this.queue = _.sortBy(this.queue, "priority");
    };
    EventBus.prototype.subscribe = function(creator, eventName, callback, context) {
        if(!this.listeners[creator]) {
            this.listeners[creator] = {};
        }
        if(!this.listeners[creator][eventName]) {
            this.listeners[creator][eventName] = [];
        }
        this.listeners[creator][eventName].push([callback, context]);
    };
    EventBus.prototype.fireTillEmpty = function() {
        while(this.queue.length > 0) {
            var event = this.queue.shift();
            var callbacks = this.listeners[event.creator][event.eventName];
            _.each(callbacks, function(callback) {
                if(callback[1]) {
                    // call with context if provided
                    callback[0].call(callback[1], event.data);
                } else {
                    callback[0](event.data);
                }
            });
        }
    };

    // Request animationframe helper
    var requestAnimationFrame = (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            return window.setTimeout(callback, 1000 / 60);
        }
    );

    return DataDoo;
});
