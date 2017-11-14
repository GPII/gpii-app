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
    fluid.defaults("gpii.psp.restartWarning", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            solutionNames: ["JAWS"]
        },
        selectors: {
            restartText: ".flc-restartText",
            cancel: ".flc-restartCancel",
            restartNow: ".flc-restartNow",
            restartLater: ".flc-restartLater"
        },
        components: {
            cancelBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.cancel",
                options: {
                    label: "{restartWarning}.options.labels.cancel",
                    invokers: {
                        onClick: fluid.identity
                    }
                }
            },
            restartNowBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartNow",
                options: {
                    label: "{restartWarning}.options.labels.restartNow",
                    invokers: {
                        onClick: fluid.identity
                    }
                }
            },
            restartLaterBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartLater",
                options: {
                    label: "{restartWarning}.options.labels.restartLater",
                    invokers: {
                        onClick: fluid.identity
                    }
                }
            }
        },
        labels: {
            restartText: "To apply your changes, the following applications need to restart: ",
            cancel: "Cancel\n(Undo Changes)",
            restartNow: "Restart Now",
            restartLater: "Close and\nRestart Later"
        },
        modelListeners: {
            solutionNames: {
                funcName: "gpii.psp.setRestartText",
                args: ["{that}.dom.restartText", "{that}.options.labels.restartText", "{that}.model.solutionNames"]
            }
        }
    });

    gpii.psp.setRestartText = function (restartText, text, solutionNames) {
        restartText.text(text + solutionNames.join(", "));
    };
})(fluid);
