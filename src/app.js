/*!
GPII Application
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

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
            },
            createOnEvent: "onGPIIReady"
        }
    },
    components: {
        menu: {
            type: "gpii.app.menu",
            createOnEvent: "onGPIIReady",
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
                    // onKeyIn event is fired when a new user keys in through the task tray.
                    // This should result in:
                    // 1. key out the old keyed in user token
                    // 2. key in the new user token
                    //   a) trigger GPII {lifecycleManager}.events.onSessionStart
                    //   b) fire a model change to set the new model.keyedInUserToken
                    //   c) update the menu
                    "onKeyIn.performKeyOut": {
                        listener: "{app}.keyOut",
                        args: "{that}.model.keyedInUserToken"
                    },
                    "onKeyIn.performKeyIn": {
                        listener: "{app}.keyIn",
                        args: ["{arguments}.0"],
                        priority: "after:performKeyOut"
                    },
                    // onKeyOut event is fired when a keyed-in user keys out through the task tray.
                    // This should result in:
                    // 1. key out the currently keyed in user
                    //    a) change model.keyedInUserToken
                    //    b) update the menu
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
    events: {
        onGPIIReady: null
    },
    listeners: {
        "{kettle.server}.events.onListen": {
            "this": "{that}.events.onGPIIReady",   // Is this the best way to do this?
            method: "fire"
        },
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
            method: "setToolTip",
            args: ["{that}.options.labels.tooltip"]
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

/**
  * Creates the Electron Tray
  * @param icon {String} Path to the icon that represents the GPII in the task tray.
  */
gpii.app.makeTray = function (icon) {
    return new Tray(path.join(__dirname, icon));
};

/**
  * Refreshes the task tray menu for the GPII Application using the menu in the model
  * @param tray {Object} An Electron 'Tray' object.
  * @param menu {Array} A nested array representing the menu for the GPII Application.
  */
gpii.app.updateMenu = function (tray, menu) {
    tray.setContextMenu(Menu.buildFromTemplate(menu));
};

/**
  * Keys into the GPII.
  * Currently uses an url to key in although this should be changed to use Electron IPC.
  * @param token {String} The token to key in with.
  */
gpii.app.keyIn = function (token) {
    request("http://localhost:8081/user/" + token + "/login", function (/*error, response, body*/) {
        //TODO Put in some error logging
    });
};

/**
  * Keys out of the GPII.
  * Currently uses an url to key out although this should be changed to use Electron IPC.
  * @param token {String} The token to key out with.
  */
gpii.app.keyOut = function (token) {
    request("http://localhost:8081/user/" + token + "/logout", function (/*error, response, body*/) {
        //TODO Put in some error logging
    });
};

/**
  * Stops the Electron Application.
  */
gpii.app.exit = function () {
    //TODO: This should stop the GPII gracefully before quitting the application.
    var app = require("electron").app;
    app.quit();
};

/**
  * Handles when a user token is keyed out through other means besides the task tray key out feature.
  * @param that {Component} An instance of gpii.app
  * @param keyedOutUserToken {String} The token that was keyed out.
  */
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

//TODO: The following functions need some refactoring love.

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
