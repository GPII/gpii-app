/**
 * Base BrowserWindow dialog component
 *
 * A base component for all Electron BrowserWindow dialogs.
 * GPII Application
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid         = require("infusion");
var electron      = require("electron");
var BrowserWindow = require("electron").BrowserWindow;

var gpii  = fluid.registerNamespace("gpii");

require("./utils.js");
require("../common/channelUtils.js");


/**
 * Base dialog component that provides initialization of
 * an Electron `BrowserWindow` and the generation of
 * the file URL that is to be loaded in the same `BrowserWindow`.
 * NOTE: The generated URL is always relative to the working
 * directory of the application (`module.terms()`)
 *
 * It also provides show/hide operations of the window through interaction
 * with the `isShown` property of the component
 * and handles Electron objects cleanup upon destruction.
 *
 * Requires:
 * - (optional) `attrs` - used as raw options for `BrowserWindow` generation.
 *   For full options list:  https://github.com/electron/electron/blob/master/docs/api/browser-window.md
 * - relative path from the application's working directory
 *    - `fileSuffixPath` - the suffix to the file
 *    - `filePrefixPath` (optional) - the prefix to the file
 *
 *   For example, a relative path such as `"/src/rendered/waitDialog/index.html"`,
 *   might be split into:
 *   `prefixPath = "src/renderer"`
 *   `fileSuffixPath = "waitDialog/index.html"`
 */
fluid.defaults("gpii.app.dialog", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        isShown: false
    },

    config: {
        showInactive: false,

        // dialog creation options
        attrs: {        // raw attributes used in `BrowserWindow` generation
            width: 800,
            height: 600,
            show: false,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false
        },
        filePrefixPath: "src/renderer",
        fileSuffixPath: null,           // e.g. "waitDialog/index.html"
        url: {
            expander: {
                funcName: "gpii.app.dialog.buildFileUrl",
                args: [
                    "{that}.options.config.filePrefixPath",
                    "{that}.options.config.fileSuffixPath"
                ]
            }
        }
    },
    members: {
        dialog: {
            expander: {
                funcName: "gpii.app.dialog.makeDialog",
                args: [
                    "{that}.options.config.attrs",
                    "{that}.options.config.url",
                    "{that}.options.config.params",
                    "{that}.options.gradeNames"
                ]
            }
        }
    },

    modelListeners: {
        isShown: {
            funcName: "gpii.app.dialog.toggle",
            args: ["{that}", "{change}.value", "{that}.options.config.showInactive"],
            namespace: "impl"
        }
    },
    events: {
        onDisplayMetricsChanged: null
    },
    listeners: {
        "onCreate.positionWindow": {
            func: "{that}.positionWindow",
            args: []
        },
        "onCreate.addDisplayMetricsListener": {
            func: "gpii.app.dialog.addDisplayMetricsListener",
            args: ["{that}"]
        },
        "onDisplayMetricsChanged.handleDisplayMetricsChange": {
            func: "gpii.app.dialog.handleDisplayMetricsChange",
            args: [
                "{that}",
                "{arguments}.2" // changedMetrics
            ]
        },
        "onDestroy.removeDisplayMetricsListener": {
            func: "gpii.app.dialog.removeDisplayMetricsListener",
            args: ["{that}"]
        },
        "onDestroy.cleanupElectron": {
            this: "{that}.dialog",
            method: "destroy"
        }
    },
    invokers: {
        positionWindow: {
            funcName: "gpii.app.positionWindow",
            args: [
                "{that}.dialog",
                "{arguments}.0", // offsetX
                "{arguments}.1"  // offsetY
            ]
        },
        resize: {
            funcName: "gpii.app.dialog.resize",
            args: [
                "{that}",
                "{arguments}.0", // windowWidth
                "{arguments}.1"  // windowHeight
            ]
        },
        show: {
            changePath: "isShown",
            value: true
        },
        hide: {
            changePath: "isShown",
            value: false
        },
        focus: {
            this: "{that}.dialog",
            method: "focus"
        },
        close: {
            this: "{that}.dialog",
            method: "close"
        }
    }
});

/**
 * Registers a listener to be called whenever the `display-metrics-changed`
 * event is emitted by the electron screen.
 * @param {Component} that - The `gpii.app.dialog` component.
 */
