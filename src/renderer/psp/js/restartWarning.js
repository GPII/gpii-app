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
    /**
     * A component used at the bottom of the PSP (between the settings list and
     * the footer) to indicate that there are pending setting changes. Includes
     * logic for displaying the names of the applications which require a restart,
     * as well as for showing/hiding itself and firing the appropriate events
     * when the user presses either of the three action buttons.
     */
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

    /**
     * Returns the solution names (i.e. the names of the applications which should
     * be restarted) that correspond to the currently pending setting changes. If
     * a given setting does not have a solution name, its title will be used instead.
     * If there is at least one setting which requires the OS to be restarted, then
     * the only solution name that will be returned will be the OS name.
     * @param labels {Object} An object containing various labels used throughout
     * the component.
     * @param pendingChanges {Array} An array containing all pending setting changes.
     * @returns the solutions names or titles corresponding to the applications
     * that need to be restarted.
     */
    gpii.psp.restartWarning.getSolutionsNames = function (labels, pendingChanges) {
        var isOSRestartNeeded = fluid.find_if(pendingChanges, function (pendingChange) {
            return pendingChange.liveness === "OSRestart";
        });

        if (isOSRestartNeeded) {
            return [labels.os];
        }

        return fluid.accumulate(pendingChanges, function (pendingChange, solutionNames) {
            var solutionName = fluid.isValue(pendingChange.solutionName) ?
                                    pendingChange.solutionName : pendingChange.schema.title;
            if (fluid.isValue(solutionName) && solutionNames.indexOf(solutionName) < 0) {
                solutionNames.push(solutionName);
            }
            return solutionNames;
        }, []);
    };

    /**
     * Returns the CSS class which is to be applied to the icon in the component based
     * on whether an application or the whole OS needs to be restarted.
     * @param labels {Object} An object containing various labels used throughout
     * the component.
     * @param solutionNames {Array} the solutions names or titles corresponding to the
     * applications that need to be restarted.
     * @param styles {Object} An object containing the CSS classes used in the component.
     * @return the CSS class to be applied to the icon.
     */
    gpii.psp.restartWarning.getRestartIcon = function (labels, solutionNames, styles) {
        return solutionNames[0] === labels.os ? styles.osRestartIcon : styles.applicationRestartIcon;
    };

    /**
     * Updates the icon in the component based on the passed CSS class.
     * @param restartIcon {jQuery} A jQuery object corresponding to the restart icon.
     * @param restartIconClass {String} the CSS class to be applied to the icon.
     * @param styles {Object} An object containing the CSS classes used in the component.
     */
    gpii.psp.restartWarning.updateIcon = function (restartIcon, restartIconClass, styles) {
        restartIcon
            .removeClass(styles.osRestartIcon)
            .removeClass(styles.applicationRestartIcon)
            .addClass(restartIconClass);
    };

    /**
     * Returns the text which is to be displayed in the component based on the solution
     * names corresponding to the pending setting changes.
     * @param labels {Object} An object containing various labels used throughout
     * the component.
     * @param solutionNames {Array} the solutions names or titles corresponding to the
     * applications that need to be restarted.
     * @returns the text which is to be displayed in the component.
     */
    gpii.psp.restartWarning.getRestartText = function (labels, solutionNames) {
        if (solutionNames.length === 0) {
            return "";
        }

        if (solutionNames[0] === labels.os) {
            return labels.osRestartText;
        }

        return labels.restartText + solutionNames.join(", ");
    };

    /**
     * Shows or hides the restart warning based on whether there is at least one solution
     * name available. Also, it notifies that the height of the component has changed.
     * @param restartWarning {Component} The `gpii.psp.restartWarning` instance.
     * @param container {jQuery} The jQuery object representing the container of the
     * restart warning.
     * @param solutionNames {Array} the solutions names or titles corresponding to the
     * applications that need to be restarted.
     */
    gpii.psp.restartWarning.toggleVisibility = function (restartWarning, container, solutionNames) {
        if (solutionNames.length === 0) {
            container.hide();
        } else {
            container.show();
        }

        // Fire manually the height changed event because the listener is not
        // triggered when the warning has already been hidden.
        restartWarning.events.onContentHeightChanged.fire();
    };
})(fluid);
