module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            files: ["Gruntfile.js", "src/**/*.js", "!src/libs/**"],
            options: {
                globals: {
                    datadoo: true
                }
            }
        },

        concat: {
            datadoo: {
                files: {
                    'build/datadoo.js': [
                        'src/DataDoo.js',
                        'src/Eventbus.js',
                        'src/Constants.js',
                        'src/Utils.js',
                        'src/DDObject3D.js',
                        'src/DataSet.js',
                        'src/DataFilter.js',
                        'src/Position.js',
                        'src/Primitives.js',
                        'src/Relation.js',
                        'src/RelationGenerator.js',
                        'src/NodeGenerator.js',
                        'src/Timer.js',
                        'src/Animator.js',
                        'src/AxesHelper.js'

                    ],
                    'build/vendor.js': [
                        'src/libs/components/jquery/jquery.js',
                        'src/libs/components/underscore/underscore.js',
                        'src/libs/components/miso.dataset/dist/miso.ds.deps.0.4.1.js',
                        'src/libs/components/moment/moment.js',
                        'src/libs/components/threejs/build/three.js',
                        'src/libs/components/threejs/examples/js/controls/OrbitControls.js',
                        'src/libs/components/threejs/examples/js/controls/TrackballControls.js'
                    ]
                },

                options: {
                    stripBanners: true
                }
            }
        },

        watch: {
            scripts: {
                files: "src/*.js",
                tasks: ['default']
            }
        },

        uglify: {
            dist: {
                files: {
                    "dist/vendor.min.js": "build/vendor.js",
                    "dist/datadoo.min.js": "build/datadoo.js"
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
