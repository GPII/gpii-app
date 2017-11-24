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

var fluid         = require("infusion");
var BrowserWindow = require("electron").BrowserWindow;

var gpii  = fluid.registerNamespace("gpii");

require("./utils.js");


fluid.defaults("gpii.app.dialog", {
    gradeNames: ["fluid.component"],

    config: {
        attrs: {
            width: 800,
            height: 600,
            show: false,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true
        },
        filePrefixPath: "src/renderer",
        fileSuffixPath: null,
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
        // Simple default behaviour
        show: {
            this: "{that}.dialog",
            method: "show"
        },
        hide: {
            this: "{that}.dialog",
            method: "hide"
        }
    }
});


/**
 * Builds a file URL inside the application working directory.
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
 */
gpii.app.dialog.makeDialog = function (windowOptions, position, url) {
    var dialog = new BrowserWindow(windowOptions);
    dialog.setPosition(position.x, position.y);

    dialog.loadURL(url);
    return dialog;
};
