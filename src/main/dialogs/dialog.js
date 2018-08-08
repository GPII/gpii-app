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
        // dialog behaviour settings
        showInactive: false,

        // Whether to position the dialog after creation. This is used instead of x and y as raw
        // options as they depend on the offset and latter is not yet defined at the time of the
        // dialog creation
        positionOnInit: true,

        // Whether the window is hidden offscreen and should be treated as such. It's usage is
        // mainly assotiated with the `gpii.app.dialog.offScreenHidable` grade
        offScreenHide: false,

        // Whether the windows can be closed at all. In case this setting is active the only
        // way for a window to be closed is through the usage of the `destroy` method and
        // a close command would simply hide the window.
        // This is mainly needed to avoid closing a window using the Alf + F4 combination
        closable: true,

        restrictions: {
            minHeight: null
        },

        // params for the BrowserWindow instance
        params: null,

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
        // XXX move to the model probably
        width:  "{that}.options.config.attrs.width", // the actual width of the content
        height: "{that}.options.config.attrs.height", // the actual height of the content

        dialog: {
            expander: {
                funcName: "gpii.app.dialog.makeDialog",
                args: [
                    "{that}",
                    "{that}.options.config.attrs",
                    "{that}.options.config.url",
                    "{that}.options.config.params"
                ]
            }
        }
    },

    modelListeners: {
        isShown: {
            funcName: "gpii.app.dialog.toggle",
            args: ["{that}", "{change}.value", "{that}.options.config.showInactive"],
            namespace: "impl",
            excludeSource: "init"
        }
    },
    listeners: {
        "onCreate.postInit": {
            funcName: "gpii.app.dialog.onDialogCreated",
            args: ["{that}"]
        },
        "onDestroy.cleanupElectron": {
            this: "{that}.dialog",
            method: "destroy"
        }
    },
    invokers: {
        /// XXX The `setBounds` function is used instead of
        /// `setPosition` alone because of a
        // related Electron issue https://github.com/electron/electron/issues/9477
        //
        // Changing the position of a BrowserWindow when the scale factor is different than
        // the default one ( that is 100% ) changes the window's size (either width of height).
        // To ensure its size is correct simply reset the size of the window with its stored one.
        // Once the issues is addressed this can be changed back to simple `setPosition` functionality
        setPosition: {
            funcName: "gpii.app.dialog.setBounds",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{that}.width",
                "{that}.height",
                "{arguments}.0", // offsetX
                "{arguments}.1"  // offsetY
            ]
        },
        setBounds: {
            funcName: "gpii.app.dialog.setBounds",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{arguments}.0", // width
                "{arguments}.1", // height
                "{arguments}.2", // offsetX
                "{arguments}.3"  // offsetY
            ]
        },
        setRestrictedSize: {
            funcName: "gpii.app.dialog.setRestrictedSize",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{arguments}.0", // width
                "{arguments}.1"  // height
            ]
        },
        _show: {
            funcName: "gpii.app.dialog._show",
            args: [
                "{that}",
                "{arguments}.0" // showInactive
            ]
        },
        _hide: {
            this: "{that}.dialog",
            method: "hide"
        },
        show: {
            funcName: "gpii.app.dialog.show",
            args: ["{that}"]
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
 * @param {Component} that - The raw Electron `BrowserWindow` settings
 * @param {Object} windowOptions - The raw Electron `BrowserWindow` settings
 * @param {String} url - The URL to be loaded in the `BrowserWindow`
 * @param {Object} params -  Options that are to be supplied to the render process of
 * the newly created BrowserWindow
 * @return {BrowserWindow} The Electron `BrowserWindow` component
 */
gpii.app.dialog.makeDialog = function (that, windowOptions, url, params) {
    var dialog = new BrowserWindow(windowOptions);

    dialog.loadURL(url);

    // Keep record in the window itself for its wrapping grade
    dialog.grade = that.options.gradeNames[that.options.gradeNames.length - 1];

    // Approach for sharing initial options for the renderer process
    // proposed in: https://github.com/electron/electron/issues/1095
    dialog.params = params || {};

    // ensure the window is hidden properly
    if (that.options.config.offScreenHide && !windowOptions.show) {
        gpii.app.dialog.offScreenHidable.moveOffScreen(dialog);
        dialog.show();
    }

    if (!that.options.config.closable) {
        // As proposed in https://github.com/electron/electron/issues/6702
        dialog.on("close", function (e) {
            that.hide();
            e.preventDefault();
        });
    }

    return dialog;
};

gpii.app.dialog.onDialogCreated = function (that) {
    if (that.options.config.positionOnInit) {
        that.setPosition();
    }
};


gpii.app.dialog.show = function (that) {
    if (that.model.isShown) {
        that.focus();
    } else {
        that.applier.change("isShown", true);
    }
};


/**
 * TODO
 *
 * @param that
 * @param showInactive
 * @returns {undefined}
 */
gpii.app.dialog._show = function (that, showInactive) {
    var showMethod = showInactive ?
        that.dialog.showInactive :
        that.dialog.show;

    showMethod.call(that.dialog);
};

/**
 * Default show/hide behaviour of the electron `BrowserWindow` dialog, depending
 * on the `isShown` flag state.
 * In case it is shown, resets the position and shows the current dialog (`BrowserWindow`).
 * The reset is needed in order to handle cases such as resolution or
 * DPI settings changes.
 * @param {Component} that - The diolog component to be shown
 * @param {Boolean} isShown - Whether the window has to be shown
 * @param {Boolean} showInactive - Whether the window has to be shown inactive (not focused)
 */
gpii.app.dialog.toggle = function (that, isShown, showInactive) {
    if (isShown) {
        that._show(showInactive);
        that.events.onDialogShown.fire();
    } else {
        that._hide();
        that.events.onDialogHidden.fire();
    }
};

/**
 * Both resizes the current window and repositions it.
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Object} restrictions - Restrictions for resizing and positioning the window
 * @param {Number} width - The new width for the window
 * @param {Number} height - The new height for the window
 * @param {Number} offsetX - The new width for the window
 * @param {Number} offsetY - The new height for the window
 */
gpii.app.dialog.setBounds = function (that, restrictions, width, height, offsetX, offsetY) {
    // XXX Unites both setPosition and setRestrictedSize but cannot use them separately
    // As default use currently set values
    offsetX  = fluid.isValue(offsetX) ? offsetX : that.model.offset.x;
    offsetY  = fluid.isValue(offsetY) ? offsetY : that.model.offset.y;
    width    = fluid.isValue(width)   ? width : that.width;
    height   = fluid.isValue(height)  ? height : that.height;

    // apply restrictions
    if (restrictions.minHeight) {
        height = Math.max(height, restrictions.minHeight);
    }

    var bounds = gpii.browserWindow.computeWindowBounds(width, height, offsetX, offsetY);

    that.width  = width;
    that.height = height;
    that.applier.change("offset", { x: offsetX, y: offsetY });

    that.dialog.setBounds(bounds);
};



/**
 * Resizes the Electron BrowserWindow. Ensures that the window will be resized to fit the available screen
 * area.
 *
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Number} [width] - The desired width for the window
 * @param {Number} [height] - The desired height for the window
 */
gpii.app.dialog.setRestrictedSize = function (that, restrictions, width, height) {
    // ensure the whole window is visible
    var offset = that.model.offset;

    width  = width  || that.width;
    height = height || that.height;

    // apply restrictions
    if (restrictions.minHeight) {
        height = Math.max(height, restrictions.minHeight);
    }

    var size = gpii.browserWindow.computeWindowSize(width, height, offset.x, offset.y);

    that.width  = width;
    that.height = height;

    that.dialog.setSize(size.width, size.height);
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

