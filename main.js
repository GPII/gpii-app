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
"use strict";

var fluid = require("infusion"),
    app = require("electron").app,
    gpii = fluid.registerNamespace("gpii"),
    kettle = fluid.registerNamespace("kettle");

require("universal");

// Check that we are not running another instance of GPII-App.
const appIsRunning = app.makeSingleInstance((commandLine, workingDirectory) => {
    // TODO: Properly log or handle it.
    console.log("A second instance of GPII-App tried to be executed.")
});
// Check if any instance of GPII is running.
const gpiiIsRunning = !gpii.singleInstance.registerInstance();
if (appIsRunning || gpiiIsRunning) {
    app.quit();
}

require("gpii-windows/index.js");
require("./src/logging.js");
require("./src/app.js");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", function () {
    kettle.config.loadConfig({
        configName: kettle.config.getConfigName("app"),
        configPath: kettle.config.getConfigPath(__dirname + "/configs")
    });
});
