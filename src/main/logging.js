/*!
GPII Application Logging
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";

var fs = require("fs");
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

var settingsDirComponent = gpii.settingsDir();
var gpiiSettingsDir = settingsDirComponent.getGpiiSettingsDir();

var startupTime = Date.now();
var logFileName = gpiiSettingsDir + "/log-" + gpii.journal.formatTimestamp(startupTime) + ".txt";

// Increase this limit to produce more verbose logs to aid debugging
fluid.logObjectRenderChars = 10240;

// Monkey-patch the core Infusion "doLog" implementation https://github.com/fluid-project/infusion/blob/master/src/framework/core/js/Fluid.js#L279
// Already monkey-patched once at https://github.com/fluid-project/infusion/blob/master/src/module/fluid.js#L161

fluid.doLog = function (args) {
    args = fluid.transform(args, fluid.renderLoggingArg);
    fs.appendFileSync(logFileName, args.join("") + "\n");
};
