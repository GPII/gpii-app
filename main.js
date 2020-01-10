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

var app = require("electron").app;
var os  = require("os");

// Perform this check early, do avoid any delay.
var singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
    // The event handler of second-instance (below) will be called in the original instance.
    console.log("Another instance of Morphic is running");
    app.quit();
    return;
}

var dns = require("dns");
var lookupReal = dns.lookup;
dns.lookup = function lookup(hostname, options, callback) {
    if (hostname === "localhost") {
        hostname = "127.0.0.1";
    }
    return lookupReal(hostname, options, callback);
};

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii"),
    kettle = fluid.registerNamespace("kettle");

fluid.setLogging(true);

app.disableHardwareAcceleration();


// The PSP will have a single instance. If an attempt to start a second instance is made,
// the second one will be closed and the callback provided to `app.makeSingleInstance`
// in the first instance will be triggered enabling it to show the PSP `BrowserWindow`.
app.on("second-instance", function (event, commandLine) {
    var qssWrapper = fluid.queryIoCSelector(fluid.rootComponent, "gpii.app.qssWrapper")[0];
    qssWrapper.qss.show();
    if (commandLine.indexOf("--reset") > -1) {
        setTimeout(function () {
            // GPII-3455: Call this in another execution stack, to allow electron to free some things, otherwise an
            // error of a COM object being accessed in the wrong thread is raised - but that doesn't appear to be
            // the case. Originally, nextTick was used to escape this strange state. However, since upgrading to
            // Electron 3 it stopped working but a zero timeout does.
            var gpiiApp = fluid.queryIoCSelector(fluid.rootComponent, "gpii.app")[0];
            gpiiApp.resetAllToStandard();
        }, 0);
    }
});

// this module is loaded relatively slowly
// it also loads gpii-universal
// NOTE: if the OS-specific support package was not loaded successfully, the require(".../index.js") function will throw an exception
switch(os.platform()) {
case "win32":
    require("gpii-windows/index.js");
    break;
default:
    // use the no-os stubs if the host is not running a supported OS
    require("gpii-no-os/index.js");
    break;
}

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


kettle.config.loadConfig({
    configName: kettle.config.getConfigName("app.testing"),
    configPath: kettle.config.getConfigPath("%gpii-app/configs")
});
