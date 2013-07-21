(function(DataDoo) {
    /**
     *  RelationGenerator class generates relations between nodes
     */
    function RelationGenerator(dd, id, /*array of nodeGenerators*/  ngs, appFn) {
        this.dd = dd;
        this.id = id;
        this.ngs = ngs;
        this.relations = [];
        this.appFn = appFn;

        // put the nodes array
        if(dd.bucket[id]) {
            throw new Error("RelationGenerator : id '"+id+"' already used");
        } else {
            dd.bucket[id] = this.relations;
        }

        var that = this;
        _.each(ngs, function(ng){
            dd.eventBus.subscribe(that, ng);
        });
    }

    RelationGenerator.prototype.collapseEvents = true;
    RelationGenerator.prototype.priority = 3;
    RelationGenerator.prototype.handler = function(event) {
        switch(event.eventName) {
            case "NODE.ADD":
                console.log("RelationGenerator" + id +": Received NODE.ADD");
                this.generateRelations();
                this.dd.eventBus.enqueue(this, "RELATION.UPDATE", this.relations);
                break;
            case "NODE.DELETE":
                console.log("RelationGenerator" + id +": Received NODE.DELETE");
                this.generateRelations();
                this.dd.eventBus.enqueue(this, "RELATION.UPDATE", this.relations);
                break;
            case "NODE.UPDATE":
                console.log("RelationGenerator" + id +": Received NODE.UPDATE");
                this.generateRelations();
                this.dd.eventBus.enqueue(this, "RELATION.UPDATE", this.relations);
                break;
            default:
                throw new Error("RelationGenerator : Unknown event fired : " + event.toString());
        }
    };

    RelationGenerator.prototype.generateRelations = function() {
        this.relations = [];
        var relns = this.appFn.call(this.ngs);
        this.relations = relns;
    };

    DataDoo.RelationGenerator = RelationGenerator;
})(window.DataDoo);
