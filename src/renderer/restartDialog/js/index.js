/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    fluid.defaults("gpii.restartDialog", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            solutionNames: []
        },
        selectors: {
            close: ".flc-close",
            title: ".flc-popup-title",
            body: ".flc-popup-bodyText",

            cancel: ".flc-restartCancel",
            restartNow: ".flc-restartNow",
            restartLater: ".flc-restartLater"
        },

        modelListeners: {
            solutionNames: {
                this: "{that}.dom.body",
                method: "text",
                args: "{that}.options.labels.restartBody"
            }
        },

        listeners: {
            "onCreate.setText": {
                this: "{that}.dom.title",
                method: "text",
                args: "{that}.options.labels.restartTitle"
            },
            "onCreate.log": {
                this: "console",
                method: "log",
                args: ["{that}.dom.body", "{that}.options.labels.restartBody"],
                priority: "last"
            }
        },

        components: {
            closeBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.close",
                options: {
                    invokers: {
                        onClick: "{restartDialog}.events.onClosed.fire"
                    }
                }
            },
            cancelBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.cancel",
                options: {
                    label: "{restartDialog}.options.labels.cancel",
                    invokers: {
                        onClick: "{restartDialog}.events.onUndoChanges.fire"
                    }
                }
            },
            restartNowBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartNow",
                options: {
                    label: "{restartDialog}.options.labels.restartNow",
                    invokers: {
                        onClick: "{restartDialog}.events.onRestartNow.fire"
                    }
                }
            },
            restartLaterBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartLater",
                options: {
                    label: "{restartDialog}.options.labels.restartLater",
                    invokers: {
                        onClick: "{restartDialog}.events.onRestartLater.fire"
                    }
                }
            }
        },
        events: {
            onSettingAltered: null,

            onUndoChanges: null,
            onRestartLater: null,
            onRestartNow: null,
            onClosed: null
        },
        labels: {
            restartTitle: "Changes require restart",
            restartBody: "In order to be applied, some of the changes you made require the following applications to restart: %solutions \n What would you like to do?",
            cancel: "Cancel\n(Undo Changes)",
            restartNow: "Restart Now",
            restartLater: "Close and\nRestart Later"
        }
    });

    gpii.restartDialog.getRestartText = function (prefix, solutionNames) {
        if (solutionNames.length === 0) {
            return "";
        }
        return prefix + solutionNames.join(", ");
    };
})(fluid);
