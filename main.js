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

var path = require("path");
var app = require("app");  // Module to control application life.
var Menu = require("menu");
var Tray = require("tray");
var os = require("os");
var request = require("request");

// Top Level variables to track the Tray icon and the interval to ping the 
// local flowmanager to see if the logged in status has changed.
var trayIcon = null;
var statusUpdateInterval = null;

var startLocalFlowManager = function() {
    var fluid = require("universal"),
        gpii = fluid.registerNamespace("gpii");

    if (os.platform() === "win32") {
        var windows = require("gpii-windows/index.js");
    }

    gpii.start();
};

var stopLocalFlowManager = function() {
    var configs = fluid.queryIoCSelector(fluid.rootComponent, "kettle.config");
    fluid.each(configs, function (config) {config.destroy();});
};

/**
 *  There are three possible return values. The system is not running at all,
 *  the system is running and no one is logged in, or the system is running and
 *  someone is logged in.
 *
 *  You'll pass in a callback, taking one of these which are structured as:
 *  - Someone logged in: [ 'actual-user-token' ]
 *  - No one logged in: [ false ]
 *  - System not running: [ 404 ]
 *
 *  These are all the first item in the returned array so you should be able
 *  to check for false, 404, or the name of the user token.
 *
 *  Our endpoints and options for this could really use some further standarization
 *  going forward.
 */
var getFlowManagerStatus = function(callback) {
    request("http://localhost:8081/userToken", function(error, response, body) {
        if (!error && body.indexOf("No user currently logged in to the system") == 0) {
            callback([false]);
        }
        else if (!error) {
            callback(JSON.parse(body));
        }
        else {
            callback([404]);
        }
    })
}

/**
 *  Function that can run periodically on a node timer to check and update
 *  System status, currently keyed in user, etc.
 */
var currentSystemStatus = [true, null];
var updateSystemStatus = function() {
    getFlowManagerStatus(function(statusArray) {
        var status = statusArray[0];
        var newStatus = null;
        if (status === 404) {
            newStatus = [false, null];
        }
        else if (status === false) {
            newStatus = [true, null];
        }
        else {
            newStatus = [true, status];
        }
        if (currentSystemStatus[0] !== newStatus[0] || currentSystemStatus[1] !== newStatus[1]) {
            trayIcon.setContextMenu(buildContextMenu(newStatus[0], newStatus[1]));
        }
        currentSystemStatus = newStatus;
    });
}

var keyIn = function(token) {
    request("http://localhost:8081/user/"+token+"/login", function(error, response, body) {
        //TODO Put in some error logging
    });
    updateSystemStatus();
}

var keyOut = function(token) {
    request("http://localhost:8081/user/"+token+"/logout", function(error, response, body) {
        //TODO Put in some error logging
    });
    updateSystemStatus();
}

/**
 *  This builds the menu for the task tray, there are currently 3 possible states.
 *  1. GPII Started; No User Keyed In  (true, null)
 *  2. GPII Started; User Keyed In     (true, 'alice')
 *  3. GPII Stopped                    (false, null)
 *
 *  Currently scenerio 3 shouldnt' happen as we've taken out the menu to start 
 *  and stop the flowmanager. But this may be useful in the future.
 */
var buildContextMenu = function(gpiiStarted, keyedUser) {
    var menu = [];
    if (gpiiStarted && keyedUser) {
        menu.push({ label: "Keyed in as " + keyedUser, enabled: false });
        menu.push({ label: "Key out " + keyedUser,
            click: function() {
                keyOut(keyedUser);
            }
        });
    }
    else if (gpiiStarted) {
        menu.push({ label: "No one is keyed in", enabled: false });
        menu.push({ label: "Log in with persona...",
            submenu: [
                { label: "Alice", click: function() { keyIn("alice"); }},
                { label: "Davey", click: function() { keyIn("davey"); }},
                { label: "David", click: function() { keyIn("david"); }},
                { label: "Elaine", click: function() { keyIn("elaine"); }},
                { label: "Elmer", click: function() { keyIn("elmer"); }},
                { label: "Elod" , click: function() { keyIn("elod"); }},
                { label: "Livia", click: function() { keyIn("livia"); }},
            ]
        })
    }
    menu.push({
        label: "Exit",
        click: function() {
            // see note below about refactoring
            // quitLGS();
            app.quit();
        }
    });
    return Menu.buildFromTemplate(menu);
};


// The below 2 pieces of functionality will be refactored as an extension once
// this work is infusion-ized. ie. Such that a specific GPII distribution, such
// as LGS could add in these custom startup pieces, but the core demo one would
// not.
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var fdsChildProcess = null;
var startLocalFirstDiscoveryServer = function() {
    console.log("About to launch first discover server");
    fdsChildProcess = exec("..\\..\\lgsbin\\node-443-x64.exe index.js", {
        cwd: "./node_modules/gpii-first-discovery-server"
    });
};

var quitLGS = function() {
    fdsChildProcess.kill("SIGKILL");
};

var startWindowsProximityListener = function() {
    console.log("About to launch Windows Proximity Listener");
    var child = spawn("GPIIWindowsProximityListener.exe", {
        cwd: "./lgsbin"
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", function() {
    if (process.platform === "darwin") {
        trayIcon = new Tray(path.join(__dirname, "web/icons/gpii-icon.png"));
    }
    else {
        trayIcon = new Tray(path.join(__dirname, "web/icons/gpii.ico"));
    }
    trayIcon.setToolTip("GPII Electron");
    var menu = buildContextMenu(true, null);
    trayIcon.setContextMenu(menu);
    startLocalFlowManager();
    // See note above about refactoring for these 2 functions.
    // startLocalFirstDiscoveryServer();
    // startWindowsProximityListener();
    currentSystemStatus = [true, null];
    statusUpdateInterval = setInterval(updateSystemStatus, 5000);
});
