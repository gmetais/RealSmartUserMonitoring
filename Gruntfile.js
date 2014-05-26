var path = require("path");

module.exports = function(grunt) {
    'use strict';

    // Load every grunt module. No need to add it manually.
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
    
        jshint: {
            all: [
                'Gruntfile.js',
                'client/src/*.js',
                'lib/**/*.js'
            ]
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            build: ['client/build']
        },

        uglify: {
            client: {
                files: {
                    'client/build/rsum.min.js': ['client/src/rsum.js']
                }
            },
            options: {
                banner: '/* RealSmartUserMonitoring <%= pkg.version %> http://github.com/gmetais/RealSmartUserMonitoring */\n'
            }
        },

        express: {
            server: {
                options: {
                    server: path.resolve(__dirname, 'server.js'),
                    port: 8383,
                    serverreload: true,
                    showStack: true
                }
            }
        },

        mocha_phantomjs: {
            all: ['test/client/*.html']
        }

    });

    grunt.registerTask('build', [
        'clean',
        'jshint',
        'uglify'
    ]);

    grunt.registerTask('test', [
        'mocha_phantomjs'
    ]);

    grunt.registerTask('server', [
        'express'
    ]);

};