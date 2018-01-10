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

require("./utils.js");


/**
 * Base dialog component that provides initialization of
 * an Electron `BrowserWindow` and the generation of
 * the file URL that is to be loaded in the same `BrowserWindow`.
 * NOTE: The generated URL is always relative to the working
 * directory of the application (`module.terms()`)
 *
 * It also provides a simple interface for show/hide operations of
 * the window and handles Electron objects cleanup upon destruction.
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
    gradeNames: ["fluid.component"],

    config: {
        attrs: {        // raw attributes used in `BrowserWindow` generation
            width: 800,
            height: 600,
            show: false,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true
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
                    "@expand:{that}.getWindowPosition()",
                    "{that}.options.config.url"
                ]
            }
        }
    },
    listeners: {
        "onDestroy.cleanupElectron": {
            this: "{that}.dialog",
            method: "destroy"
        }
    },
    invokers: {
        getWindowPosition: {
            funcName: "gpii.app.getWindowPosition",
            args: [
                "{that}.options.config.attrs.width",
                "{that}.options.config.attrs.height"
            ]
        },
        resetWindowPosition: {
            funcName: "gpii.app.setWindowPosition",
            args: ["{that}.dialog", "@expand:{that}.getWindowPosition()"]
        },
        // Simple default behaviour
        show: {
            funcName: "gpii.app.dialog.show",
            args: ["{that}"]
        },
        hide: {
            this: "{that}.dialog",
            method: "hide"
        },
        close: {
            this: "{that}.dialog",
            method: "close"
        }
    }
});


/**
 * Builds a file URL inside the application **Working Directory**.
 *
 * @param prefixPath {String} Prefix for the file path, e.g. "src/renderer"
 * @param suffixPath {String} Suffix for the file path, e.g. "index.html"
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
 * @param windowOptions {Object} The raw Electron `BrowserWindow` settings
 * @param position {Object} The desired position for the component
 * @param positoins.x {Number}
 * @param positoins.y {Number}
 * @param url {String} The URL to be loaded in the `BrowserWindow`
 * @return {BrowserWindow} The Electron `BrowserWindow` component
 */
gpii.app.dialog.makeDialog = function (windowOptions, position, url) {
    var dialog = new BrowserWindow(windowOptions);
    dialog.setPosition(position.x, position.y);

    dialog.loadURL(url);
    return dialog;
};

/**
 * Resets the position and shows the current dialog (`BrowserWindow`).
 * The reset is needed in order to handle cases such as resolution or
 * DPI settings changes.
 * @param dialog {Component} The diolog component to be shown
 */
gpii.app.dialog.show = function (dialog) {
    dialog.resetWindowPosition();
    dialog.dialog.show();
};
