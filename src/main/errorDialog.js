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

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./utils.js");

/**
 * A component that serves as simple interface for communication with the
 * electron `BrowserWindow` restart dialog.
 */
fluid.defaults("gpii.app.dialog.errorDialog.channel", {
    gradeNames: ["fluid.component"],

    events: {
        // TODO
        onClosed: null // provided by parent component
    },

    invokers: {
        update: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{dialog}.dialog",
                "onUpdate",
                "{arguments}.0"
            ]
        }
    }
});


fluid.defaults("gpii.app.errorDialog", {
    gradeNames: ["gpii.app.dialog"],

    timeout: 15000,

    config: {
        attrs: {
            width: 400,
            height: 300
        },
        fileSuffixPath: "errorDialog/index.html"
    },

    listeners: {
//        "onCreate.autoclose": {
//            funcName: "gpii.app.errorDialog.autoClose",
//            args: ["{that}", "{that}.options.timeout"]
//        }
    },

    components: {
        dialogChannel: {
            type: "gpii.app.dialog.errorDialog.channel"
        }
    },


    invokers: {
        show: {
            funcName: "gpii.app.errorDialog.show",
            args: ["{that}", "{arguments}.0"]
        }
    }
});

gpii.app.errorDialog.autoClose = function (that, timeout) {
    setTimeout(function () {
        that.applier.change("isShown", false);
    }, timeout);
};

gpii.app.errorDialog.show = function (that, config) {
    that.dialogChannel.update(config);
    that.applier.change("isShown", true);
};
