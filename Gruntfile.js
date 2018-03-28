"use strict";

module.exports = function (grunt) {

    grunt.initConfig({
        eslint: {
            all: ["*.js", "src/**/*.js", "tests/**/*.js"]
        },
        jsonlint: {
            all: [".eslintrc.json", "package.json", "configs/**/*.json", "src/**/*.json", "tests/**/*.json"]
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
                messageCompilerPath: "./src/common/messageBundlesCompiler.js",
                messagesDirs: ["./src/messageBundles"],
                resultFilePath: "./build/gpii-app-messageBundles.json"
            }
        }
    });

    grunt.loadNpmTasks("fluid-grunt-eslint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Run eslint and jsonlint", ["eslint", "jsonlint"]);


    grunt.registerMultiTask("compileMessages", function () {
        var compileMessageBundles = require(this.data.messageCompilerPath).compileMessageBundles;

        var compiledMessageBundles = compileMessageBundles(this.data.messagesDirs, "en", "json", JSON);

        grunt.file.write(this.data.resultFilePath, JSON.stringify(compiledMessageBundles, null, 4));
    });
};
