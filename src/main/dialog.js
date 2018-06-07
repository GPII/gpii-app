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
var BrowserWindow = require("electron").BrowserWindow;

var gpii  = fluid.registerNamespace("gpii");

require("./resizable.js");
require("./utils.js");
require("../common/channelUtils.js");


fluid.registerNamespace("gpii.app.dialog");


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
 * TODO positioning
 *  Positioning of the window is relative to the bottom right corner of the screen (contrary to the 
 *  behaviour of the Electron positioning approach) as most windows are positioned in that exact region.
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
    gradeNames: ["fluid.modelComponent", "gpii.app.resizable"],

    model: {
        isShown: false,
        // the positions of the window,
        // represented as offset from the bottom right corner;
        // by default the window is positioned in the bottom right corner
        offset: {
            x: 0,
            y: 0
        }
    },

    events: {
        onDialogShown: null,
        onDialogHidden: null
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
    listeners: {
        "onCreate.positionWindow": {
            func: "{that}.repositionWindow",
            args: []
        },
        "onDestroy.cleanupElectron": {
            this: "{that}.dialog",
            method: "destroy"
        }
    },
    invokers: {
        // TODO rename to positionDialog
        positionWindow: {
            funcName: "gpii.app.dialog.positionDialog",
            args: [
                "{that}",
                "{arguments}.0", // offsetX
                "{arguments}.1"  // offsetY
            ]
        },
        repositionWindow: {
            func: "{that}.positionWindow",
            args: [
                "{that}.model.offset.x", // offsetX
                "{that}.model.offset.y"  // offsetX
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
 * TODO
 * In case offset is not given, the current offset will be used
 *
 * @param that
 * @param [offsetX]
 * @param [offsetY]
 * @returns {undefined}
 */
gpii.app.dialog.positionDialog = function (that, offsetX, offsetY) {
    that.applier.change("offset", { x: offsetX, y: offsetY });

    gpii.browserWindow.positionWindow(that.dialog, offsetX, offsetY);
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
gpii.app.dialog.toggle = function (that, isShown, showInactive) {
    var showMethod = showInactive ?
        that.dialog.showInactive :
        that.dialog.show;

    if (isShown) {
        that.repositionWindow();
        showMethod.call(that.dialog);
        that.events.onDialogShown.fire();
    } else {
        that.dialog.hide();
        that.events.onDialogHidden.fire();
    }
};

/**
 * Resizes the current window and repositions it to match the new size.
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Number} windowWidth - The new width for the window
 * @param {Number} windowHeight - The new height for the window
 */
gpii.app.dialog.resize = function (that, windowWidth, windowHeight) {
    var offset = that.model.offset;

    // TODO move to the browserWindow utils section
    var bounds = gpii.browserWindow.getDesiredWindowBounds(windowWidth, windowHeight, offset.x, offset.y);
    // XXX DEV
    console.log("DIALOG: ", bounds, that.options.gradeNames.slice(-1));
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
        onDialogCreate: null,
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

/**
 * TODO
 */
fluid.defaults("gpii.app.dialog.delayedShow", {
    gradeNames: ["gpii.app.timer"],

    // the desired delay in milliseconds
    showDelay: null,

    listeners: {
        onTimerFinished: {
            func: "{that}._show"
            // arguments are passed with the event
        }
    },

    invokers: {
        // _show: null, // expected from implementor
        // _hide: null,
        show: {
            funcName: "gpii.app.dialog.delayedShow.show",
            args: [
                "{that}",
                "{that}.options.showDelay",
                "{arguments}" // showArgs
            ]
        },
        hide: {
            funcName: "gpii.app.dialog.delayedShow.hide",
            args: ["{that}"]
        }
    }
});

gpii.app.dialog.delayedShow.show = function (that, delay, showArgs) {
    // process raw arguments
    showArgs = fluid.values(showArgs);

    if (!fluid.isValue(delay)) {
        // simply trigger a show synchronously
        that.events.onTimerFinished.fire.apply(that.events.onTimerFinished, showArgs);
    } else if (Number.isInteger(delay)) {
        that.start(delay, showArgs);
    } else {
        fluid.fail("Dialog's delay must be a number.");
    }
};

gpii.app.dialog.delayedShow.hide = function (that) {
    // clear any existing timer
    that.clear();

    that._hide();
};
