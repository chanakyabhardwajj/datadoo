//This is the dataset for DataDoo. Think of this as the tables or database that hold your data, locally.
//This class is essentially a wrapper around Miso Dataset. I did not want to have a hard dependency on Miso.
(function(DataDoo){
    function Dataset(config){
        Miso.Dataset.call(this, config);

        //Make the syncing mandatory!!
        this.sync = true;

        //The following is the builder function.
        //The builder function runs for each and every data-point/cell
        //and generates/builds the shape that you want.
        //This function is supposed to be overwritten by every instance.
        this.builder = function(){};
    }

    Dataset.prototype = new Miso.Dataset();
    Dataset.prototype.constructor = Dataset;

    DataDoo.Dataset = Dataset;

})(window.DataDoo);