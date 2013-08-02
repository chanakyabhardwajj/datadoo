(function(DataDoo) {

    /**
     *  Sprite primitive
     */
    function Sprite(url, scale) {
        DataDoo.Primitive.call(this);
        this.map = THREE.ImageUtils.loadTexture(url);
        this.scale = scale;
        this.material = new THREE.SpriteMaterial({ map : this.map, useScreenCoordinates : false, color : 0xffffff, fog : true });
        this.sprite = new THREE.Sprite(this.material);
        this.sprite.scale.x = this.sprite.scale.y = this.sprite.scale.z = this.scale;
        this.add(this.sprite);
    }

    Sprite.prototype = Object.create(DataDoo.Primitive.prototype);

    DataDoo.Sprite = Sprite;

})(window.DataDoo);
