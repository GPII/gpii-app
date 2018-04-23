/**
 * The restart warning appearing at the bottom of the PSP window
 *
 * A component representing the restart warning which appears at the bottom of the PSP
 * whenever an application or the OS needs to be restarted in order for a setting to be
 * applied. Contains the restart message and the cancel, restart now and restart later
 * buttons.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    /**
     * A base component (controller) for display and handling of settings that require
     * restart of application or the OS. Includes logic for displaying the names of the
     * applications which require a restart and firing the appropriate events
     * when the user presses either of the three action buttons.
     * Includes three actions:
     * Cancel (undo changes); Restart now; Close and Restart later
     */
    fluid.defaults("gpii.psp.baseRestartWarning", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            pendingChanges: [],
            solutionNames: [],
            restartText: "",

            messages: {
                osName: null,
                osRestartText: null,
                restartText: null,

                undo: null,
                restartLater: null,
                restartNow: null
            }
        },

        modelRelay: {
            solutionNames: {
                target: "solutionNames",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.baseRestartWarning.getSolutionsNames",
                    args: [
                        "{that}.model.messages",
                        "{that}.model.pendingChanges"
                    ]
                }
            },
            restartText: {
                target: "restartText",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.baseRestartWarning.generateRestartText",
                    args: [
                        "{that}.model.messages",
                        "{that}.model.solutionNames"
                    ]
                }
            }
        },
        modelListeners: {
            restartText: {
                this: "{that}.dom.restartText",
                method: "text",
                args: ["{that}.model.restartText"]
            }
        },
        selectors: {
            restartText: ".flc-restartText",
            restartNow: ".flc-restartNow",
            restartLater: ".flc-restartLater",
            undo: ".flc-restartUndo"
        },
        components: {
            cancelBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.undo",
                options: {
                    model: {
                        label: "{baseRestartWarning}.model.messages.undo"
                    },
                    invokers: {
                        onClick: "{baseRestartWarning}.events.onUndoChanges.fire"
                    }
                }
            },
            restartNowBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartNow",
                options: {
                    model: {
                        label: "{baseRestartWarning}.model.messages.restartNow"
                    },
                    invokers: {
                        onClick: "{baseRestartWarning}.events.onRestartNow.fire"
                    }
                }
            },
            restartLaterBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.restartLater",
                options: {
                    model: {
                        label: "{baseRestartWarning}.model.messages.restartLater"
                    },
                    invokers: {
                        onClick: "{baseRestartWarning}.events.onRestartLater.fire"
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
            onRestartNow: null,
            onRestartLater: null,
            onUndoChanges: null
        }
    });

    /**
     * Returns the solution names (i.e. the names of the applications which should
     * be restarted) that correspond to the currently pending setting changes. If
     * a given setting does not have a solution name, its title will be used instead.
     * If there is at least one setting which requires the OS to be restarted, then
     * the only solution name that will be returned will be the OS name.
     * @param messages {Object} An object containing various messages used throughout
     * the component.
     * @param pendingChanges {Array} An array containing all pending setting changes.
     * @return the solutions names or titles corresponding to the applications
     * that need to be restarted.
     */
    gpii.psp.baseRestartWarning.getSolutionsNames = function (messages, pendingChanges) {
        var isOSRestartNeeded = fluid.find_if(pendingChanges, function (pendingChange) {
            return pendingChange.liveness === "OSRestart";
        });

        if (isOSRestartNeeded) {
            return [messages.osName];
        }

        return fluid.accumulate(pendingChanges, function (pendingChange, solutionNames) {
            var solutionName = fluid.isValue(pendingChange.solutionName) ?
                                    pendingChange.solutionName :
                                    pendingChange.schema.title;
            if (fluid.isValue(solutionName) && solutionNames.indexOf(solutionName) < 0) {
                solutionNames.push(solutionName);
            }
            return solutionNames;
        }, []);
    };

    /**
     * Returns the text which is to be displayed in the component based on the solution
     * names corresponding to the pending setting changes.
     * @param messages {Object} An object containing various messages used throughout
     * the component.
     * @param solutionNames {Array} the solutions names or titles corresponding to the
     * applications that need to be restarted.
     * @return {String} The text which is to be displayed in the component.
     */
    gpii.psp.baseRestartWarning.generateRestartText = function (messages, solutionNames) {
        if (solutionNames[0] === messages.osName) {
            return messages.osRestartText;
        }

        if (messages.restartText) {
            return fluid.stringTemplate(messages.restartText, { solutions: solutionNames.join(", ")});
        }
    };

    /**
     * A component used at the bottom of the PSP (between the settings list and
     * the footer) to indicate that there are pending setting changes. Has dynamic
     * showing/hiding behaviour dependent on the list of pending changes.
     * Currently it is shown always when there is at least one pending change.
     */
    fluid.defaults("gpii.psp.restartWarning", {
        gradeNames: ["gpii.psp.baseRestartWarning", "gpii.psp.heightObservable"],

        modelRelay: {
            restartIcon: {
                target: "restartIcon",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.restartWarning.getRestartIcon",
                    args: ["{that}.model.messages", "{that}.model.solutionNames", "{that}.options.styles"]
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
            }
        },

        selectors: {
            restartIcon: ".flc-restartIcon"
        },

        styles: {
            osRestartIcon: "fl-icon-osRestart",
            applicationRestartIcon: "fl-icon-appRestart"
        }
    });

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
        restartWarning.events.onHeightChanged.fire();
    };

    /**
     * Returns the CSS class which is to be applied to the icon in the component based
     * on whether an application or the whole OS needs to be restarted.
     * @param messages {Object} An object containing various messages used throughout
     * the component.
     * @param solutionNames {Array} the solutions names or titles corresponding to the
     * applications that need to be restarted.
     * @param styles {Object} An object containing the CSS classes used in the component.
     * @return the CSS class to be applied to the icon.
     */
    gpii.psp.restartWarning.getRestartIcon = function (messages, solutionNames, styles) {
        return solutionNames[0] === messages.osName ? styles.osRestartIcon : styles.applicationRestartIcon;
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
})(fluid);
