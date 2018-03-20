/**
 * The restart dialog
 *
 * Represents the restart dialog which appears when there is a pending change and the
 * user has closed the PSP either by clicking outside of it or by using the close button
 * in the upper right corner.
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
    var ipcRenderer = require("electron").ipcRenderer;

    var gpii = fluid.registerNamespace("gpii");


    /**
     * A component that handles connection and communication with the Main process.
     * It supplies interface (through invokers) for communication in direction to
     * and events for data coming from the Main process.
     */
    fluid.defaults("gpii.restartDialog.channel", {
        gradeNames: ["fluid.component"],

        events: {
            onPendingChangesReceived: null
        },

        listeners: {
            "onCreate.registerChannel": {
                funcName: "gpii.restartDialog.channel.register",
                args: "{that}.events"
            }
        },

        invokers: {
            notifyHeightChanged: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: ["onRestartDialogHeightChanged", "{arguments}.0"]
            },
            close: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: ["onClosed"]
            },
            restartNow: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: ["onRestartNow"]
            },
            restartLater: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: ["onRestartLater"]
            },
            undoChanges: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: ["onUndoChanges"]
            }
        }
    });


    /**
     * Sends a message to the main process.
     * @param {...Any} The channel to be notified and the parameters to be passed
     * with the message.
     */
    gpii.restartDialog.channel.notifyChannel = function () {
        ipcRenderer.send.apply(null, arguments);
    };

    /**
     * Registers for events from the Main process.
     * @param events {Object} Events map
     * @param events.onPendingChangesReceived {Object} Event related to pending
     * changes received from the Main process
     */
    gpii.restartDialog.channel.register = function (events) {
        ipcRenderer.on("onRestartRequired", function (event, pendingChanges) {
            events.onPendingChangesReceived.fire(pendingChanges);
        });
    };


    /**
     * Handles the displayed dynamic text in the dialog as well as
     * the be behaviour of the restart actions buttons.
     */
    fluid.defaults("gpii.restartDialog.restartWarning", {
        gradeNames: ["gpii.psp.baseRestartWarning"],

        model: {
            messages: {
                osName: "{messageBundles}.model.messages.gpii_app_restartWarning_osName",
                restartTitle: "{messageBundles}.model.messages.gpii_app_restartWarning_restartTitle",
                restartQuestion: "{messageBundles}.model.messages.gpii_app_restartWarning_restartQuestion"
            }
        },

        selectors: {
            title: ".flc-title",
            restartText: ".flc-details",
            solutionNames: ".flc-solutionNames",
            restartQuestion: ".flc-restartQuestion"
        },

        markup: {
            solutionName: "<li>%solutionName</li>"
        },


        modelListeners: {
            "messages.restartTitle": {
                this: "{that}.dom.title",
                method: "text",
                args: "{change}.value"
            },
            "messages.restartQuestion": {
                this: "{that}.dom.restartQuestion",
                method: "text",
                args: "{change}.value"
            },
            solutionNames: {
                funcName: "gpii.restartDialog.restartWarning.modifySolutionNamesList",
                args: ["{that}", "{that}.dom.solutionNames"]
            }
        }
    });

    /**
     * If there is at least one application to be restarted, this function creates the
     * corresponding DOM elements (list items) for each solution name and appends them
     * to their container. If the whole OS needs to be restarted, the function does not
     * have a visual effect.
     * @param that {Component} The `gpii.restartDialog.restartWarning` instance.
     * @param listElement {jQuery} A jQuery object representing the list into which the
     * solution name elements must be added.
     */
    gpii.restartDialog.restartWarning.modifySolutionNamesList = function (that, listElement) {
        var solutionNames = that.model.solutionNames,
            solutionNameMarkup = that.options.markup.solutionName,
            listItemElement;

        listElement.empty();
        if (solutionNames[0] === that.model.messages.osName) {
            listElement.hide();
            return;
        }

        fluid.each(solutionNames, function (solutionName) {
            listItemElement = fluid.stringTemplate(solutionNameMarkup, {solutionName: solutionName});
            listElement.append(listItemElement);
        });
        listElement.show();
    };

    /**
     * The wrapper component for the restart warning dialog. Handles visualization and
     * interactions for the require restart functionality.
     */
    fluid.defaults("gpii.restartDialog", {
        gradeNames: ["gpii.psp.messageBundles", "gpii.psp.heightObservable", "fluid.viewComponent"],

        selectors: {
            titlebar: ".flc-titlebar"
        },

        events: {
            onHeightChanged: null,
            onClosed: null
        },

        listeners: {
            onHeightChanged: {
                func: "{that}.channel.notifyHeightChanged",
                args: ["{arguments}.0"]
            },
            onClosed: "{channel}.close"
        },

        components: {
            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    labels: {
                        appName: "GPII Auto Personalization"
                    },
                    listeners: {
                        "onClose": "{restartDialog}.events.onClosed.fire"
                    }
                }
            },
            restartWarning: {
                type: "gpii.restartDialog.restartWarning",
                container: "{that}.container",
                options: {
                    listeners: {
                        onRestartNow: "{channel}.restartNow",
                        onRestartLater: "{channel}.restartLater",
                        onUndoChanges: "{channel}.undoChanges"
                    }
                }
            },
            channel: {
                type: "gpii.restartDialog.channel",
                options: {
                    listeners: {
                        onPendingChangesReceived: {
                            func: "{restartWarning}.updatePendingChanges",
                            args: "{arguments}.0" // pending changes
                        }
                    }
                }
            }
        }
    });
})(fluid);
