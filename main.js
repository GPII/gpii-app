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

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var app = require("electron").app;
require("./src/app.js");


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", function () {
    gpii.taskTray();

});
