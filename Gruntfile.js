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
                messageCompilerPath: "./src/messageBundles/messageBundlesCompiler.js",
                messageBundlesTemplatePath: "./src/messageBundles/gpii-app-messageBundles_all.js.tpl",
                messagesPath: "./src/messageBundles",
                resultFilePath: "./build/gpii-app-messageBundles_compiled.js"
            }
        }
    });

    grunt.loadNpmTasks("fluid-grunt-eslint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Run eslint and jsonlint", ["eslint", "jsonlint"]);


    grunt.registerMultiTask("compileMessages", function () {
        var buildMessageBundles = require(this.data.messageCompilerPath).buildMessageBundles;

        var compiledMessageBundles = buildMessageBundles(this.data.messagesPath, "json", JSON, "en");


        var template = grunt.template.process(
            grunt.file.read(this.data.messageBundlesTemplatePath),
            {
                data: {
                    compiledMessageBundles: JSON.stringify(compiledMessageBundles)
                }
            });

        grunt.file.write(this.data.resultFilePath, template);
    });
};
