'use strict';

var path = require('path');
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var Menu = require('menu');
var Tray = require("tray");
var os = require("os");
var request = require("request");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var trayIcon = null;
var statusUpdateInterval = null;

var startLocalFlowManager = function() {
    var fluid = require("universal"),
        gpii = fluid.registerNamespace("gpii");

    if (os.platform() === 'win32') {
        var windows = require("gpii-windows/index.js");
    }

    gpii.start();
};

var stopLocalFlowManager = function() {
    var configs = fluid.queryIoCSelector(fluid.rootComponent, "kettle.config");
    fluid.each(configs, function (config) {config.destroy();});
};

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

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
var currentSystemStatus = [false, null];
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
 */
var buildContextMenu = function(gpiiStarted, keyedUser) {
    var menu = [];
    if (gpiiStarted) {
        menu.push({ label: "FlowManager Running", enabled: false });
    }
    else {
        menu.push({ label: "FlowManager Not Running", enabled: false });
    }

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

    if (gpiiStarted) {
        menu.push({
            label: "Stop GPII",
            click: function() {
                stopLocalFlowManager();
                trayIcon.setContextMenu(buildContextMenu(false, null));
            }
        });
    }
    else {
        menu.push({
            label: "Start GPII",
            click: function() {
                startLocalFlowManager();
                trayIcon.setContextMenu(buildContextMenu(true, null));
            }
        });
    }

    menu.push({
        label: "Exit",
        click: function() {
            app.quit();
        }
    });
    return Menu.buildFromTemplate(menu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    if (process.platform === 'darwin') {
        trayIcon = new Tray(path.join(__dirname, 'web/icons/gpii-icon.png'));
    }
    else {
        trayIcon = new Tray(path.join(__dirname, 'web/icons/gpii.ico'));
    }
    trayIcon.setToolTip("GPII Electron");
    var menu = buildContextMenu(true, null);
    trayIcon.setContextMenu(menu);
    startLocalFlowManager();
    currentSystemStatus = [true, null];
    statusUpdateInterval = setInterval(updateSystemStatus, 5000);
});

/*
 *  Code below if for the Persona Demo Window. Destined for another file or
 *  module in the project.
 */

// Global Window Reference
var personaDemoWindow = null;

var startPersonaDemo = function() {
    // Create the browser window.
    personaDemoWindow = new BrowserWindow({
        width: 800, height: 600,
        "web-preferences": {
            "web-security": false
        }
    });

    // and load the index.html of the app.
    personaDemoWindow.loadUrl('file://' + __dirname + '/web/index.html');

    // Open the DevTools.
    personaDemoWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    personaDemoWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        personaDemoWindow = null;
    });

};
