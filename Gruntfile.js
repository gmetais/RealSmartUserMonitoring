var path = require("path");

module.exports = function(grunt) {
    'use strict';

    // Load every grunt module. No need to add it manually.
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
    
        jshint: {
            all: [
                'Gruntfile.js',
                'client/src/*.js',
                'server/**/*.js'
            ]
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            build: ['client/build']
        },

        express: {
            server: {
                options: {
                    server: path.resolve(__dirname, 'server/server.js'),
                    port: 8383,
                    serverreload: true,
                    showStack: true
                }
            }
        }

    });

    grunt.registerTask('build', [
        'clean',
        'jshint'
    ]);

    grunt.registerTask('server', [
        'express'
    ]);

};