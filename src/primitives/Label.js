(function(DataDoo) {
    /**
     *  Label primitive
     */
        //ToDo : Fix label toscreen coords for objects that are behind the camera!!
    function Label(message, labelPos) {
        DataDoo.Primitive.call(this);

        //Trick borrowed from MathBox!
        var element = document.createElement('div');
        var inner = document.createElement('div');
        element.appendChild(inner);

        // Position at anchor point
        element.className = 'datadoo-label';
        inner.className = 'datadoo-wrap';
        inner.style.position = 'relative';
        inner.style.display = 'inline-block';
        //inner.style.left = '-50%';
        //inner.style.top = '-.5em';

        this.message = (message).toString() || "empty label";
        this.element = element;
        this.width = 0;
        this.height = 0;
        this.visible = true;
        this.content = this.message;

        element.style.display = 'none'; // start as hidden. made visible only when position is set
        element.style.position = 'absolute';
        element.style.left = 0;
        element.style.top = 0;
        inner.appendChild(document.createTextNode(this.message));

        labelPos = labelPos || new DataDoo.RVector3(this);
        this.position = labelPos;

        document.body.appendChild(element);
    }

    Label.prototype = Object.create(DataDoo.Primitive.prototype);

    DataDoo.Label = Label;

    Label.prototype.hideElem = function() {
        this.element.style.display = "none";
    };

    Label.prototype.updateElemPos = function (top, left) {
        this.element.style.display = "block";
        this.element.style.top = top + "px";
        this.element.style.left = left + "px";
    };

})(window.DataDoo);
