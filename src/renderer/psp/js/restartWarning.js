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
            settings: [],
            solutionNames: [],
            restartText: ""
        },
        modelRelay: {
            restartText: {
                target: "restartText",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.restartWarning.getRestartText",
                    args: ["{that}.options.labels.restartText", "{that}.model.solutionNames"]
                }
            }
        },
        modelListeners: {
            settings: {
                funcName: "gpii.psp.restartWarning.onSettingsChanged",
                args: ["{that}", "{change}.value"]
            },
            solutionNames: {
                funcName: "gpii.psp.restartWarning.toggleVisibility",
                args: ["{that}.container", "{change}.value"]
            },
            restartText: {
                this: "{that}.dom.restartText",
                method: "text",
                args: ["{that}.model.restartText"]
            }
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
        events: {
            onSettingAltered: null
        },
        listeners: {
            onSettingAltered: {
                funcName: "gpii.psp.restartWarning.alterSolutionNames",
                args: ["{that}", "{that}.model.settings", "{arguments}.0"]
            }
        },
        labels: {
            restartText: "To apply your changes, the following applications need to restart: ",
            cancel: "Cancel\n(Undo Changes)",
            restartNow: "Restart Now",
            restartLater: "Close and\nRestart Later"
        }
    });

    gpii.psp.restartWarning.onSettingsChanged = function (restartWarning, settings) {
        if (settings.length === 0) {
            restartWarning.applier.change("solutionNames", []);
        }
    };

    gpii.psp.restartWarning.alterSolutionNames = function (restartWarning, settings, path) {
        var solutionNames = restartWarning.model.solutionNames,
            setting = fluid.find_if(settings, function (setting) {
                return setting.path === path;
            }),
            dynamicity = setting.dynamicity,
            solutionName = setting.solutionName;

        if (!fluid.isValue(dynamicity) || dynamicity === "none" || solutionNames[0] === "Windows") {
            return;
        }

        if (setting.dynamicity === "os") {
            solutionNames = ["Windows"];
        } else if (fluid.isValue(solutionName) && solutionNames.indexOf(solutionName) < 0) {
            solutionNames = fluid.copy(solutionNames);
            solutionNames.push(solutionName);
        }

        restartWarning.applier.change("solutionNames", solutionNames);
    };

    gpii.psp.restartWarning.getRestartText = function (prefix, solutionNames) {
        if (solutionNames.length === 0) {
            return "";
        }
        return prefix + solutionNames.join(", ");
    };

    gpii.psp.restartWarning.toggleVisibility = function (container, solutionNames) {
        if (solutionNames.length === 0) {
            container.hide();
        } else {
            container.show();
        }
    };
})(fluid);
