/*!
GPII Electron
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

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
var Menu = require("electron").Menu;
var Tray = require("electron").Tray;
var path = require("path");
var request = require("request");
var os = require("os");

/*
 ** Component to manage the task tray.
 */
fluid.defaults("gpii.taskTray", {
    gradeNames: "fluid.modelComponent",
    model: {
        // This model has a "menu" item that is only relayed from gpii.taskTray.menu,
        // The comment below is for documentation purpose.
        // menu: null
    },
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
            // options: {
            //     events: {
            //         onAppReady: "{taskTray}.events.onAppReady"
            //     }
            // }
        },
        menu: {
            type: "gpii.taskTray.menu",
            // createOnEvent: "onAppReady",
            options: {
                modelRelay: {
                    target: "{taskTray}.model.menu",
                    singleTransform: {
                        type: "fluid.transforms.free",
                        func: "gpii.taskTray.menu.updateMenu",
                        args: ["{that}", "{app}.model.gpiiStarted", "{app}.model.keyedInSet"]
                    }
                },
                invokers: {
                    // The function used to apply prefs sets
                    changeSet: {
                        changePath: "{app}.model.keyedInSet",
                        value: "{arguments}.0"
                    }
                }
            }
        }
    },
    events: {
        onAppReady: null
    },
    listeners: {
        "{lifecycleManager}.events.onSessionStart": {
            listener: "{that}.events.onAppReady.fire",
            namespace: "onLifeCycelSessionStart"
        },
        "{lifecycleManager}.events.onSessionStart": {
            funcName: "console.log",
            args: ["lifecycleManager onSessionStart is fired"],
            namespace: "onSessionStartDebug"
        },
        // "onCreate.updateTaskTray": {
        //     funcName: "{that}.updateTaskTray",
        //     args: ["{that}.model.menu"]
        // },
        "onAppReady.debug": {
            funcName: "console.log",
            args: ["onAppReady is fired"]
        }
    },
    modelListeners: {
        "menu": {
            funcName: "{that}.updateTaskTray",
            args: ["{change}.value"]
        }
    },
    invokers: {
        updateTaskTray: {
            funcName: "gpii.taskTray.updateTaskTray",
            args: ["{that}.tray", "{that}.options.labels.tooltip", "{arguments}.0"] // menu
        }
    },
    icon: "icons/gpii.ico",
    labels: {
        tooltip: "GPII Electron"
    }
});

gpii.taskTray.makeTray = function (icon) {
    console.log("=========================== making the TRAY");
    return new Tray(path.join(__dirname, icon));
};

gpii.taskTray.updateTaskTray = function (tray, tooltipLabel, menu) {
    if (menu) {
        tray.setToolTip(tooltipLabel);
        tray.setContextMenu(Menu.buildFromTemplate(menu));
    } else {
        console.log("+++++++++++++ menu is null");
    }
};

/*
 ** Component to start and stop parts of the GPII as well as key in and key out users
 */
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        gpiiStarted: false,
        keyedInSet: null
    },
    events: {
        onAppReady: null
    },
    listeners: {
        // "onCreate.startGpii": {
        //     funcName: "gpii.app.startLocalFlowManager",
        //     args: ["{that}"]
        // },
        "onCreate.changeStarted": {
            funcName: "{that}.changeStarted",
            args: [true]
        }
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

gpii.app.startLocalFlowManager = function (that) {
    var fluid = require("universal"),
        gpii = fluid.registerNamespace("gpii");

    if (os.platform() === "win32") {
        require("gpii-windows/index.js");
    }

    gpii.start();
    //TODO: needs to fire an on ready so we can be certain that everything has started
    that.events.onAppReady.fire();
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

/*
 ** Component to create and update the task tray menu.
 */
fluid.defaults("gpii.taskTray.menu", {
    gradeNames: "fluid.modelComponent",
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
            var app = require("electron").app;
            app.quit();
        }
    });
    return menu;
};

gpii.taskTray.menu.updateMenu = function (that, gpiiStarted, keyedInSet) {
    var menuLabels = that.options.menuLabels;
    var snapsets = that.options.snapsets;
    var changeSetFn = that.changeSet;
    var menu = [];
    if (gpiiStarted) {
        menu = gpii.taskTray.updateSet(menu, menuLabels, snapsets[keyedInSet], changeSetFn);
        menu = gpii.taskTray.updateSnapsets(menu, menuLabels.keyIn, snapsets, changeSetFn);
    }
    return gpii.taskTray.addExit(menu, menuLabels.exit);
};

// A wrapper that wraps gpii.taskTray as a subcomponent. This is the grade need by configs/app.json
// to distribute gpii.taskTray as a subcomponent of GPII flow manager since infusion doesn't support
// broadcasting directly to "components" block which probably would destroy GPII.

fluid.defaults("gpii.taskTrayWrapper", {
    gradeNames: ["fluid.component"],
    components: {
        taskTray: {
            type: "gpii.taskTray"
        }
    }
});
