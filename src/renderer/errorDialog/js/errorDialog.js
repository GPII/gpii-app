/**
 * The error dialog
 *
 * Represents an error dialog, that can be closed by the user.
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
    fluid.defaults("gpii.errorDialog.channel", {
        gradeNames: ["fluid.component"],

        events: {
            onConfigReceived: null
        },

        listeners: {
            "onCreate.registerChannel": {
                funcName: "gpii.errorDialog.channel.register",
                args: "{that}.events"
            }
        },

        invokers: {
            close: {
                funcName: "gpii.errorDialog.channel.notifyChannel",
                args: "onErrorDialogClosed"
            },
            notifyHeightChanged: {
                funcName: "gpii.errorDialog.channel.notifyChannel",
                args: ["onErrorDialogHeightChanged", "{arguments}.0"]
            }
        }
    });


    /**
     * Notifies a channel. Currently it is used only for notifying the
     * Main process that a button was clicked.
     * @param channel {String} The channel to be notified
     */
    gpii.errorDialog.channel.notifyChannel = function (/* channel */) {
        ipcRenderer.send.apply(null, arguments);
    };

    /**
     * Registers for events from the Main process.
     * @param events {Object} Events map
     * @param events.onPendingChangesReceived {Object} Event related to pending
     * changes received from the Main process
     */
    gpii.errorDialog.channel.register = function (events) {
        ipcRenderer.on("onErrorUpdate", function (event, config) {
            events.onConfigReceived.fire(config);
        });
    };

    fluid.defaults("gpii.errorDialog.button", {
        gradeNames: "gpii.psp.widgets.button",
        model: {
            label: null
        },

        invokers: {
            onClick: {
                func: "{errorDialog}.events.onButtonClicked.fire",
                /* Simply identify a button by its label */
                args: "{that}.model.label"
            }
        },
        modelListeners: {
            label: {
                this: "{that}.container",
                method: "toggle",
                args: "@expand:fluid.isValue({change}.value)"
            }
        }
    });

    /**
     * Responsible for the visualisation of the error dialog.
     */
    fluid.defaults("gpii.errorDialog", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable"],

        model: {
            title:   null,
            subhead: null,
            details: null,
            errCode: null,

            /*
             * Support at most 3 buttons (optional)
             */
            btnLabel1: null,
            btnLabel2: null,
            btnLabel3: null
        },

        errorCodeFormat: "Message %errCode",

        selectors: {
            btn1:   ".flc-btn-1",
            btn2:   ".flc-btn-2",
            btn3:   ".flc-btn-3",

            titlebar: ".flc-titlebar",

            title:   ".flc-title",
            subhead: ".flc-subhead",
            details: ".flc-details",
            errCode: ".flc-errCode"
        },

        events: {
            onHeightChanged: null,
            onButtonClicked: null
        },

        modelListeners: {
            title: {
                this: "{that}.dom.title",
                method: "text",
                args: "{that}.model.title"
            },
            subhead: {
                this: "{that}.dom.subhead",
                method: "text",
                args: "{that}.model.subhead"
            },
            details: {
                this: "{that}.dom.details",
                method: "text",
                args: "{that}.model.details"
            },

            errCode: {
                this: "{that}.dom.errCode",
                method: "text",
                args: "@expand:fluid.stringTemplate({that}.options.errorCodeFormat, {that}.model)"
            }
        },

        listeners: {
            onHeightChanged: {
                func: "{that}.channel.notifyHeightChanged",
                args: ["{arguments}.0"]
            },
            onButtonClicked: "{channel}.close"
        },

        invokers: {
            // merges with the current model
            updateConfig: {
                changePath: "",
                value: "{arguments}.0"
            }
        },

        components: {
            channel: {
                type: "gpii.errorDialog.channel",
                options: {
                    listeners: {
                        onConfigReceived: {
                            func: "{errorDialog}.updateConfig",
                            args: "{arguments}.0"
                        }
                    }
                }
            },

            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    labels: {
                        appName: "GPII Error"
                    },
                    listeners: {
                        "onClose": "{errorDialog}.events.onButtonClicked"
                    }
                }
            },

            /*
             * Dialog Controls
             */
            btnRight: {
                type: "gpii.errorDialog.button",
                container: "{that}.dom.btn1",
                options: {
                    model: {
                        label: "{errorDialog}.model.btnLabel1"
                    }
                }
            },
            btnMid: {
                type: "gpii.errorDialog.button",
                container: "{that}.dom.btn2",
                options: {
                    model: {
                        label: "{errorDialog}.model.btnLabel2"
                    }
                }
            },
            btnLeft: {
                type: "gpii.errorDialog.button",
                container: "{that}.dom.btn3",
                options: {
                    model: {
                        label: "{errorDialog}.model.btnLabel3"
                    }
                }
            }
        }
    });
})(fluid);