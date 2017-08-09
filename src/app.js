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
var electron = require("electron");
var Menu = electron.Menu;
var Tray = electron.Tray;
var BrowserWindow = electron.BrowserWindow;
var globalShortcut = electron.globalShortcut;
var path = require("path");
var request = require("request");
require("./networkCheck.js");

/*
 ** Component to manage the app.
 */
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        keyedInUserToken: null
    },
    members: {
        dialogMinDisplayTime: 2000, // minimum time to display dialog to user in ms
        dialogStartTime: 0, // timestamp recording when the dialog was displayed to know when we can dismiss it again
        tray: {
            expander: {
                funcName: "gpii.app.makeTray",
                args: ["{that}.options.icon"]
            },
            createOnEvent: "onGPIIReady"
        },
        dialog: {
            expander: {
                funcName: "gpii.app.makeWaitDialog",
                args: ["{that}"]
            },
            createOnEvent: "onGPIIReady"
        },
        settingsWindow: {
            expander: {
                funcName: "gpii.app.makeSettingsWindow"
            },
            createOnEvent: "onGPIIReady"
        }
    },
    components: {
        menu: {
            type: "gpii.app.menuInApp",
            createOnEvent: "onGPIIReady"
        },
        networkCheck: { // Network check component to meet GPII-2349
            type: "gpii.app.networkCheck"
        }
    },
    events: {
        onGPIIReady: null
    },
    modelListeners: {
        "{lifecycleManager}.model.logonChange": {
            funcName: "gpii.app.logonChangeListener",
            args: [ "{that}", "{change}.value" ]
        }
    },
    listeners: {
        "{kettle.server}.events.onListen": {
            "this": "{that}.events.onGPIIReady",
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
        },
        "onCreate.addPcpShortcut": {
            listener: "{that}.addPcpShortcut",
            args: ["{that}", "{that}.settingsWindow", "{that}.tray"]
        }
    },
    invokers: {
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
        openSettings: {
            funcName: "gpii.app.openSettings",
            args: ["{that}.model.keyedInUserToken", "{arguments}.0", "{arguments}.1"]
        },
        addPcpShortcut: {
            funcName: "gpii.app.addPcpShortcut"
        },
        exit: {
            funcName: "gpii.app.exit",
            args: "{that}"
        },
        "handleUncaughtException": {
            funcName: "gpii.app.handleUncaughtException",
            args: ["{that}", "{arguments}.0"]
        }
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
    var tray = new Tray(path.join(__dirname, icon));
    tray.on("click", function () {
        tray.popUpContextMenu();
    });
    return tray;
};

/**
  * Creates a dialog. This is done up front to avoid the delay from creating a new
  * dialog every time a new message should be displayed.
  */
gpii.app.makeWaitDialog = function () {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;

    var dialog = new BrowserWindow({
        show: false,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskBar: true,
        x: screenSize.width - 900, // because the default width is 800
        y: screenSize.height - 600 // because the default height is 600
    });

    var url = fluid.stringTemplate("file://%dirName/html/message.html", {
        dirName: __dirname
    });
    dialog.loadURL(url);
    return dialog;
};

/**
  * Refreshes the task tray menu for the GPII Application using the menu in the model
  * @param tray {Object} An Electron "Tray" object.
  * @param menuTemplate {Array} A nested array that is the menu template for the GPII Application.
  * @param events {Object} An object containing the events that may be fired by items in the menu.
  */
gpii.app.updateMenu = function (tray, menuTemplate, events) {
    menuTemplate = gpii.app.menu.expandMenuTemplate(menuTemplate, events);

    tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
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
  * @return {Promise} A promise that will be resolved/rejected when the request is finished.
  */
gpii.app.keyOut = function (token) {
    var togo = fluid.promise();
    request("http://localhost:8081/user/" + token + "/logout", function (error/*, response, body*/) {
        //TODO Put in some error logging
        if (error) {
            togo.reject(error);
        } else {
            togo.resolve();
        }
    });
    return togo;
};

/**
  * Stops the Electron Application.
  * @return {Promise} An already resolved promise.
  */
gpii.app.performQuit = function () {
    var app = require("electron").app;
    var togo = fluid.promise();

    gpii.stop();
    app.quit();

    togo.resolve();
    return togo;
};

/**
  * Handles the exit of the Electron Application.
  * @param that {Component} An instance of gpii.app
  */
gpii.app.exit = function (that) {
    if (that.model.keyedInUserToken) {
        fluid.promise.sequence([
            gpii.rejectToLog(that.keyOut(that.model.keyedInUserToken), "Couldn't logout current user"),
            gpii.app.performQuit
        ]);
    } else {
        gpii.app.performQuit();
    }
};

gpii.app.makeSettingsWindow = function () {
    var settingsWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        skipTaskbar: true
    });
    settingsWindow.loadURL("file://" + __dirname + "/index.html");

    settingsWindow.on("blur", function () {
        settingsWindow.hide();
    });

    return settingsWindow;
};

