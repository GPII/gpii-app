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
            close: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: "onClosed"
            },
            restartNow: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: "onRestartNow"
            },
            restartLater: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: "onRestartLater"
            },
            undoChanges: {
                funcName: "gpii.restartDialog.channel.notifyChannel",
                args: "onUndoChanges"
            }
        }
    });


    /**
     * Notifies a channel. Currently it is used only for notifying the
     * Main process that a button was clicked.
     * @param channel {String} The channel to be notified
     */
    gpii.restartDialog.channel.notifyChannel = function (channel) {
        ipcRenderer.send(channel);
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

        selectors: {
            title: ".flc-popup-title",
            restartText: ".flc-popup-bodyText"
        },

        listeners: {
            "onCreate.setText": {
                this: "{that}.dom.title",
                method: "text",
                args: "{that}.options.labels.restartTitle"
            }
        },

        labels: {
            restartTitle: "Changes require restart",
            // Simple override of `gpii.psp.restartWarning`'s labels
            osRestartText: "Windows needs to restart to apply your changes. \n\n What would you like to do?",
            restartText: "In order to be applied, some of the changes you made require the following applications to restart: %solutions \n\n What would you like to do?"
        }
    });


    /**
     * The wrapper component for the restart warning dialog. Handles visualization and
     * interactions for the require restart functionality.
     */
    fluid.defaults("gpii.restartDialog", {
        gradeNames: ["fluid.viewComponent"],

        selectors: {
            close: ".flc-close"
        },

        events: {
            onClosed: null,

            onRestartNow: null,
            onRestartLater: null,
            onUndoChanges: null
        },

        listeners: {
            onClosed: "{channel}.close"
        },

        components: {
            closeBtn: { // Header
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.close",
                options: {
                    invokers: {
                        onClick: "{restartDialog}.events.onClosed.fire"
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
                            args: "{arguments}.0"
                        }
                    }
                }
            }
        }
    });
})(fluid);

