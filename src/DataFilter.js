//This module serves the purpose of creating and connecting a filterable dataset to datadoo.
//This will essentially be a wrapper around the MISO Dataset using the "where" option (http://misoproject.com/)

(function (DataDoo) {
    var DataFilter = function (/*datadooInstance*/ ddI, id, /*datasetInstance*/ dsI, /*columnName on which filter is to be applied*/ colName) {
        if (!ddI) {
            console.log("DataFilter : Could not find any DataDoo instance!");
            throw new Error("DataFilter : Could not find any DataDoo instance");
        }

        if (!id) {
            console.log("DataFilter : Could not find any id!");
            throw new Error("DataFilter : Could not find any id");
        }

        if (!dsI) {
            console.log("DataFilter : Could not find any parent DataSet object!");
            throw new Error("DataFilter : Could not find any parent DataSet object");
        }

        if(!dsI.fetched){dsI.fetch();}

        var uniqs = _.pluck(dsI.countBy(colName).toJSON(), colName) || [];

        if (uniqs.length === 0) {
            console.log("DataFilter : The supplied column does not have any data!");
            throw new Error("DataFilter : The supplied column does not have any data!");
        }


        var allCols = dsI.columnNames();
        var filteredCols = _.without(allCols, colName);
        var currentIndex = 0;

        var newDataFilter = {
            colName:colName,
            filter:null,
            uniqs:uniqs,
            currentIndex:currentIndex
        };

        newDataFilter.recompute = function () {
            if(!dsI.fetched){dsI.fetch();}

            newDataFilter.filter = dsI.where({
                columns:filteredCols,
                rows:function (row) {
                    return row[newDataFilter.colName] == newDataFilter.uniqs[newDataFilter.currentIndex];
                }
            });
        };

        newDataFilter.next = function () {
            if (newDataFilter.currentIndex < newDataFilter.uniqs.length - 1) {
                newDataFilter.currentIndex++;
            }
            else if (newDataFilter.currentIndex == newDataFilter.uniqs.length - 1) {
                newDataFilter.currentIndex = 0;
            }

            newDataFilter.recompute();
        };

        newDataFilter.previous = function () {
            if (newDataFilter.currentIndex > 0) {
                newDataFilter.currentIndex--;
            }
            else if (newDataFilter.currentIndex  === 0) {
                newDataFilter.currentIndex = newDataFilter.uniqs.length - 1;
            }

            newDataFilter.recompute();
        };

        newDataFilter.getCurrentState = function () {
            return newDataFilter.uniqs[newDataFilter.currentIndex];
        };

        newDataFilter.recompute();

        if (ddI[id]) {
            console.log("DataFilter : An entity with the same ID already exists!!");
            throw new Error("DataFilter : An entity with the same ID already exists");
        }

        if (ddI.bucket[id]) {
            console.log("DataSet : The bucket has an entity reference with the same ID already! Internal Error!");
            throw new Error("DataSet : The bucket has an entity reference with the same ID already! Internal Error");
        }
        ddI[id] = newDataFilter;
        ddI.bucket[id] = ddI[id];

        newDataFilter.filter.subscribe("change", function (e) {
            ddI.eventBus.enqueue(0, "DATA......", newDataFilter, []);
        });

        //Listen to the parent dataset's reset event and then recompute yourself!
        //Miso somehow does not do this! Weird!
        dsI.subscribe("reset", function(){
            newDataFilter.recompute();
            ddI.eventBus.enqueue(0, "DATA.RESET", newDataFilter, []);
        });


        return newDataFilter;

    };

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
     * http://misoproject.com/dataset/api.html#misodatasetdataview
     */

    DataDoo.DataFilter = DataFilter;

})(window.DataDoo);