gpii.app.getWindowPosition = function (settingsWindow, tray) {
    var windowBounds = settingsWindow.getBounds(),
        trayBounds = tray.getBounds(),
        x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2)),
        y = Math.round(trayBounds.y - windowBounds.height - 2);
    return {x: x, y: y};
};

gpii.app.openSettings = function (keyedInUserToken, settingsWindow, tray) {
    if (!keyedInUserToken || settingsWindow.isVisible()) {
        return;
    }

    var position = gpii.app.getWindowPosition(settingsWindow, tray);
    settingsWindow.setPosition(position.x, position.y, false);
    settingsWindow.show();
    settingsWindow.focus();
};

gpii.app.addPcpShortcut = function (that, settingsWindow, tray) {
    globalShortcut.register("CommandOrControl+Alt+P", function () {
        that.openSettings(settingsWindow, tray);
    });
};

/**
 * Listens to any changes in the lifecycle managers logonChange model and calls the
 * appropriate functions in gpii-app for notifying of the current user state
 */
gpii.app.logonChangeListener = function (that, model) {
    model.inProgress ? gpii.app.displayWaitDialog(that) : gpii.app.dismissWaitDialog(that);
};

/**
 * Shows the dialog on users screen with the message passed as parameter.
 * Records the time it was shown in `dialogStartTime` which we need when
 * dismissing it (checking whether it's been displayed for the minimum amount of time)
 *
 * @param that {Object} the app module
 */
gpii.app.displayWaitDialog = function (that) {
    that.dialog.show();
    // Hack to ensure it stays on top, even as the GPII autoconfiguration starts applications, etc., that might
    // otherwise want to be on top
    // see amongst other: https://blogs.msdn.microsoft.com/oldnewthing/20110310-00/?p=11253/
    // and https://github.com/electron/electron/issues/2097
    var interval = setInterval(function () {
        if (!that.dialog.isVisible()) {
            clearInterval(interval);
        };
        that.dialog.setAlwaysOnTop(true);
    }, 100);

    that.dialogStartTime = Date.now();
};

/**
 * Dismisses the dialog. If less than `that.dialogMinDisplayTime` ms have passed since we first displayed
 * the window, the function waits until `dialogMinDisplayTime` has passed before dismissing it.
 *
 * @param that {Object} the app
 */
gpii.app.dismissWaitDialog = function (that) {
    // ensure we have displayed for a minimum amount of `dialogMinDisplayTime` secs to avoid confusing flickering
    var remainingDisplayTime = (that.dialogStartTime + that.dialogMinDisplayTime) - Date.now();

    if (remainingDisplayTime > 0) {
        setTimeout(function () {
            that.dialog.hide();
        }, remainingDisplayTime);
    } else {
        that.dialog.hide();
    }
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

/**
 * Listen on uncaught exceptions and display it to the user is if it's interesting.
 * @param that {Component} An instance of gpii.app.
 */
gpii.app.handleUncaughtException = function (that, err) {
    var handledErrors = {
        "EADDRINUSE": {
            message: "There is another application listening on port " + err.port,
            fatal: true
        }
    };

    if (err.code) {
        var error = handledErrors[err.code];
        if (error) {
            that.tray.displayBalloon({
                title: error.title || "GPII Error",
                content: error.message || err.message,
                icon: path.join(__dirname, "icons/gpii-icon-balloon.png")
            });
            if (error.fatal) {
                var timeout;
                var quit = function () {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        that.exit();
                    }
                };
                // Exit when the balloon is dismissed.
                that.tray.on("balloon-closed", quit);
                that.tray.on("balloon-click", quit);
                // Also terminate after a timeout - sometimes the balloon doesn't show, or the event doesn't fire.
                // TODO: See GPII-2348 about this.
                timeout = setTimeout(quit, 12000);
            }
        }
    }
};

fluid.onUncaughtException.addListener(function (err) {
    var app = fluid.queryIoCSelector(fluid.rootComponent, "gpii.app");
    if (app.length > 0) {
        app[0].handleUncaughtException(err);
    }
}, "gpii.app", "last");

/*
 ** Configuration for using the menu in the app.
 ** Note that this is an incomplete grade which references the app.
 */
fluid.defaults("gpii.app.menuInApp", {
    gradeNames: "gpii.app.menu",
    model: {
        keyedInUserToken: "{app}.model.keyedInUserToken"
    },
    modelListeners: {
        "menuTemplate": {
            namespace: "updateMenu",
            funcName: "gpii.app.updateMenu",
            args: ["{app}.tray", "{that}.model.menuTemplate", "{that}.events"]
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
        },

        "onSettings.performSettings": {
            listener: "{app}.openSettings",
            args: ["{app}.settingsWindow", "{app}.tray"]
        }
    }
});

fluid.defaults("gpii.app.menuInAppDev", {
    gradeNames: "gpii.app.menuInApp",
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
    }
});


/*
 ** Component to generate the menu tree structure that is relayed to gpii.app for display.
 */
