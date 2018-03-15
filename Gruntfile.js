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
        }
    });

    grunt.loadNpmTasks("fluid-grunt-eslint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Run eslint and jsonlint", ["eslint", "jsonlint"]);


    grunt.registerTask("compiledMessageBundles", function () {
        var buildMessageBundles = require("./src/messageBundles/messageBundlesCompiler.js").buildMessageBundles;

        var compiledMessageBundles = buildMessageBundles("./src/messageBundles", "json", JSON, "en");

        console.log(compiledMessageBundles);

        var template = grunt.template.process(
            grunt.file.read("./src/messageBundles/gpii-app-messageBundles_all.js.tpl"),
            {
                data: {
                    compiledMessageBundles: JSON.stringify(compiledMessageBundles)
                }
            });

        grunt.file.write("./src/messageBundles/gpii-app-messageBundles_compiled.js", template);
    });
};