gpii.app.dialog.addDisplayMetricsListener = function (that) {
    electron.screen.on("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};

/**
 * Handle electron's display-metrics-changed event by resizing the dialog if
 * necessary.
 * @param {Component} that - The `gpii.app.dialog` component.
 * @param {Array} changedMetrics - An array of strings that describe the changes.
 * Possible changes are `bounds`, `workArea`, `scaleFactor` and `rotation`
 */
gpii.app.dialog.handleDisplayMetricsChange = function (that, changedMetrics) {
    if (!changedMetrics.includes("scaleFactor")) {
        var attrs = that.options.config.attrs;
        that.resize(attrs.width, attrs.height);
    }
};

/**
 * Removes the listener for the `display-metrics-changed` event. This should
 * be done when the component gets destroyed in order to avoid memory leaks,
 * as some dialogs are created and destroyed dynamically (i.e. before the
 * PSP application terminates).
 * @param {Component} that - The `gpii.app.dialog` component.
 */
gpii.app.dialog.removeDisplayMetricsListener = function (that) {
    electron.screen.removeListener("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};

/**
 * Builds a file URL inside the application **Working Directory**.
 * @param {String} prefixPath - Prefix for the file path, e.g. "src/renderer"
 * @param {String} suffixPath - Suffix for the file path, e.g. "index.html"
 * @return {String} The generated URL
 */
gpii.app.dialog.buildFileUrl = function (prefixPath, suffixPath) {

    var appHomePath = fluid.module.terms()["gpii-app"];

    return fluid.stringTemplate(
        "file://%homePath/%prefixPath/%suffixPath",
        {
            homePath: appHomePath,
            prefixPath: prefixPath,
            suffixPath: suffixPath
        });
};

/**
 * Creates a dialog. This is done up front to avoid the delay from creating a new
 * dialog every time a new message should be displayed.
 * @param {Object} windowOptions - The raw Electron `BrowserWindow` settings
 * @param {String} url - The URL to be loaded in the `BrowserWindow`
 * @param {Object} params -  Options that are to be supplied to the render process of
 * the newly created BrowserWindow
 * @return {BrowserWindow} The Electron `BrowserWindow` component
 */
gpii.app.dialog.makeDialog = function (windowOptions, url, params, gradeNames) {
    var dialog = new BrowserWindow(windowOptions);

    dialog.loadURL(url);

    // Approach for sharing initial options for the renderer process
    // proposed in: https://github.com/electron/electron/issues/1095
    dialog.params = params || {};
    dialog.gradeNames = gradeNames;

    return dialog;
};

/**
 * Default show/hide behaviour of the electron `BrowserWindow` dialog, depending
 * on the `isShown` flag state.
 * In case it is shown, resets the position and shows the current dialog (`BrowserWindow`).
 * The reset is needed in order to handle cases such as resolution or
 * DPI settings changes.
 * @param {Component} dialog - The diolog component to be shown
 * @param {Boolean} isShown - Whether the window has to be shown
 * @param {Boolean} showInactive - Whether the window has to be shown inactive (not focused)
 */
gpii.app.dialog.toggle = function (dialog, isShown, showInactive) {
    var showMethod = showInactive ?
        dialog.dialog.showInactive :
        dialog.dialog.show;

    if (isShown) {
        dialog.positionWindow();
        showMethod.call(dialog.dialog);
    } else {
        dialog.dialog.hide();
    }
};

/**
 * Resizes the current window and repositions it to match the new size.
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Number} windowWidth - The new width for the window
 * @param {Number} windowHeight - The new height for the window
 */
gpii.app.dialog.resize = function (that, windowWidth, windowHeight) {
    var bounds = gpii.app.getDesiredWindowBounds(windowWidth, windowHeight);
    that.dialog.setBounds(bounds);
};

/**
 * A wrapper for the creation of dialogs with the same type. This component makes
 * the instantiation of the actual dialog more elegant - the dialog is automatically
 * created by the framework when the `onDialogCreate` event is fired. Also, Infusion
 * takes care of destroying any other instances of the dialog that may be present
 * before actually creating a new one.
 */
fluid.defaults("gpii.app.dialogWrapper", {
    gradeNames: "fluid.modelComponent",

    components: {
        dialog: {
            type: "gpii.app.dialog",
            createOnEvent: "onDialogCreate"
        }
    },

    events: {
        onDialogCreate: null
    },

    invokers: {
        show: {
            funcName: "gpii.app.dialogWrapper.show",
            args: [
                "{that}",
                "{arguments}.0" // options
            ]
        },
        hide: {
            funcName: "gpii.app.dialogWrapper.hide",
            args: ["{that}"]
        },
        focus: {
            funcName: "gpii.app.dialogWrapper.focus",
            args: ["{that}"]
        },
        close: {
            funcName: "gpii.app.dialogWrapper.close",
            args: ["{that}"]
        }
    }
});

/**
 * Responsible for firing the `onDialogCreate` event which in turn creates the
 * wrapped dialog component.
 * @param {Component} that - The `gpii.app.dialogWrapper` instance.
 * @param {Object} options - An object containing the various properties for the
 * dialog which is to be created.
 */
gpii.app.dialogWrapper.show = function (that, options) {
    that.events.onDialogCreate.fire(options);
};

/**
 * Responsible for hiding the wrapped dialog if it exists.
 * @param {Component} that - The `gpii.app.dialogWrapper` instance.
 */
gpii.app.dialogWrapper.hide = function (that) {
    if (that.dialog) {
        that.dialog.hide();
    }
};

gpii.app.dialogWrapper.focus = function (that) {
    if (that.dialog) {
        that.dialog.focus();
    }
};

/**
 * Responsible for closing the wrapped dialog if it exists.
 * @param {Component} that - The `gpii.app.dialogWrapper` instance.
 */
gpii.app.dialogWrapper.close = function (that) {
    if (that.dialog) {
        that.dialog.close();
    }
};


/**
 * A generic channel extension which listens for locale changes and
 * notifies the associated `BrowserWindow`.
 */
fluid.defaults("gpii.app.i18n.channel", {
    gradeNames: "fluid.modelComponent",

    modelListeners: {
        "{app}.model.locale": {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{dialog}.dialog",
                "onLocaleChanged",
                "{app}.model.locale"
            ]
        }
    }
});

/**
 * Listens for events from the renderer process (the BrowserWindow).
 */
fluid.defaults("gpii.app.channelListener", {
    gradeNames: ["gpii.app.common.simpleChannelListener"],
    ipcTarget: require("electron").ipcMain
});

/**
 * Notifies the render process for main events.
 */
fluid.defaults("gpii.app.channelNotifier", {
    gradeNames: ["gpii.app.common.simpleChannelNotifier", "gpii.app.i18n.channel"],
    // TODO improve `i18n.channel` to use event instead of a direct notifying
    ipcTarget: "{dialog}.dialog.webContents" // get the closest dialog
});


