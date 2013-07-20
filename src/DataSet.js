//This module serves the purpose of creating and connecting data-streams to datadoo.
//This will essentially be a very light wrapper around the MISO Dataset (http://misoproject.com/)

(function (DataDoo) {
    var DataSet = function (/*datadooInstance*/ ddI, id, configObj) {
        if (!ddI) {
            console.log("DataSet : Could not find any DataDoo instance!");
            return;
        }

        if (!id) {
            console.log("DataSet : Could not find any id!");
            return;
        }

        if (!configObj) {
            console.log("DataSet : Could not find any configuration object!");
            return;
        }

        //Force the syncing to be true. Miso does not allow to make an instantiated dataset syncable later on.
        configObj.sync = true;

        var newDataSet = new Miso.Dataset(configObj);
        if (newDataSet) {
            if (ddI[id]) {
                console.log("DataSet : A dataset with the same ID already exists!!");
                return;
            }
            if (ddI.bucket[id]) {
                console.log("DataSet : The bucket has a dataset reference with the same ID already! Internal Error!");
                return;
            }

            ddI[id] = newDataSet;
            ddI.bucket[id] = ddI[id];


            //Events for the dataset
            newDataSet.subscribe("add", function (event) {
                ddI.eventBus.enqueue(0, "DATA.ADD", newDataSet, _.map(event.deltas, function (obj) {
                    return obj.changed;
                }))
            });

            newDataSet.subscribe("update", function (e) {
                var updatedRows = [];
                _.each(e.deltas, function(delta){
                    console.log("delta " + delta._id);
                    _.each(e.dataset, function(drow){
                        if(drow._id == delta._id){
                            updatedRows.push(drow)
                        }
                    })
                });
                ddI.eventBus.enqueue(0, "DATA.UPDATE", newDataSet, updatedRows)
            });

            newDataSet.subscribe("remove", function (event) {
                ddI.eventBus.enqueue(0, "DATA.DELETE", newDataSet, _.map(event.deltas, function (obj) {
                    return obj.old;
                }))
            });

            newDataSet.subscribe("reset", function (event) {
                ddI.eventBus.enqueue(0, "DATA.RESET", newDataSet, [])
            });

            return newDataSet;
        }
        else {
            console.log("DataSet : Could not create the Miso Dataset. Details of the failed configuration below : ");
            console.log(config);
        }
    };

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
     * http://misoproject.com/dataset/api.html#misodatasetdataview
     */

    DataDoo.prototype.DataSet = function (id, configObj) {
        return new DataSet(this, id, configObj);
    }

})(window.DataDoo);

/*
var ds = new Miso.Dataset({
    data: [
        { year : 1971, pop : 4000000, gdp : 7 },
        { year : 1972, pop : 5000000, gdp : 6 },
        { year : 1973, pop : 6000000, gdp : 5 }
    ]
});*/
