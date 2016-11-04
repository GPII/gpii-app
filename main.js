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

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
const {app, Menu, Tray} = require('electron')
var path = require("path");
var request = require("request");
var os = require("os");

// The tray needs to be global
var tray = null;

// Component to start and stop parts of the GPII as well as key in and key out users
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        gpiiStarted: false,
        keyedInSet: null
    },
    listeners: {
        onCreate: [{
            funcName: "gpii.app.startLocalFlowManager"
        }, {
            funcName: "{that}.changeStarted",
            args: [true]
        }]
    },
    modelListeners: {
        keyedInSet: [{
            funcName: "gpii.app.keyOut",
            args: ["{change}.oldValue"]
        }, {
            funcName: "gpii.app.keyIn",
            args: ["{change}.value"],
            priority: "after:keyOut"
        }]
    },
    invokers: {
        changeStarted: {
            changePath: "gpiiStarted",
            value: "{arguments}.0"
        }
    }
});

gpii.app.startLocalFlowManager = function () {
    var fluid = require("universal"),
        gpii = fluid.registerNamespace("gpii");

    if (os.platform() === "win32") {
        var windows = require("gpii-windows/index.js");
    }

    gpii.start();
};

gpii.app.keyIn = function (token) {
    request("http://localhost:8081/user/"+token+"/login", function(error, response, body) {
        //TODO Put in some error logging
    });
}

gpii.app.keyOut = function (token) {
    request("http://localhost:8081/user/"+token+"/logout", function(error, response, body) {
        //TODO Put in some error logging
    });
}


// Component to create and update the task tray menu.
fluid.defaults("gpii.taskTray", {
    gradeNames: "fluid.modelComponent",
    model: { // Do I need to specify a default or will it sync up with the other component?
        gpiiStarted: false,
        keyedInSet: null
    },
    components: {
        app: {
            type: "gpii.app",
            options: {
                model: "{gpii.taskTray}.model"
            }
        }
    },
    listeners: {
        onCreate: [{
            funcName: "gpii.taskTray.makeTray",
            args: ["{that}.options.icon", "{that}.options.menuLabels.tooltip"]
        }, {
            funcName: "gpii.taskTray.updateMenu",
            args: ["{that}.model.gpiiStarted", "{that}.options.menuLabels",
            "{that}.options.snapsets", "{that}.model.keyedInSet", "{that}.changeSet"]
        }],
    },
    modelListeners: {
        "*": { // is there a better way to do this so that I don't repeat the args block from above?
            funcName: "gpii.taskTray.updateMenu",
            args: ["{that}.model.gpiiStarted", "{that}.options.menuLabels",
            "{that}.options.snapsets", "{that}.model.keyedInSet", "{that}.changeSet"]
        }
    },
    invokers: {
        changeSet: {
            changePath: "keyedInSet",
            value: "{arguments}.0"
        }
    },
    icon: "web/icons/gpii.ico",
    menuLabels: {
        tooltip: "GPII Electron",
        keyedIn: "Keyed in with %setName", // string template
        keyOut: "Key out %setName", //string template
        notKeyedIn: "Not keyed in",
        exit: "Exit",
        keyIn: "Key in set ..."
    },
    snapsets: {
        alice: "Alice",
        davey: "Davey",
        david: "David",
        elaine: "Elaine",
        elmer: "Elmer",
        elod: "Elod",
        livia: "Livia"
    }
});

gpii.taskTray.makeTray = function (icon, tooltip) {
    tray = new Tray(path.join(__dirname, icon));
    tray.setToolTip(tooltip);
};

gpii.taskTray.updateSet = function (menu, menuLabels, setName, changeSetFn) {
    if (setName) {
        menu.push({ label: fluid.stringTemplate(menuLabels.keyedIn, {"setName": setName}), enabled: false });
        menu.push({ label: fluid.stringTemplate(menuLabels.keyOut, {"setName": setName}),
            click: function () {
                changeSetFn("");
            }
        });
    } else {
        menu.push({ label: menuLabels.notKeyedIn, enabled: false });
    }
    return menu;
};

gpii.taskTray.updateSnapsets = function (menu, keyInLabel, snapsets, keyInFn) {
    var submenuArray = [];
    fluid.each(snapsets, function (value, key) {
        submenuArray.push({label: value, click: function () { keyInFn(key); }});
    });

    menu.push({
        label: keyInLabel,
        submenu: submenuArray
    });
    return menu;
};

gpii.taskTray.addExit = function (menu, exitLabel) {
    menu.push({
        label: exitLabel,
        click: function() {
            app.quit();
        }
    });
    return menu;
};

gpii.taskTray.updateMenu = function (gpiiStarted, menuLabels, snapsets, keyedInSet, changeSetFn) {
    if (!tray) {
        return;
    }

    var menu = [];
    if (gpiiStarted) {
        menu = gpii.taskTray.updateSet(menu, menuLabels, snapsets[keyedInSet], changeSetFn);
        menu = gpii.taskTray.updateSnapsets(menu, menuLabels.keyIn, snapsets, changeSetFn);
    }
    menu = gpii.taskTray.addExit(menu, menuLabels.exit);
    tray.setContextMenu(Menu.buildFromTemplate(menu));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", function() {
    gpii.taskTray();

});
