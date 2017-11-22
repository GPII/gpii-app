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
            pendingChanges: [],
            solutionNames: [],
            restartText: ""
        },
        modelRelay: {
            solutionNames: {
                target: "solutionNames",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.restartWarning.getSolutionsNames",
                    args: ["{that}.options.labels", "{that}.model.pendingChanges"]
                }
            },
            restartIcon: {
                target: "restartIcon",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.restartWarning.getRestartIcon",
                    args: ["{that}.options.labels", "{that}.model.solutionNames", "{that}.options.styles"]
                }
            },
            restartText: {
                target: "restartText",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.restartWarning.getRestartText",
                    args: ["{that}.options.labels", "{that}.model.solutionNames"]
                }
            }
        },
        modelListeners: {
            solutionNames: {
                funcName: "gpii.psp.restartWarning.toggleVisibility",
                args: ["{that}", "{that}.container", "{change}.value"]
            },
            restartIcon: {
                funcName: "gpii.psp.restartWarning.updateIcon",
                args: ["{that}.dom.restartIcon", "{change}.value", "{that}.options.styles"]
            },
            restartText: {
                this: "{that}.dom.restartText",
                method: "text",
                args: ["{that}.model.restartText"]
            }
        },
        selectors: {
            restartIcon: ".flc-restartIcon",
            restartText: ".flc-restartText",
            cancel: ".flc-restartCancel",
            restartNow: ".flc-restartNow",
            restartLater: ".flc-restartLater",
            heightChangeListener: "#flc-restartHeightChangeListener"
        },
        components: {
            heightChangeListener: {
                type: "gpii.psp.heightChangeListener",
                container: "{that}.dom.heightChangeListener",
                options: {
                    invokers: {
                        onHeightChanged: "{restartWarning}.events.onContentHeightChanged.fire"
                    }
                }
            },
            cancelBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.cancel",
                options: {
                    label: "{restartWarning}.options.labels.cancel",
                    invokers: {
                        onClick: "{restartWarning}.events.onUndoChanges.fire"
                    }
                }
            },
            restartNowBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartNow",
                options: {
                    label: "{restartWarning}.options.labels.restartNow",
                    invokers: {
                        onClick: "{restartWarning}.events.onRestartNow.fire"
                    }
                }
            },
            restartLaterBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartLater",
                options: {
                    label: "{restartWarning}.options.labels.restartLater",
                    invokers: {
                        onClick: "{restartWarning}.events.onRestartLater.fire"
                    }
                }
            }
        },
        invokers: {
            updatePendingChanges: {
                changePath: "pendingChanges",
                value: "{arguments}.0"
            }
        },
        events: {
            onContentHeightChanged: null,

            onRestartNow: null,
            onRestartLater: null,
            onUndoChanges: null
        },
        styles: {
            osRestartIcon: "fl-icon-osRestart",
            applicationRestartIcon: "fl-icon-appRestart"
        },
        labels: {
            os: "Windows",
            osRestartText: "Windows needs to restart to apply your changes",
            restartText: "To apply your changes, the following applications need to restart: ",
            cancel: "Cancel\n(Undo Changes)",
            restartNow: "Restart Now",
            restartLater: "Close and\nRestart Later"
        }
    });

    gpii.psp.restartWarning.getSolutionsNames = function (labels, pendingChanges) {
        var isOSRestartNeeded = fluid.find_if(pendingChanges, function (pendingChange) {
            return pendingChange.liveness === "OSRestart";
        });

        if (isOSRestartNeeded) {
            return [labels.os];
        }

        return fluid.accumulate(pendingChanges, function (pendingChange, solutionNames) {
            var solutionName = fluid.isValue(pendingChange.solutionName) ?
                                    pendingChange.solutionName : pendingChange.title;
            if (fluid.isValue(solutionName) && solutionNames.indexOf(solutionName) < 0) {
                solutionNames.push(solutionName);
            }
            return solutionNames;
        }, []);
    };

    gpii.psp.restartWarning.getRestartIcon = function (labels, solutionNames, styles) {
        if (solutionNames[0] === labels.os) {
            return styles.osRestartIcon;
        }
        return styles.applicationRestartIcon;
    };

    gpii.psp.restartWarning.updateIcon = function (restartIcon, restartIconClass, styles) {
        restartIcon
            .removeClass(styles.osRestartIcon)
            .removeClass(styles.applicationRestartIcon)
            .addClass(restartIconClass);
    };

    gpii.psp.restartWarning.getRestartText = function (labels, solutionNames) {
        if (solutionNames.length === 0) {
            return "";
        }

        if (solutionNames[0] === labels.os) {
            return labels.osRestartText;
        }

        return labels.restartText + solutionNames.join(", ");
    };

    gpii.psp.restartWarning.toggleVisibility = function (that, container, solutionNames) {
        if (solutionNames.length === 0) {
            container.hide();
        } else {
            container.show();
        }

        // Fire manually the height changed event because the listener is not
        // triggered when the warning has already been hidden.
        that.events.onContentHeightChanged.fire();
    };

    var ipcRenderer = require("electron").ipcRenderer;

    ipcRenderer.on("onSolutionsUpdated", function (event, data) {
        console.log("Some data came by: ", data);
    });
})(fluid);
