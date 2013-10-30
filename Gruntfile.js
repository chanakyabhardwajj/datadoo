module.exports = function (grunt) {
    grunt.initConfig({
        jshint : {
            files : ["Gruntfile.js", "src/**/*.js", "!src/vendor/**"],
            options : {
                globals : {
                    datadoo : true
                }
            }
        },

        concat : {
            datadoo : {
                files : {
                    'build/datadoo.js' : [
                        'src/Three.OrbitControls.js', //CameraControls have been moved out of the main threejs repo. Have to include it manually.
                        'src/DataDoo.js',
                        'src/Dataset.js',
                        'src/AxesHelper.js',
                        'src/GridHelper.js',
                        /*'src/Primitives/Primitive.js',
                        'src/Primitives/Line.js',*/
                        'src/Label.js'
                    ],
                    'build/vendor.js' : [
                        'src/vendor/three.js/index.js',
                        'src/vendor/jquery/jquery.js',
                        'src/vendor/underscore/underscore.js',
                        'src/vendor/miso.dataset/dist/miso.ds.deps.0.4.0.js',
                        'src/vendor/momentjs/moment.js'

                    ]
                },

                options : {
                    stripBanners : true
                }
            }
        },

        watch : {
            options : { livereload : true },
            scripts : {
                files : ["examples/*.html", "src/**/*.js"],
                tasks : ['default']
            }
        },

        uglify : {
            dist : {
                files : {
                    "dist/vendor.min.js" : "build/vendor.js",
                    "dist/datadoo.min.js" : "build/datadoo.js"
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask('default', ['jshint', 'concat']);
    grunt.registerTask('w', ['jshint', 'concat', 'watch']);
    grunt.registerTask("dist", ["default", "uglify"]);
};
