//This module serves the purpose of creating and connecting data-streams to datadoo.
//This will essentially be a very light wrapper around the MISO Dataset (http://misoproject.com/)

(function(DataDoo){
    var DataSet = function(/*datadooInstance*/ ddI, /*array of dataset configurations*/ configArr){
        if(!ddI){
            console.log("DataSet : Could not find any DataDoo instance!");
            return;
        }

        if(!configArr || configArr.length==0){
            console.log("DataSet : Could not find any configuration object!");
            return;
        }

        _.each(configArr, function(config){
            /*
            config object should have a name property: {name : "String"}
            Refer here for further supported options : http://misoproject.com/dataset/api.html#misodataset_constructor
            */
            var newDataSet = new Miso.Dataset(config);
            if(newDataSet){
                ddI[config.name || Date.now()] = newDataSet;
            }
            else{
                console.log("DataSet : Could not create the Miso Dataset. Details of the failed configuration below : ");
                console.log(config);
            }
        })

    };

    DataSet.prototype.fetch = function(dataset){
        dataset.fetch({
            success: function() {
                console.log( "DataSet : Successfully fetched the dataset : " + dataset );
            },

            error: function() {
                console.log( "DataSet : Error fetching the dataset : " + dataset );
            }
        });
    }

    DataSet.prototype.reset = function(dataset){
        dataset.reset();
    }

    DataSet.prototype.add = function(dataset, row){
        dataset.add(row);
    }

    DataSet.prototype.remove = function(dataset, filterFn){
        dataset.remove(filterFn);
    }

    DataSet.prototype.update = function(dataset, options){
        dataset.update(options);
    }

    /*Other methods that will be available (by inheritance) on the DataSet instance can be found here:
    * http://misoproject.com/dataset/api.html#misodatasetdataview
    */

    DataDoo.prototype.DataSet = function(/*array of dataset configurations*/ configArr){
        return new DataSet(this, configArr);
    }

})(window.DataDoo)