'use strict';

var path = require('path');
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var Menu = require('menu');
var Tray = require("tray");
var os = require("os");

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var trayIcon = null;

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

var buildContextMenu = function(gpiiStarted) {
    var menu = [];
    if (gpiiStarted) {
        menu.push(
            {
                label: "Stop GPII",
                click: function() {
                    stopLocalFlowManager();
                    trayIcon.setContextMenu(buildContextMenu(false));
                }
            });
    }
    else {
        menu.push(
            {
                label: "Start GPII",
                click: function() {
                    startLocalFlowManager();
                    trayIcon.setContextMenu(buildContextMenu(true));
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
    trayIcon.setContextMenu(buildContextMenu(true));;
    startLocalFlowManager();
    // startPersonaDemo();
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
