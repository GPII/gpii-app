/*!
GPII Electron
Copyright 2016 Steven Githens
Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
/* eslint-env node */
"use strict";

var fluid = require("infusion"),
    app = require("electron").app,
    gpii = fluid.registerNamespace("gpii"),
    kettle = fluid.registerNamespace("kettle");

require("universal");

// Check that we are not running another instance of GPII-App.
var appIsRunning = app.makeSingleInstance(function (/*commandLine, workingDirectory*/) {
    // TODO: Properly log or handle it.
    console.log("Attempt to start a second instance of GPII-App failed.");
});
// Check if any instance of GPII is running.
var gpiiIsRunning = !gpii.singleInstance.registerInstance();
if (appIsRunning || gpiiIsRunning) {
    app.quit();
}

require("gpii-windows/index.js");
require("./src/main/logging.js");
require("./src/main/app.js");

kettle.config.loadConfig({
    configName: kettle.config.getConfigName("app.testing"),
    configPath: kettle.config.getConfigPath(fluid.module.terms()["gpii-app"] + "/configs")
});
