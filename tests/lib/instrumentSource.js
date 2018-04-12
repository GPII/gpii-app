/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
require("gpii-testem");

gpii.testem.instrumenter.runner({
    inputPath: "%gpii-app/",
    outputPath: "%gpii-app/instrumented",
    sources:    ["./*.js", "./src/*.js", "./src/**/*.js"],
    excludes:   ["./node_modules/**/*", "./.git/**/*", "./reports/**/*", "./coverage/**/*", "./.idea/**/*", "./.vagrant/**/*", "./instrumented/**/*"],
    nonSources: ["./*.!(js)", "./**/*.!(js)", "./Gruntfile.js", "./tests.js", "./tests/**/*", "./tests/*", "./provisioning/*"]
});