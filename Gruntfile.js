"use strict";

module.exports = function (grunt) {
    grunt.initConfig({
        lintAll: {
            sources: {
                md: [ "./*.md","./documentation/*.md", "./examples/**/*.md"],
                js: ["src/**/*.js", "tests/**/*.js", "examples/**/*.js", "*.js"],
                json: ["src/**/*.json", "tests/**/*.json", "testData/**/*.json", "configs/**/*.json", "*.json", "!tests/fixtures/surveys/malformed_triggers.json"],
                json5: ["src/**/*.json5", "tests/**/*.json5", "testData/**/*.json5", "*.json5"],
                other: ["./.*"]
            }
        },
        shell: {
            options: {
                stdout: true,
                srderr: true,
                failOnError: true
            }
        },
        compileMessages: {
            defaults: {
                messagesDirs: [
                    "./messageBundles",
                    "%gpii-user-errors/bundles"
                ],
                messageCompilerPath: "./messageBundlesCompiler.js",
                resultFilePath: "./build/gpii-app-messageBundles.json"
            }
        }
    });

    grunt.loadNpmTasks("gpii-grunt-lint-all");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Perform all standard lint checks.", ["lint-all"]);


    /*
     * Generate "Mega" messages bundle out of all supplied message bundles. Bundles
     * are loaded from given directories.
     */
    grunt.registerMultiTask("compileMessages", "Generate i18n messages 'Mega' bundle", function () {
        // Get all possible paths
        require("gpii-universal");

        var compileMessageBundles = require(this.data.messageCompilerPath).compileMessageBundles;
        var compiledMessageBundles = compileMessageBundles(this.data.messagesDirs, "en", {"json": JSON, "json5": require("json5")});

        grunt.file.write(this.data.resultFilePath, JSON.stringify(compiledMessageBundles, null, 4));
    });
};
