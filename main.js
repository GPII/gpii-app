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

var dns = require("dns");
var lookupReal = dns.lookup;
dns.lookup = function lookup(hostname, options, callback) {
    if (hostname === "localhost") {
        hostname = "127.0.0.1";
    }
    return lookupReal(hostname, options, callback);
};

var fluid = require("infusion"),
    app = require("electron").app,
    gpii = fluid.registerNamespace("gpii"),
    kettle = fluid.registerNamespace("kettle");

fluid.setLogging(true);

app.disableHardwareAcceleration();


// The PSP will have a single instance. If an attempt to start a second instance is made,
// the second one will be closed and the callback provided to `app.makeSingleInstance`
// in the first instance will be triggered enabling it to show the PSP `BrowserWindow`.
var appIsRunning = app.makeSingleInstance(function (/*commandLine, workingDirectory*/) {
    var qssWrapper = fluid.queryIoCSelector(fluid.rootComponent, "gpii.app.qssWrapper")[0];
    if (qssWrapper) {
        qssWrapper.qss.show();
    }
});

if (appIsRunning) {
    console.log("Another instance of gpii-app is running!");
    app.quit();
    return;
}

// this module is loaded relatively slow
require("gpii-universal");
require("./index.js");

// Close the PSP if there is another instance of it already running.
var gpiiIsRunning = !gpii.singleInstance.registerInstance();
if (gpiiIsRunning) {
    app.quit();
    return;
}


// XXX just a temporary way of keeping the application alive even
// after a crashing error
fluid.onUncaughtException.addListener(function () {
    // The message should have been already logged anyways
}, "fail");


require("gpii-windows/index.js");

kettle.config.loadConfig({
    configName: kettle.config.getConfigName("app.testing"),
    configPath: kettle.config.getConfigPath("%gpii-app/configs")
});
