(function (DataDoo) {
    function Label(message, posn3D, ddInstance) {
        THREE.Object3D.call(this, message, posn3D, ddInstance);

        //Trick borrowed from MathBox!
        var element = document.createElement('div');
        var inner = document.createElement('div');
        element.appendChild(inner);

        // Position at anchor point
        element.className = 'datadoo-label';
        inner.className = 'datadoo-wrap';
        inner.style.position = 'relative';
        inner.style.display = 'inline-block';
        /*inner.style.fontSize = '11px';*/
        inner.style.left = '-50%';
        inner.style.top = '-.5em';
        inner.style.padding = "5px";
        inner.style.backgroundColor = "transparent";
        inner.style.border = "1px dashed silver";


        element.style.display = 'none'; // start as hidden. made visible only when position is set
        element.style.position = 'absolute';
        element.style.fontSize = '11px';
        element.style.width = message.length * parseInt(this.fontSize, 10) + 10 + "px";
        element.style.left = 0;
        element.style.top = 0;
        element.style.opacity=1;
        element.style.zIndex=1;

        this.message = (message).toString() || "empty label";
        inner.appendChild(document.createTextNode(this.message));

        this.inner = inner;
        this.element = element;


        //The following position property refers to the 3d point in the scene, to which the html-label is supposed to be attached.
        //The html-label's cordinates are calculated from it (by unprojection algo).
        this.position = posn3D || new THREE.Vector3(0,0,0);

        this.type = "label";
        ddInstance._labelsDom.appendChild(element);

        //internal
        this._posX=0;
        this._posY=0;
        this._width=0;
        this._height=0;
        this._distance = 0;
        this._zIndex = 1;
        this.visible = true;

        ddInstance._labels.push(this);
    }

    Label.prototype = new THREE.Object3D();
    Label.prototype.constructor = Label;

    DataDoo.Label = Label;

    Label.prototype.hide = function () {
        this.element.style.display = "none";
        this.visible = false;
    };

    Label.prototype.show = function () {
        this.element.style.display = "block";
        this.visible = true;
    };

    Label.prototype.update = function (pos, op, z, fsize, rotAngle) {
        this.element.style.top = pos.top + "px";
        this.element.style.left = pos.left + "px";
        this.element.style.opacity = op;
        this.element.style.zIndex = z;
        this.element.style.fontSize = fsize;

        /*$(this.element).css({
            "webkitTransform":"rotate(" + rotAngle + "deg)",
            "MozTransform":"rotate(" + rotAngle + "deg)",
            "transform":"rotate(" + rotAngle + "deg)"
        });*/
    };


})(window.DataDoo);
