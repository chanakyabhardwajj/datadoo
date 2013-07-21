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
    RelationGenerator.prototype.handler = function(/*array*/ events) {
        console.log("RelationGenerator" + this.id +": Received An Event");

        this.deleteRelations();
        this.generateRelations();
        this.dd.eventBus.enqueue(this, "RELATION.UPDATE", this.relations);
    };

    RelationGenerator.prototype.deleteRelations = function() {
        this.relations = [];
    };

    RelationGenerator.prototype.generateRelations = function() {
        this.relations = this.appFn.call(this.dd.bucket);
    };

    DataDoo.RelationGenerator = RelationGenerator;
})(window.DataDoo);
