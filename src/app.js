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

/*
 ** Component to manage the app.
 */
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        // This model has a "menu" item that is only relayed from gpii.app.menu,
        // Don't uncomment the line below so that the initial menu can be populated
        // by gpii.app.menu component using the initial model.keyedInUserToken.
        // menu: null,
        keyedInUserToken: null
    },
    // The list of the default snapsets shown on the initial task tray menu for key-in
    snapsets: {
        alice: "Alice",
        davey: "Davey",
        david: "David",
        elaine: "Elaine",
        elmer: "Elmer",
        elod: "Elod",
        livia: "Livia"
    },
    members: {
        tray: {
            expander: {
                funcName: "gpii.app.makeTray",
                args: ["{that}.options.icon"]
            }
        }
    },
    components: {
        menu: {
            type: "gpii.app.menu",
            // createOnEvent: "onGPIIReady",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                },
                snapsets: "{app}.options.snapsets",
                modelRelay: {
                    target: "{app}.model.menu",
                    singleTransform: {
                        type: "fluid.transforms.free",
                        func: "gpii.app.menu.generateMenuStructure",
                        args: ["{that}", "{that}.model.keyedInUserToken"]
                    }
                },
                listeners: {
                    // onKeyIn event that is fired when a new user keys in contains these steps:
                    // 1. key out the old keyed in user token;
                    // 2. key in the new user token;
                    // 3. the key-in triggers GPII {lifecycleManager}.events.onSessionStart that fires a model change to set the new model.keyedInUserToken,
                    //    which causes the menu structure to be updated
                    "onKeyIn.performKeyOut": {
                        listener: "{app}.keyOut",
                        args: "{that}.model.keyedInUserToken"
                    },
                    "onKeyIn.performKeyIn": {
                        listener: "{app}.keyIn",
                        args: ["{arguments}.0"],
                        priority: "after:performKeyOut"
                    },

                    // onKeyOut event that is fired when a keyed-in user keys out. It contains these steps:
                    // 1. key out the currently keyed in user;
                    // 2. change model.keyedInUserToken which causes the menu structure to be updated
                    "onKeyOut.performKeyOut": {
                        listener: "{app}.keyOut",
                        args: ["{arguments}.0"]
                    },

                    // onExit
                    "onExit.performExit": {
                        listener: "{app}.exit"
                    }
                }
            }
        }
    },
    // TODO: hook up onGPIIReady with kettle server onListen event to ensure GPII starts
    // events: {
    //     onGPIIReady: null
    // },
    listeners: {
        "{lifecycleManager}.events.onSessionStart": {
            listener: "{that}.updateKeyedInUserToken",
            args: ["{arguments}.1"],
            namespace: "onLifeCycleManagerUserKeyedIn"
        },
        "{lifecycleManager}.events.onSessionStop": {
            listener: "gpii.app.handleSessionStop",
            args: ["{that}", "{arguments}.1.options.userToken"]
        },
        "onCreate.addTooltip": {
                "this": "{that}.tray",
                "method": "setToolTip",
                "args": ["{that}.options.labels.tooltip"]
        }
    },
    modelListeners: {
        "menu": {
            funcName: "{that}.updateMenu",
            args: ["{change}.value"]
        }
    },
    invokers: {
        updateMenu: {
            funcName: "gpii.app.updateMenu",
            args: ["{that}.tray", "{arguments}.0"] // menu
        },
        updateKeyedInUserToken: {
            changePath: "keyedInUserToken",
            value: "{arguments}.0"
        },
        keyIn: {
            funcName: "gpii.app.keyIn",
            args: ["{arguments}.0"]
        },
        keyOut: {
            funcName: "gpii.app.keyOut",
            args: ["{arguments}.0"]
        },
        exit: "gpii.app.exit"
    },
    icon: "icons/gpii.ico",
    labels: {
        tooltip: "GPII"
    }
});

gpii.app.makeTray = function (icon) {
    return new Tray(path.join(__dirname, icon));
};

gpii.app.updateMenu = function (tray, menu) {
    tray.setContextMenu(Menu.buildFromTemplate(menu));
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

gpii.app.exit = function () {
    var app = require("electron").app;
    app.quit();
};

gpii.app.handleSessionStop = function (that, keyedOutUserToken) {
    var currentKeyedInUserToken = that.model.keyedInUserToken;

    if (keyedOutUserToken !== currentKeyedInUserToken) {
        console.log("Warning: The keyed out user token does NOT match the current keyed in user token.");
    } else {
        that.updateKeyedInUserToken(null);
    }
};

/*
 ** Component to generate the menu tree structure that is relayed to gpii.app for display.
 */
fluid.defaults("gpii.app.menu", {
    gradeNames: "fluid.modelComponent",
    menuLabels: {
        tooltip: "GPII Electron",
        keyedIn: "Keyed in with %userTokenName", // string template
        keyOut: "Key out %userTokenName", //string template
        notKeyedIn: "Not keyed in",
        exit: "Exit",
        keyIn: "Key in ..."
    },
    events: {
        onKeyIn: null,
        onKeyOut: null,
        onExit: null
    }
});

gpii.app.menu.updateKeyedIn = function (menu, menuLabels, keyedInUserToken, keyedInUserTokenLabel, keyOutEvt) {
    if (keyedInUserToken) {
        keyedInUserTokenLabel = keyedInUserTokenLabel || keyedInUserToken;

        menu.push({ label: fluid.stringTemplate(menuLabels.keyedIn, {"userTokenName": keyedInUserTokenLabel}), enabled: false });
        menu.push({ label: fluid.stringTemplate(menuLabels.keyOut, {"userTokenName": keyedInUserTokenLabel}),
            click: function () {
                // key out an keyed in user
                keyOutEvt.fire(keyedInUserToken);
            }
        });
    } else {
        menu.push({ label: menuLabels.notKeyedIn, enabled: false });
    }
    return menu;
};

gpii.app.menu.updateSnapsets = function (menu, keyInLabel, snapsets, keyInEvt) {
    var submenuArray = [];
    fluid.each(snapsets, function (value, userToken) {
        submenuArray.push({label: value, click: function () {
            keyInEvt.fire(userToken);
        }});
    });

    menu.push({
        label: keyInLabel,
        submenu: submenuArray
    });
    return menu;
};

gpii.app.menu.addExit = function (menu, exitLabel, exitEvt) {
    menu.push({
        label: exitLabel,
        click: function () {
            exitEvt.fire();
        }
    });
    return menu;
};

gpii.app.menu.generateMenuStructure = function (that, keyedInUserToken) {
    var menuLabels = that.options.menuLabels;
    var snapsets = that.options.snapsets;
    var menu = [];

    menu = gpii.app.menu.updateKeyedIn(menu, menuLabels, keyedInUserToken, snapsets[keyedInUserToken], that.events.onKeyOut);
    menu = gpii.app.menu.updateSnapsets(menu, menuLabels.keyIn, snapsets, that.events.onKeyIn);
    return gpii.app.menu.addExit(menu, menuLabels.exit, that.events.onExit);
};

// A wrapper that wraps gpii.app as a subcomponent. This is the grade need by configs/app.json
// to distribute gpii.app as a subcomponent of GPII flow manager since infusion doesn't support
// broadcasting directly to "components" block which probably would destroy GPII.

fluid.defaults("gpii.appWrapper", {
    gradeNames: ["fluid.component"],
    components: {
        app: {
            type: "gpii.app"
        }
    }
});
