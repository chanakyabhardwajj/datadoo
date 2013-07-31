(function(DataDoo) {
    _.extend(DataDoo, {
        // camera type
        PERSPECTIVE : 1,
        ORTHOGRAPHIC : 1.1,

        // position types
        ABSOLUTE : 2,
        RELATIVE : 3,
        COSY : 4,

        // Axis types
        COLUMNVALUE: 5,
        NUMBER: 6,

        // sort order
        ASCENDING: 7,
        DESCENDING: 8,

        // coordinate system types
        CARTESIAN: 9,
        SPHERICAL: 10
    });
})(window.DataDoo);