fluid.defaults("gpii.app.menu", {
    gradeNames: "fluid.modelComponent",
    model: {
        //keyedInUserToken  // This comes from the app.
        keyedInUser: {
            label: "",      // Must be updated when keyedInUserToken changes.
            enabled: false
        },
        keyOut: null        // May or may not be in the menu, must be updated when keyedInUserToken changes.
        //menuTemplate: []  // This is updated on change of keyedInUserToken.
    },
    modelRelay: {
        "userName": {
            target: "userName",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getUserName",
                args: ["{that}.model.keyedInUserToken"]
            }
        },
        "keyedInUserLabel": {
            target: "keyedInUser.label",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getNameLabel",
                args: ["{that}.model.userName", "{that}.options.menuLabels.keyedIn", "{that}.options.menuLabels.notKeyedIn"]
            },
            priority: "after:userName"
        },
        "keyOut": {
            target: "keyOut",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getKeyOut",
                args: ["{that}.model.keyedInUserToken", "{that}.model.userName", "{that}.options.menuLabels.keyOut"]
            },
            priority: "after:userName"
        },
        "openSettings": {
            target: "openSettings",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getOpenSettings",
                args: ["{that}.model.keyedInUserToken", "{that}.model.userName", "{that}.options.menuLabels.settings"]
            }
        },
        "menuTemplate:": {
            target: "menuTemplate",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.generateMenuTemplate",
                args: ["{that}.model.openSettings", "{that}.model.keyedInUser", "{that}.model.keyOut", "{that}.options.snapsets", "{that}.options.exit"]
            },
            priority: "last"
        }
    },
    exit: {
        label: "{that}.options.menuLabels.exit",
        click: "onExit"
    },
    menuLabels: {
        settings: "Open Settings",
        keyedIn: "Keyed in with %userTokenName",    // string template
        keyOut: "Key out %userTokenName",           // string template
        notKeyedIn: "Not keyed in",
        exit: "Exit GPII",
        keyIn: "Key in ..."
    },
    events: {
        onKeyIn: null,
        onKeyOut: null,
        onExit: null,
        onSettings: null
    }
});

/**
  * Generates a user name to be displayed based on the user token.
  * @param userToken {String} A user token.
  */
gpii.app.menu.getUserName = function (userToken) {
    // TODO: Name should actually be stored by the GPII along with the user token.
    var name = userToken ? userToken.charAt(0).toUpperCase() + userToken.substr(1) : "";
    return name;
};

// I think this can be moved into configuration.
gpii.app.menu.getNameLabel = function (name, keyedInStrTemp, notKeyedInStr) {
    return name ? fluid.stringTemplate(keyedInStrTemp, {"userTokenName": name}) : notKeyedInStr;
};

/**
  * Generates an object that represents the menu item for keying out.
  * @param keyedInUserToken {String} The user token that is currently keyed in.
  * @param name {String} The name of the user that is currently keyed in.
  * @param keyOutStrTemp {String} The string to be displayed for the key out menu item.
  */
gpii.app.menu.getKeyOut = function (keyedInUserToken, name, keyOutStrTemp) {
    var keyOut = null;

    if (name) {
        keyOut = { // TODO: probably should put at least the structure of this into configuration
            label: fluid.stringTemplate(keyOutStrTemp, {"userTokenName": name}),
            click: "onKeyOut",
            token: keyedInUserToken
        };
    }

    return keyOut;
};

gpii.app.menu.getOpenSettings = function (keyedInUserToken, name, openSettingsStr) {
    var openSettings = null;

    if (keyedInUserToken) {
        openSettings = {
            label: openSettingsStr,
            click: "onSettings",
            token: keyedInUserToken
        };
    }

    return openSettings;
};

/**
  * Creates a JSON representation of a menu.
  * @param {Object} An object containing a menu item template.
  * There should be one object per menu item in the order they should appear in the mneu.
  */
gpii.app.menu.generateMenuTemplate = function (/* all the items in the menu */) {
    var menuTemplate = [];
    fluid.each(arguments, function (item) {
        if (item) {
            menuTemplate.push(item);
        }
    });

    return menuTemplate;
};

/**
  * Takes a JSON array that represents a menu template and expands the "click" entries into functions
  * that fire the appropriate event.
  * @param events {Object} An object that contains the events that might be fired from an item in the menu.
  * @param menuTemplate {Array} A JSON array that represents a menu template
  * @return {Array} The expanded menu template. This can be used to create an Electron menu.
  */
gpii.app.menu.expandMenuTemplate = function (menuTemplate, events) {
    fluid.each(menuTemplate, function (menuItem) {
        if (typeof menuItem.click === "string") {
            var evtName = menuItem.click;
            menuItem.click = function () {
                events[evtName].fire(menuItem.token);
            };
        }
        if (menuItem.submenu) {
            menuItem.submenu = gpii.app.menu.expandMenuTemplate(menuItem.submenu, events);
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
