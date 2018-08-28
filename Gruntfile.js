"use strict";

module.exports = function (grunt) {
    grunt.initConfig({
        lintAll: {
            sources: {
                md: [ "./*.md","./documentation/*.md", "./examples/**/*.md"],
                js: ["src/**/*.js", "tests/**/*.js", "examples/**/*.js", "*.js"],
                json: ["src/**/*.json", "tests/**/*.json", "testData/**/*.json", "configs/**/*.json", "*.json"],
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
                messageCompilerPath: "./messageBundlesCompiler.js",
                messagesDirs: ["./messageBundles"],
                resultFilePath: "./build/gpii-app-messageBundles.json"
            }
        }
    });

    grunt.loadNpmTasks("gpii-grunt-lint-all");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Perform all standard lint checks.", ["lint-all"]);


    grunt.registerMultiTask("compileMessages", function () {
        var compileMessageBundles = require(this.data.messageCompilerPath).compileMessageBundles;

        var compiledMessageBundles = compileMessageBundles(this.data.messagesDirs, "en", {"json": JSON});

        grunt.file.write(this.data.resultFilePath, JSON.stringify(compiledMessageBundles, null, 4));
    });
};
