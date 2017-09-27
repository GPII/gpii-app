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

var electron = require("electron");
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var path = require("path");
var request = require("request");

var BrowserWindow = electron.BrowserWindow,
    Menu = electron.Menu,
    Tray = electron.Tray,
    globalShortcut = electron.globalShortcut;
require("./networkCheck.js");

/**
 * Promise that resolves when the electon application is ready.
 * Required for testing multiple configs of the app.
 */
gpii.app.appReady = fluid.promise();

/**
 * Listens for the electron 'ready' event and resolves the promise accordingly.
 */
gpii.app.electronAppListener = function () {
    gpii.app.appReady.resolve(true);
};
require("electron").app.on("ready", gpii.app.electronAppListener);


/*
 ** Component to manage the app.
 */
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        keyedInUserToken: null,
        showDialog: false
    },
    components: {
        pcp: {
            type: "gpii.app.pcp",
            createOnEvent: "onPrequisitesReady",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                }
            }
        },
        tray: {
            type: "gpii.app.tray",
            createOnEvent: "onPrequisitesReady",
            // needed as the pcp window is used by the tray
            priority: "after:pcp"
        },
        dialog: {
            type: "gpii.app.dialog",
            createOnEvent: "onPrequisitesReady",
            options: {
                model: {
                    showDialog: "{gpii.app}.model.showDialog"
                }
            }
        },
        networkCheck: { // Network check component to meet GPII-2349
            type: "gpii.app.networkCheck"
        }
    },
    events: {
        onPrequisitesReady: {
            events: {
                onGPIIReady: "onGPIIReady",
                onAppReady: "onAppReady"
            }
        },
        onGPIIReady: null,
        onAppReady: null
    },
    modelListeners: {
        "{lifecycleManager}.model.logonChange": {
            funcName: "{that}.updateShowDialog",
            args: ["{change}.value.inProgress"]
        }
    },
    listeners: {
        "onCreate.appReady": {
            listener: "gpii.app.fireAppReady",
            args: ["{that}.events.onAppReady.fire"]
        },
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
        }
    },
    invokers: {
        updateKeyedInUserToken: {
            changePath: "keyedInUserToken",
            value: "{arguments}.0"
        },
        updateShowDialog: {
            changePath: "showDialog",
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
        exit: {
            funcName: "gpii.app.exit",
            args: "{that}"
        },
        "handleUncaughtException": {
            funcName: "gpii.app.handleUncaughtException",
            args: ["{that}", "{arguments}.0"]
        }
    }
});


