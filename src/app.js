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
//        menu: "{menu}.model.menuTemplate",
        keyedInUserToken: null
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
                modelRelay: { // The problem here is that the menu is going to contain functions.
                    target: "{app}.model.menu",
                    input: "{that}.model.menuTemplate",
                    singleTransform: {
                        type: "fluid.transforms.free",
                        func: "gpii.app.menu.expandMenuTemplate",
                        args: ["{that}.events", "{that}.model.menuTemplate"]
                    }
                },
                snapsets: "{app}.options.snapsets",
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
    if (menu) {
        tray.setContextMenu(Menu.buildFromTemplate(menu));
    }
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
    model: {
        //keyedInUserToken  // comes from the app.
        userTokenName: "", // this should be updated based on user behaviour
        keyedInUser: {
            label: "", // Must be updated when user changes.
            enabled: false
        },
        keyOut: null       // May or may not be in the menu, must be updated when user changes.
        //menuTemplate: [] // this should be updated on change of userTokenName OR maybe we don't need to store it
    },
    modelListeners: {
        "keyedInUserToken.generateMenu": {
            funcName: "gpii.app.menu.generateMenuTemplate",
            args: ["{that}", "{that}.model.keyedInUserToken"]
        },
        "keyedInUserToken.log": {
            funcName: "console.log",
            args: ["keyedInUserToken changed " + "{change}.value"]
        }
    },
    // The list of the default snapsets shown on the task tray menu for key-in
    snapsets: {
        label: "{that}.options.menuLabels.keyIn",
        submenu: [{
            label: "Alice",
            click: "onKeyIn",
            token: "alice"
        }, {
            label: "Davey",
            click: "onKeyIn",
            token: "davey"
        }, {
            label: "David",
            click: "onKeyIn",
            token: "david"
        }, {
            label: "Elaine",
            click: "onKeyIn",
            token: "elaine"
        }, {
            label: "Elmer",
            click: "onKeyIn",
            token: "elmer"
        }, {
            label: "Elod",
            click: "onKeyIn",
            token: "elod"
        }, {
            label: "Livia",
            click: "onKeyIn",
            token: "livia"
        }]
    },
    exit: {
        label: "{that}.options.menuLabels.exit",
        click: "onExit"
    },
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

gpii.app.menu.generateMenuTemplate = function (that, keyedInUserToken) {
    //TODO: Wrong Place! Maybe it can all be done in configuration.
    if (keyedInUserToken) {
        // TODO: Name should actually be stored along with the user token.
        var name = keyedInUserToken.charAt(0).toUpperCase() + keyedInUserToken.substr(1);
        that.model.keyedInUser.label = fluid.stringTemplate(that.options.menuLabels.keyedIn, {"userTokenName": name});
        that.model.keyOut = {
            label: fluid.stringTemplate(that.options.menuLabels.keyOut, {"userTokenName": name}),
            click: "onKeyOut",
            token: keyedInUserToken
        };
    } else {
        that.model.keyedInUser.label = that.options.menuLabels.notKeyedIn;
    }

    var menuTemplate = [that.model.keyedInUser];
    if (keyedInUserToken) {
        menuTemplate.push(that.model.keyOut);
    }
    menuTemplate = menuTemplate.concat([that.options.snapsets, that.options.exit]);

    that.applier.change("menuTemplate", menuTemplate);
};

gpii.app.menu.expandMenuTemplate = function (events, menuTemplate) {
    fluid.each(menuTemplate, function (menuItem) {
        if (typeof menuItem.click === "string") {
            var evtName = menuItem.click;
            menuItem.click = function () {
                events[evtName].fire(menuItem.token);
            };
        }
        if (menuItem.submenu) {
            menuItem.submenu = gpii.app.menu.expandMenuTemplate(events, menuItem.submenu);
        }
    });

    return menuTemplate;
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
