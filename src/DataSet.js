//This module serves the purpose of creating and connecting data-streams to datadoo.
//This will essentially be a very light wrapper around the MISO Dataset (http://misoproject.com/)

(function (DataDoo) {
    var DataSet = function (/*datadooInstance*/ ddI, id, configObj) {
        if (!ddI) {
            console.log("DataSet : Could not find any DataDoo instance!");
            throw new Error("DataSet : Could not find any DataDoo instance");
        }

        if (!id) {
            console.log("DataSet : Could not find any id!");
            throw new Error("DataSet : Could not find any id");
        }

        if (!configObj) {
            console.log("DataSet : Could not find any configuration object!");
            throw new Error("DataSet : Could not find any configuration object");
        }

        //Force the syncing to be true. Miso does not allow to make an instantiated dataset syncable later on.
        configObj.sync = true;
        configObj.resetOnFetch = true;

        var newDataSet = new Miso.Dataset(configObj);
        if (newDataSet) {
            if (ddI.bucket[id]) {
                console.log("DataSet : The bucket has a dataset reference with the same ID already! Internal Error!");
                throw new Error("DataSet : The bucket has a dataset reference with the same ID already! Internal Error");
            }

            ddI.bucket[id] = newDataSet;

            //Events for the dataset
            newDataSet.subscribe("change", function (event) {
                console.log('change happened');
                /*ddI.eventBus.enqueue(newDataSet, "DATA.ADD", _.map(event.deltas, function (obj) {
                    return obj.changed;
                }));*/
                console.log(event);
            });

            newDataSet.subscribe("add", function (event) {
                console.log('add fired');
                ddI.eventBus.enqueue(newDataSet, "DATA.ADD", _.map(event.deltas, function (obj) {
                    return obj.changed;
                }));
            });

            newDataSet.subscribe("update", function (e) {
                var updatedRows = [];
                _.each(e.deltas, function(delta){
                    console.log("delta " + delta._id);
                    _.each(e.dataset, function(drow){
                        if(drow._id == delta._id){
                            updatedRows.push(drow);
                        }
                    });
                });
                ddI.eventBus.enqueue(newDataSet, "DATA.UPDATE", updatedRows);
            });

            newDataSet.subscribe("remove", function (event) {
                ddI.eventBus.enqueue(newDataSet, "DATA.DELETE", _.map(event.deltas, function (obj) {
                    return obj.old;
                }));
            });

            newDataSet.subscribe("reset", function (event) {
                ddI.eventBus.enqueue(newDataSet, "DATA.RESET", []);
            });

            this.dataset = newDataSet;
            return this;
        }
        else {
            console.log("DataSet : Could not create the Miso Dataset. Details of the failed configuration below : ");
            console.log(config);
            throw new Error("DataSet : Could not create the Miso Dataset");
        }
    };

    DataSet.prototype.fetch = function(){
        this.dataset.fetch();
    };

    DataSet.prototype.toJSON = function(){
        this.dataset.toJSON();
    };

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
     * http://misoproject.com/dataset/api.html#misodatasetdataview
     */

    DataDoo.DataSet = DataSet;

})(window.DataDoo);
