'use strict';

var path = require('path');
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var Menu = require('menu');
var Tray = require("tray");

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var appIcon = null;

var startLocalFlowManager = function() {
    var fluid = require("universal"),
        gpii = fluid.registerNamespace("gpii");

    gpii.start();
};

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    var iconPath = path.join(__dirname, 'web/static/gpii.png');
    console.log("ICONPATH: " + iconPath);
    appIcon = new Tray(iconPath); //path.join(__dirname, 'web/static/gpii.ico'));
    var contextMenu = Menu.buildFromTemplate([
        { label: "Wow GPII" }
    ]);
    appIcon.setToolTip("GPII Electron");
    appIcon.setContextMenu(contextMenu);

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800, height: 600,
        "web-preferences": {
            "web-security": false
        }
    });

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/web/index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    startLocalFlowManager();
});
