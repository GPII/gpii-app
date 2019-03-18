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
var ipcMain       = require("electron").ipcMain;

var gpii  = fluid.registerNamespace("gpii");

require("./resizable.js");

fluid.registerNamespace("gpii.app.dialog");


/**
 * Base dialog component that provides initialization of an Electron `BrowserWindow` and the generation of
 * the file URL that is to be loaded in the same `BrowserWindow`.
 * NOTE: The generated URL is always relative to the working directory of the application (`module.terms()`)
 *
 * It also provides show/hide operations of the window through interaction with the `isShown` property of
 * the component and handles Electron objects cleanup upon destruction.
 *
 * Positioning of the window is relative to the bottom right corner of the screen (contrary to the
 * default Electron positioning behaviour in the center of the screen).
 *
 * Requires:
 * - (optional) `attrs` - used as raw options for `BrowserWindow` generation.
 *   For full options list:  https://github.com/electron/electron/blob/master/docs/api/browser-window.md
 * - relative path from the application's working directory
 *    - `fileSuffixPath` - the suffix to the file
 *    - `filePrefixPath` (optional) - the prefix to the file
 *
 *   For example, a relative path such as `"/src/rendered/waitDialog/index.html"` might be split into:
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
        },

        scaleFactor: 1,                                   // the actual scale factor
        width:       "{that}.options.config.attrs.width", // the actual width of the content
        height:      "{that}.options.config.attrs.height" // the actual height of the content
    },

    events: {
        onDialogShown: null,
        onDialogHidden: null,
        /*
         * Event fired when the current dialog is fully created (its renderer components
         * have been successfully initialized).
         */
        onDialogReady: null
    },

    config: {
        // dialog behaviour settings
        showInactive: false,

        // Whether to position the dialog after creation. This is used instead of x and y as raw
        // options as they depend on the offset and the latter is not yet defined at the time of the
        // dialog creation
        positionOnInit: true,

        // Whether to the destroy the component after its dialog (BrowserWindow) is destroyed. It
        // is more convenient that the component gets destroyed as it can't behave properly without
        // its BrowserWindow. Note that the `closed` event fires both when it is closed programatically
        // or via the close button in the upper right corner but it might not be fired when the `destroy`
        // method is used on the BrowserWindow.
        destroyWithWindow: true,

        // Whether the window is hidden offscreen and should be treated as such. Its usage is
        // mainly assotiated with the `gpii.app.dialog.offScreenHidable` grade
        hideOffScreen: false,

        // Whether the window can be closed (which will destroy it). In case
        // this setting is active the only way for a window to be closed is through
        // the usage of the `destroy` method and a close command would simply hide the window.
        // This is mainly needed to avoid closing a window using the Alf + F4 combination
        destroyOnClose: false,

        // Whether to register a listener for BrowserWindow "readiness". The BrowserWindow is ready
        // once all its components are created. Once a window is ready the `onDialogReady` event will
        // be fired.
        // N.B. In order this event to be triggered, the corresponding renderer process should
        // implement the mechanism for notifying readiness that is using
        // the "gpii.psp.baseWindowCmp.signalDialogReady" grade
        awaitWindowReadiness: false,

        restrictions: {
            minHeight: null
        },

        // Forbids the user from changing the zoom level in a BrowserWindow
        disablePinchZoom: true,

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
            type: "toolbar",
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
        /**
         * Blurrable dialogs will have the `gradeNames` property which will hold all gradeNames
         * of the containing component. Useful when performing checks about the component if
         * only its dialog is available. An example of such a situation is when retrieving the
         * currently focused window via the static method `BrowserWindow.getFocusedWindow`. This
         * function returns an Electron's `BrowserWindow` instance which will have the `gradeNames`
         * property and there will be no need to look up the Infusion component if only its grades
         * can suffice for whatever checks are performed.
         * Please see `blurrable.js` for how this property is used so that it can be determined if
         * the newly focused window is "linked" to the current window (with respect to the blurring
         * behavior).
         */
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
            funcName: "gpii.app.dialog.handleShownStateChange",
            args: ["{that}", "{change}.value", "{that}.options.config.showInactive"],
            namespace: "impl",
            excludeSource: "init"
        },
        scaleFactor: {
            funcName: "gpii.app.dialog.rescaleDialog",
            args: [
                "{that}",
                "{change}.value",
                "{change}.oldValue"
            ],
            namespace: "rescaleDialog",
            excludeSource: "init"
        }
    },
    listeners: {
        "onCreate.positionOnInit": {
            funcName: "gpii.app.dialog.positionOnInit",
            args: ["{that}"]
        },
        "onCreate.registerDialogReadyListener": {
            funcName: "gpii.app.dialog.registerDailogReadyListener",
            args: "{that}"
        },
        "onCreate.applyScaleFactor": {
            funcName: "gpii.app.dialog.rescaleDialog",
            args: ["{that}", "{that}.model.scaleFactor"]
        },
        "onDestroy.cleanupElectron": {
            this: "{that}.dialog",
            method: "destroy",
            priority: "last"
        }
    },
    invokers: {
        // Returns object with the pre-calculated scaled width, height, and offset
        // of the buttons. Takes the old and the new scale factors as arguments
        getScaledMetrics: {
            funcName: "gpii.app.dialog.getScaledMetrics",
            args: [
                "{that}",
                "{arguments}.0", // scaleFactor
                "{arguments}.1"  // oldScaleFactor
            ]
        },
        // Returns the total width of the component which must be taken into account when
        // fitting the window into the available screen space. Usually it will be only the
        // width of the component but in some special cases (such as the QSS) it may differ.
        getExtendedWidth: {
            funcName: "fluid.identity",
            args: ["{that}.model.width"]
        },
        // Changing the position of a BrowserWindow when the scale factor is different than
        // the default one (100%) changes the window's size (either width or height).
        // To ensure its size is correct simply set the size of the window again with the one
        // that has already been stored.
        // Related Electron issue: https://github.com/electron/electron/issues/9477
        // Once fixed we can move back to using the native `setPosition` method of the
        // `BrowserWindow` instead of `setBounds`.
        setPosition: {
            funcName: "gpii.app.dialog.setBounds",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{that}.model.width",
                "{that}.model.height",
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
        showImpl: {
            funcName: "gpii.app.dialog.showImpl",
            args: [
                "{that}",
                "{arguments}.0" // showInactive
            ]
        },
        hideImpl: {
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
        toggle: {
            changePath: "isShown",
            value: "@expand:fluid.negate({that}.model.isShown)"
        },
        focus: {
            this: "{that}.dialog",
            method: "focus"
        },
        close: {
            funcName: "gpii.app.dialog.close",
            args: ["{that}"]
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
 * Creates a dialog. This is done upfront to avoid the delay from creating a new
 * dialog every time the displayed content should change.
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Object} windowOptions - The raw Electron `BrowserWindow` settings
 * @param {String} url - The URL to be loaded in the `BrowserWindow`
 * @param {Object} params -  Options that are to be supplied to the render process of
 * the newly created BrowserWindow
 * @return {BrowserWindow} The Electron `BrowserWindow` component
 */
gpii.app.dialog.makeDialog = function (that, windowOptions, url, params) {
    var dialog = new BrowserWindow(windowOptions);

    dialog.loadURL(url);

    /*
     * Use the component's unique identifier as a way for backward relation from the
     * BrowserWindow. Keep that id in the window itself.
     */
    dialog.relatedCmpId = that.id;

    // Approach for sharing initial options for the renderer process
    // proposed in: https://github.com/electron/electron/issues/1095
    dialog.params = params || {};

    if (!that.options.config.destroyOnClose) {
        // As proposed in https://github.com/electron/electron/issues/6702
        dialog.on("close", function (e) {
            that.hide();
            e.preventDefault();
        });
    }

    if (that.options.config.disablePinchZoom) {
        // Followed this approach https://github.com/electron/electron/issues/8793#issuecomment-334971232
        dialog.webContents.on("did-finish-load", function () {
            // These calls must only happen if the dialog and its contents have not been destroyed, which might
            // occur in test runs.
            if (!dialog.isDestroyed() && !dialog.webContents.isDestroyed()) {
                dialog.webContents.setZoomFactor(1);
                dialog.webContents.setVisualZoomLevelLimits(1, 1);
                dialog.webContents.setLayoutZoomLevelLimits(0, 0);
            }
        });
    }

    return dialog;
};

/**
 * Positions the dialog (if needed) after it has been created.
 * @param {Component} that - The `gpii.app.dialog` instance.
 */
gpii.app.dialog.positionOnInit = function (that) {
    if (that.options.config.positionOnInit) {
        that.setPosition();
    }

    if (that.options.config.destroyWithWindow) {
        that.dialog.on("closed", function () {
            // ensure there isn't some inconsistency
            // it might be the case that the component is destroyed before
            // the BrowserWindow itself
            if (!fluid.isDestroyed(that)) {
                that.destroy();
            }
        });
    }
};

/**
 * Given the new and the previous `scaleFactor` this function computes the new
 * width, height, and offset of the component's `BrowserWindow`. In the typical
 * case, the parameters will be calculated by applying the ratio of the new and
 * the previous `scaleFactor`, but under some circumstances this may differ.
 * For example, the y-offset of the PSP should always be equal to the height
 * of the QSS.
 * @param {Component} model - The `gpii.app.dialog.model` instance.
 * @param {Number} scaleFactor - The new scale factor to be applied.
 * @param {Number} oldScaleFactor - The previous scale factor.
 * @return {Object} The new width, height, and offset of the `BrowserWindow`.
 */
gpii.app.dialog.getScaledMetrics = function (model, scaleFactor, oldScaleFactor) {
    return {
        width: scaleFactor * model.width / oldScaleFactor,
        height: scaleFactor * model.height / oldScaleFactor,
        offset: {
            x: scaleFactor * model.offset.x / oldScaleFactor,
            y: scaleFactor * model.offset.y / oldScaleFactor
        }
    };
};

/**
 * When the `scaleFactor` changes, this function takes care of adjusting the
 * dimensions and position of the dialog as well as of applying the new scale
 * factor to the contents of the `BrowserWindow`.
 * @param {Component} that - The `gpii.app.dialog` instance.
 * @param {Number} scaleFactor - The new scale factor to be applied.
 * @param {Number} oldScaleFactor - The previous scale factor.
 */
gpii.app.dialog.rescaleDialog = function (that, scaleFactor, oldScaleFactor) {
    scaleFactor = scaleFactor || 1;
    oldScaleFactor = oldScaleFactor || 1;

    that.applier.change("", gpii.app.dialog.getScaledMetrics(that.model, scaleFactor, oldScaleFactor));

    gpii.app.dialog.setDialogZoom(that.dialog, scaleFactor);
    that.setBounds();
};

/**
 * Applies a custom scaling factor to the whole HTML page of the dialog.
 * @param {BrowserWindow} dialog - The `BrowserWindow` whose content needs
 * to be scaled up or down.
 * @param {Number} scaleFactor - The scaling factor to be applied.
 */
gpii.app.dialog.setDialogZoom = function (dialog, scaleFactor) {
    var script = fluid.stringTemplate("jQuery(\"body\").css(\"zoom\", %scaleFactor)", {
        // give a slightly smaller scaleFactor to the renderer process to ensure
        // there's a sufficient margin on the left
        scaleFactor: Math.floor(scaleFactor * 100) / 100
    });

    if (dialog) {
        dialog.webContents.executeJavaScript(script);
    }
};

/**
 * Listens for a notification from the corresponding BrowserWindow for components' initialization.
 * It uses a shared channel for dialog creation - `onDialogReady` - where every BrowserWindow of a `gpii.app.dialog`
 * grade may sent a notification for its creation. Messages in this shared channel are distinguished based on
 * an unique identifier that is sent with the notification. The identifier that is sent corresponds to
 * the id of a `gpii.app.dialog` instance.
 * @param {Component} that - The instance of `gpii.app.dialog` component
 */
gpii.app.dialog.registerDailogReadyListener = function (that) {
    // Use a local function so that we can de-register the channel listener when needed
    function handleReadyResponse(event, relatedCmpId) {
        if (that.id === relatedCmpId) {
            that.events.onDialogReady.fire();

            // detach current dialog's "ready listener"
            ipcMain.removeListener("onDialogReady", handleReadyResponse);
        }
    }

    if (that.options.config.awaitWindowReadiness) {
        // register listener that is to be removed once a notification for the current dialog is received
        ipcMain.on("onDialogReady", handleReadyResponse);
    }
};

/**
 * Shows the window if it is currently hidden or focuses it otherwise.
 * This is the simplest way for showing a dialog. If the dialog has
 * other rules for showing itself, this invoker can be overridden.
 * @param {Component} that - The `gpii.app.dialog` instance.
 */
gpii.app.dialog.show = function (that) {
    if (that.model.isShown) {
        that.focus();
    } else {
        that.applier.change("isShown", true);
    }
};

gpii.app.dialog.close = function (that) {
    // update the dialog shown state
    that.hide();

    // init destroying
    that.dialog.close();
};

/**
 * Shows the window by calling the appropriate native `BrowserWindow` method
 * depending on whether the window should be focused when shown. This is a
 * low level utility function which could be useful in case the `show` invoker
 * is overridden.
 * @param {Component} that - The `gpii.app.dialog` instance.
 * @param {Boolean} showInactive - If `true`, the dialog should not have focus
 * when shown. Otherwise it will.
 */
gpii.app.dialog.showImpl = function (that, showInactive) {
    var showMethod = showInactive ?
        that.dialog.showInactive :
        that.dialog.show;

    showMethod.call(that.dialog);
};

/**
 * Default show/hide behaviour of the electron `BrowserWindow` dialog, depending
 * on the `isShown` flag state.
 * @param {Component} that - The diolog component to be shown
 * @param {Boolean} isShown - Whether the window has to be shown
 * @param {Boolean} showInactive - Whether the window has to be shown inactive (not focused)
 */
gpii.app.dialog.handleShownStateChange = function (that, isShown, showInactive) {
    if (isShown) {
        that.showImpl(showInactive);
        that.events.onDialogShown.fire();
    } else {
        that.hideImpl();
        that.events.onDialogHidden.fire();
    }
};

/**
 * Both resizes the current window and positions it appropriately.
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Object} restrictions - Restrictions for resizing and positioning the window
 * @param {Number} width - The new width for the window
 * @param {Number} height - The new height for the window
 * @param {Number} offsetX - The x offset from the right edge of the screen.
 * @param {Number} offsetY - The y offset from the bottom edge of the screen.
 */
gpii.app.dialog.setBounds = function (that, restrictions, width, height, offsetX, offsetY) {
    // As default use currently set values
    offsetX  = fluid.isValue(offsetX) ? offsetX : that.model.offset.x;
    offsetY  = fluid.isValue(offsetY) ? offsetY : that.model.offset.y;
    width    = fluid.isValue(width)   ? width : that.model.width;
    height   = fluid.isValue(height)  ? height : that.model.height;

    // apply restrictions
    if (restrictions.minHeight) {
        var scaleFactor = that.model.scaleFactor;
        height = Math.max(height, scaleFactor * restrictions.minHeight);
    }

    var bounds = gpii.browserWindow.computeWindowBounds(width, height, offsetX, offsetY);

    that.applier.change("width", bounds.width);
    that.applier.change("height", bounds.height);
    that.applier.change("offset", { x: offsetX, y: offsetY });

    that.dialog.setBounds(bounds);
};

/**
 * Resizes the Electron BrowserWindow. Ensures that the window will be resized to fit
 * vertically in the available screen area.
 * @param {Component} that - The `gpii.app.dialog` instance
 * @param {Object} restrictions - Restrictions for resizing and positioning the window
 * @param {Number} [width] - The desired width for the window
 * @param {Number} [height] - The desired height for the window
 */
gpii.app.dialog.setRestrictedSize = function (that, restrictions, width, height) {
    // ensure the whole window is visible
    var offset = that.model.offset;

    width  = width  || that.model.width;
    height = height || that.model.height;

    // apply restrictions
    if (restrictions.minHeight) {
        var scaleFactor = that.model.scaleFactor;
        height = Math.max(height, scaleFactor * restrictions.minHeight);
    }

    var size = gpii.browserWindow.computeWindowSize(width, height, offset.x, offset.y);

    that.applier.change("width", size.width);
    that.applier.change("height", size.height);
    that.dialog.setSize(size.width, size.height);
};

/**
 * A generic channel extension which listens for locale changes and
 * notifies the associated `BrowserWindow`.
 */
fluid.defaults("gpii.app.i18n.channel", {
    gradeNames: "fluid.modelComponent",

    modelListeners: {
        "{app}.model.locale": {
            func: "{that}.handleLocaleChange"
        }
    },

    invokers: {
        handleLocaleChange: {
            funcName: "gpii.app.i18n.channel.handleLocaleChange",
            args: [
                "{that}",
                "{dialog}.dialog",
                "{app}.model.locale"
            ]
        },
        notifyLocaleChange: {
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
 * Use the dialog instance to share the current locale. This is needed
 * for the initial loading of the application as the locale might get
 * updated before the dialog have been fully created.
 * @param {Component} that - The `gpii.app.i18n.channel` instance
 * @param {Object} dialog - An Electron BrowserWindow instance
 * @param {String} locale - The current locale
 */
gpii.app.i18n.channel.handleLocaleChange = function (that, dialog, locale) {
    // Update the locale of the dialog
    dialog.locale = locale;

    that.notifyLocaleChange();
};

/**
 * Listens for events from the renderer process (the BrowserWindow).
 */
fluid.defaults("gpii.app.channelListener", {
    gradeNames: ["gpii.app.shared.simpleChannelListener"],
    ipcTarget: ipcMain
});

/**
 * Notifies the render process for main events.
 */
fluid.defaults("gpii.app.channelNotifier", {
    gradeNames: ["gpii.app.common.simpleChannelNotifier", "gpii.app.i18n.channel"],
    // TODO improve `i18n.channel` to use event instead of a direct notifying
    ipcTarget: "{dialog}.dialog.webContents" // get the closest dialog
});
