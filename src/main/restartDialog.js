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
var gpii  = fluid.registerNamespace("gpii");

require("./utils.js");

// TODO extract to separate dialog
require("./waitDialog.js");

fluid.defaults("gpii.app.dialog.restartDialog.channel", {
    gradeNames: ["fluid.component"],

    events: {
        // onRestart: null,
        // onClose: null,
            // TODO probably not needed
        // onRestartLater: null
    },

        // TODO register for messages from window
    // listeners: {
    //     "onCreate.registerChannel": {
    //         funcName: "gpii.app.dialog.registerWarningDialogChannel",
    //         args: "{dialog}.dialog"
    //     }
    // },

    invokers: {
        updateSolutions: {
            // TODO rename function
            funcName: "gpii.app.notifyWindow",
            args: [
                "{dialog}.dialog",
                // TODO create 
                "onSolutionsUpdated", // rethink channel name
                "{arguments}.0"
            ]
        }
    }
});


fluid.defaults("gpii.app.dialog.restartDialog", {
    gradeNames: ["gpii.app.dialog"],

    model: {
        affectedSolutions: []
    },

    // listeners: {
    //     "onCreate.log": {
    //         func: "{that}.show"
    //     }
    // },

    invokers: {
        show: {
            changePath: "showDialog",
            value: true
        }
    },

    config: {
        attrs: {
            // width: 300,
            // height: 200
        },
        // TODO extract somehow?
        url: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: [
                    "file://%gpii-app/src/renderer/restartDialog/index.html",
                    "@expand:fluid.module.terms()"
                ]
            }
        }
    },
    events: {
        onRestart: null,
        onClose: null,
        // TODO probably not needed
        onRestartLater: null
    },

    components: {
        dialogChannel: {
            // TODO pass {that}?
            type: "gpii.app.dialog.restartDialog.channel",
            // createOnEvent: "onDialogCreated", // TODO
            options: {
                events: {
                    onRestart: "{restartDialog}.events.onRestart",
                    onClose: "{restartDialog}.events.onClose",
                    // TODO probably not needed
                    onRestartLater: "{restartDialog}.events.onRestartLater"

                },

                // XXX find a better way
                modelListeners: {
                    "{restartDialog}.model.affectedSolutions": {
                        func: "{dialogChannel}.updateSolutions",
                        args: "{change}.value"
                    }
                }
            }
        }
    }
});
