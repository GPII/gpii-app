/*!
GPII Electron
Copyright 2016 Steven Githens
Copyright 2016 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
/* eslint-env node */

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var Menu = require("electron").Menu;
var Tray = require("electron").Tray;
var path = require("path");
var request = require("request");
var os = require("os");


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
        require("gpii-windows/index.js");
    }

    gpii.start();
};

gpii.app.keyIn = function (token) {
    request("http://localhost:8081/user/" + token + "/login", function (/*error, response, body*/) {
        //TODO Put in some error logging
    });
};

gpii.app.keyOut = function (token) {
    request("http://localhost:8081/user/" + token + "/logout", function (/*error, response, body*/) {
        //TODO Put in some error logging
    });
};


// Component to create and update the task tray menu.
fluid.defaults("gpii.taskTray", {
    gradeNames: "fluid.modelComponent",
    model: "{that}.app.model",
    members: {
        tray: {
            expander: {
                funcName: "gpii.taskTray.makeTray",
                args: ["{that}.options.icon"]
            }
        }
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
        onCreate: {
            funcName: "{that}.updateMenu"
        }
    },
    modelListeners: {
        "*": {
            funcName: "{that}.updateMenu"
        }
    },
    invokers: {
        changeSet: {
            changePath: "keyedInSet",
            value: "{arguments}.0"
        },
        updateMenu: {
            funcName: "gpii.taskTray.updateMenu",
            args: ["{that}.model.gpiiStarted", "{that}.options.menuLabels",
            "{that}.options.snapsets", "{that}.model.keyedInSet", "{that}.changeSet", "{that}"]
        }
    },
    icon: "icons/gpii.ico",
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

gpii.taskTray.makeTray = function (icon) {
    return new Tray(path.join(__dirname, icon));
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
        click: function () {
            app.quit();
        }
    });
    return menu;
};

gpii.taskTray.updateMenu = function (gpiiStarted, menuLabels, snapsets, keyedInSet, changeSetFn, that) {
    if (!that.tray) {
        return;
    }

    var menu = [];
    if (gpiiStarted) {
        menu = gpii.taskTray.updateSet(menu, menuLabels, snapsets[keyedInSet], changeSetFn);
        menu = gpii.taskTray.updateSnapsets(menu, menuLabels.keyIn, snapsets, changeSetFn);
    }
    menu = gpii.taskTray.addExit(menu, menuLabels.exit);
    that.tray.setToolTip(menuLabels.tooltip);
    that.tray.setContextMenu(Menu.buildFromTemplate(menu));
};
