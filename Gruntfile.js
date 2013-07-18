module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            files: ["Gruntfile.js", "src/**/*.js"],
            options: {
                globals: {
                    datadoo: true
                }
            }
        },

        concat: {
            datadoo: {
                files: {
                    'build/vendor.js': ['src/lib/*.js'],
                    'build/datadoo.js': ['src/*.js']
                },

                options: {
                    stripBanners: true
                }
            }
        },

        watch: {
            scripts: {
                files: ["src/**/*.js"],
                tasks: ["default"]
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
    grunt.registerTask("dist", ["default", "uglify"]);
};