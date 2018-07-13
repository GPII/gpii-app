/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
require("gpii-testem");

gpii.testem.instrumenter.runner({
    inputPath: "%gpii-app/",
    outputPath: "%gpii-app/instrumented",
    sources: ["./*.js", "./src/*.js", "./src/**/*.js"],
    excludes: ["./.git/**/*", "./reports/**/*", "./coverage/**/*", "./.idea/**/*", "./.vagrant/**/*", "./instrumented/**/*"],
    nonSources: [
        "./*.!(js)",
        "./**/*.!(js)",
        "./!(node_modules)/*.!(js)",
        "./Gruntfile.js",
        "./node_modules/infusion/dist/infusion-all.js",
        "./node_modules/infusion/src/components/switch/js/Switch.js",
        "./node_modules/infusion/src/components/textfieldControl/js/Textfield.js",
        "./node_modules/infusion/src/components/textfieldControl/js/TextfieldSlider.js",
        "./node_modules/infusion/src/components/textfieldControl/js/TextfieldStepper.js",
        "./node_modules/infusion/src/framework/core/js/DataBinding.js",
        "./node_modules/infusion/src/framework/core/js/Fluid.js",
        "./node_modules/infusion/src/framework/core/js/FluidDOMUtilities.js",
        "./node_modules/infusion/src/framework/core/js/FluidDebugging.js",
        "./node_modules/infusion/src/framework/core/js/FluidDocument.js",
        "./node_modules/infusion/src/framework/core/js/FluidIoC.js",
        "./node_modules/infusion/src/framework/core/js/FluidRequests.js",
        "./node_modules/infusion/src/framework/core/js/FluidView.js",
        "./node_modules/infusion/src/framework/core/js/JavaProperties.js",
        "./node_modules/infusion/src/framework/core/js/ModelTransformation.js",
        "./node_modules/infusion/src/framework/core/js/ModelTransformationTransforms.js",
        "./node_modules/infusion/src/framework/core/js/ResourceLoader.js",
        "./node_modules/infusion/src/framework/core/js/jquery.keyboard-a11y.js",
        "./node_modules/infusion/src/framework/enhancement/js/ContextAwareness.js",
        "./node_modules/infusion/src/framework/renderer/js/RendererUtilities.js",
        "./node_modules/infusion/src/framework/renderer/js/fluidParser.js",
        "./node_modules/infusion/src/framework/renderer/js/fluidRenderer.js",
        "./node_modules/infusion/src/lib/fastXmlPull/js/fastXmlPull.js",
        "./node_modules/infusion/src/lib/jquery/core/js/jquery.js",
        "./node_modules/infusion/src/lib/jquery/ui/js/jquery-ui.js",
        "./node_modules/infusion/tests/lib/qunit/css/qunit.css",
        "./node_modules/infusion/tests/lib/qunit/js/qunit.js",
        "./node_modules/infusion/tests/test-core/jqUnit/js/jqUnit-browser.js",
        "./node_modules/infusion/tests/test-core/jqUnit/js/jqUnit.js",
        "./node_modules/infusion/tests/test-core/utils/js/IoCTestUtils.js",
        "./node_modules/winstrap/dist/css/winstrap.min.css",
        "./node_modules/winstrap/dist/js/vendor/bootstrap.min.js",
        "./provisioning/*",
        "./tests.js",
        "./tests/**/*",
        "./tests/*"
    ]
});