gpii.app.fireAppReady = function (fireFn) {
    gpii.app.appReady.then(fireFn);
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
    request("http://localhost:8081/user/" + token + "/login", function (/*error, response*/) {
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
    request("http://localhost:8081/user/" + token + "/logout", function (error, response, body) {
        //TODO Put in some error logging
        if (error) {
            togo.reject(error);
            fluid.log(response);
            fluid.log(body);
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


fluid.registerNamespace("gpii.app.pcp");

/**
 * Sends a message to the given window
 *
 * @param pcpWindow {Object} An Electron `BrowserWindow` object
 * @param messageChannel {String} The channel to which the message to be sent
 * @param message {String}
 */
gpii.app.pcp.notifyPCPWindow = function (pcpWindow, messageChannel, message) {
    if (pcpWindow) {
        pcpWindow.webContents.send(messageChannel, message);
    }
};

/**
 * Creates an Electron `BrowserWindow` that is to be used as the PCP window
 *
 * @param width {Number} The desired width of the window
 * @param height {Number} The desired height of the window
 * @returns {Object} The created Electron `BrowserWindow`
 */
gpii.app.pcp.makePCPWindow = function (width, height) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
    // TODO Make window size relative to the screen size
    var pcpWindow = new BrowserWindow({
        width: width,
        height: height,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        x: screenSize.width - width,
        y: screenSize.height - height,

        // feel the app more native
        backgroundColor: "#71c5ef"
    });

    pcpWindow.on("blur", function () {
        pcpWindow.hide();
    });

    return pcpWindow;
};

gpii.app.pcp.updatePCPWindowStyle = function (pcpWindow, keyedInUserToken) {
    // In case no one is keyed in - use splash window
    var windowStyle = keyedInUserToken ? "settings" : "splash";

    /*
     * keeps state
     * avoid loading blinking
     */
    if (pcpWindow.getTitle() !== windowStyle) {
        var url = fluid.stringTemplate("file://%dirName/html/%styleFile.html", {
            dirName: __dirname,
            styleFile: windowStyle
        });
        pcpWindow.loadURL(url);
        pcpWindow.setTitle(windowStyle);
    }
};

/**
 * Shows the passed Electron `BrowserWindow`
 *
 * @param keyedInUserToken {String} The user token.
 * @param pcpWindow {Object} An Electron `BrowserWindow`.
 */
gpii.app.pcp.showPCPWindow = function (pcpWindow) {
    if (pcpWindow.isVisible()) {
        return;
    }

    // XXX problem with loading - previous view is not cleared before the window is shown
    pcpWindow.show();
    pcpWindow.focus();
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
    var tray = that.tray.tray;
    var handledErrors = {
        "EADDRINUSE": {
            message: "There is another application listening on port " + err.port,
            fatal: true
        }
    };

    if (err.code) {
        var error = handledErrors[err.code];
        if (error) {
            tray.displayBalloon({
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
                tray.on("balloon-closed", quit);
                tray.on("balloon-click", quit);
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


/**
 * Handles logic for the PCP window.
 */
fluid.defaults("gpii.app.pcp", {
    gradeNames: "fluid.modelComponent",

    model:  {
        keyedInUserToken: null
    },

    attrs: {
        width: 500,
        height: 600
    },

    members: {
        pcpWindow: {
            expander: {
                funcName: "gpii.app.pcp.makePCPWindow",
                args: ["{that}.options.attrs.width", "{that}.options.attrs.height"]
            }
        }
    },

    modelListeners: {
        "keyedInUserToken": {
            funcName: "gpii.app.pcp.updatePCPWindowStyle",
            args: ["{that}.pcpWindow", "{that}.model.keyedInUserToken"]
        }
    },

    invokers: {
        show: {
            funcName: "gpii.app.pcp.showPCPWindow",
            // XXX avoid app usage
            args: ["{that}.pcpWindow", "{that}", "{app}.model.keyedInUserToken"]
        },
        notifyPCPWindow: {
            funcName: "gpii.app.pcp.notifyPCPWindow",
            args: ["{that}.pcpWindow", "{arguments}.0", "{arguments}.1"]
        }
    }
});

/**
 * Component that contains an Electron Tray.
 */

fluid.defaults("gpii.app.tray", {
    gradeNames: "fluid.component",
    members: {
        tray: {
            expander: {
                funcName: "gpii.app.makeTray",
                args: ["{that}.options.icon", "{pcp}.show"]
            }
        }
    },
    components: {
        menu: {
            type: "gpii.app.menuInApp"
        }
    },
    listeners: {
        "onCreate.addTooltip": {
            "this": "{that}.tray",
            method: "setToolTip",
            args: ["{that}.options.labels.tooltip"]
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
  * @param handler {Function} A handler to be used for tray menu left click.
  */
gpii.app.makeTray = function (icon, handler) {
    var tray = new Tray(path.join(__dirname, icon));

    tray.on("click", function () {
        handler();
    });

    globalShortcut.register("Super+CmdOrCtrl+Alt+U", function () {
        handler();
    });

    return tray;
};

/**
 * Component that contains an Electron Dialog.
 */

fluid.defaults("gpii.app.dialog", {
    gradeNames: "fluid.modelComponent",
    model: {
        showDialog: false,
        dialogMinDisplayTime: 2000, // minimum time to display dialog to user in ms
        dialogStartTime: 0 // timestamp recording when the dialog was displayed to know when we can dismiss it again
    },
    members: {
        dialog: {
            expander: {
                funcName: "gpii.app.makeWaitDialog"
            }
        }
    },
    modelListeners: {
        "showDialog": {
            funcName: "gpii.app.showHideWaitDialog",
            args: ["{that}", "{change}.value"]
        }
    }
});

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


gpii.app.showHideWaitDialog = function (that, showDialog) {
    showDialog ? gpii.app.displayWaitDialog(that) : gpii.app.dismissWaitDialog(that);
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

    that.model.dialogStartTime = Date.now();
};

/**
 * Dismisses the dialog. If less than `that.dialogMinDisplayTime` ms have passed since we first displayed
 * the window, the function waits until `dialogMinDisplayTime` has passed before dismissing it.
 *
 * @param that {Object} the app
 */
gpii.app.dismissWaitDialog = function (that) {
    // ensure we have displayed for a minimum amount of `dialogMinDisplayTime` secs to avoid confusing flickering
    var remainingDisplayTime = (that.model.dialogStartTime + that.model.dialogMinDisplayTime) - Date.now();

    if (remainingDisplayTime > 0) {
        setTimeout(function () {
            that.dialog.hide();
        }, remainingDisplayTime);
    } else {
        that.dialog.hide();
    }
};


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
            args: ["{tray}.tray", "{that}.model.menuTemplate", "{that}.events"]
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

        "onPCP.performPCP": {
            listener: "{app}.pcp.show"
        }
    }
});

/**
  * Refreshes the task tray menu for the GPII Application using the menu in the model
  * @param tray {Object} An Electron 'Tray' object.
  * @param menuTemplate {Array} A nested array that is the menu template for the GPII Application.
  * @param events {Object} An object containing the events that may be fired by items in the menu.
  */
gpii.app.updateMenu = function (tray, menuTemplate, events) {
    menuTemplate = gpii.app.menu.expandMenuTemplate(menuTemplate, events);

    tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
};

fluid.defaults("gpii.app.menuInAppDev", {
    gradeNames: "gpii.app.menuInApp",
    // The list of the default snapsets shown on the task tray menu for key-in
    snapsets: {
        label: "{that}.options.menuLabels.keyIn",
        submenu: [{
            label: "Larger 125%",
            click: "onKeyIn",
            token: "snapset_1a"
        }, {
            label: "Larger 150%",
            click: "onKeyIn",
            token: "snapset_1b"
        }, {
            label: "Larger 175%",
            click: "onKeyIn",
            token: "snapset_1c"
        }, {
            label: "Dark & Larger 125%",
            click: "onKeyIn",
            token: "snapset_2a"
        }, {
            label: "Dark & Larger 150%",
            click: "onKeyIn",
            token: "snapset_2b"
        }, {
            label: "Dark & Larger 175%",
            click: "onKeyIn",
            token: "snapset_2c"
        }, {
            label: "Read To Me",
            click: "onKeyIn",
            token: "snapset_3"
        }, {
            label: "Magnifier 200%",
            click: "onKeyIn",
            token: "snapset_4a"
        }, {
            label: "Magnifier 400%",
            click: "onKeyIn",
            token: "snapset_4b"
        }, {
            label: "Magnifier 200% & Display Scaling 175%",
            click: "onKeyIn",
            token: "snapset_4c"
        }, {
            label: "Dark Magnifier 200%",
            click: "onKeyIn",
            token: "snapset_4d"
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
                func: "gpii.app.menu.getKeyedInLabel",
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
        "showPCP": {
            target: "showPCP",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getShowPCP",
                args: ["{that}.model.keyedInUserToken", "{that}.options.menuLabels.pcp"]
            }
        },
        "menuTemplate": {
            target: "menuTemplate",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.generateMenuTemplate",
                args: ["{that}.model.showPCP", "{that}.model.keyedInUser", "{that}.model.keyOut", "{that}.options.snapsets", "{that}.options.exit"]
            },
            priority: "last"
        }
    },
    menuLabels: {
        pcp: "Open PCP",
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
        onPCP: null
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

/**
  * Generates a label based on whether or not a user name is present.
  * @param name {String} The name of the user who is keyed in.
  * @param keyedInStrTemp {String} The string template for the label when a user is keyed in.
  * @param notKeyedInStr {String} The string when a user is not keyed in.
  */
gpii.app.menu.getKeyedInLabel = function (name, keyedInStrTemp, notKeyedInStr) {
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

    if (keyedInUserToken) {
        keyOut = { // TODO: probably should put at least the structure of this into configuration
            label: fluid.stringTemplate(keyOutStrTemp, {"userTokenName": name}),
            click: "onKeyOut",
            token: keyedInUserToken
        };
    }

    return keyOut;
};

/**
  * Generates an object that represents the menu items for opening the settings panel
  * @param keyedInUserToken {String} The user token that is currently keyed in.
  * @param openSettingsStr {String} The string to be displayed for the open setting panel menu item.
  * @returns {Object}
  */
gpii.app.menu.getShowPCP = function (keyedInUserToken, openSettingsStr) {
    return {
        label: openSettingsStr,
        click: "onPCP",
        token: keyedInUserToken
    };
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
