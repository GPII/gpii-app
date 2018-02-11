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
                args: ["onErrorDialogContentSizeChanged", "{arguments}.0", "{arguments}.1"]
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
            label: "{that}.options.label"
        },
        invokers: {
            onClick: {
                func: "{errorDialog}.events.onButtonClicked.fire",
                /* Simply identify a button by its label */
                args: "{that}.options.label"
            }
        },
        modelListeners: {
            "label": {
                funcName: "gpii.errorDialog.toggleButton",
                args: ["{that}.container", "{change}.value"]
            }
        }
    });

    /**
     * Responsible for the visualisation of the error dialog.
     */
    fluid.defaults("gpii.errorDialog", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable"],

        model: {
            // Support at most 3 buttons
            btnLabel1: null,
            btnLabel2: null,
            btnLabel3: null,

            title:   null,
            subhead: null,
            details: null,
            errCode: null
        },

        selectors: {
            btn1:   ".flc-btn-1",
            btn2:   ".flc-btn-2",
            btn3:   ".flc-btn-3",

            title:   ".flc-title",
            subhead: ".flc-subhead",
            details: ".flc-details",
            errCode: ".flc-errCode"
        },

        events: {
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
                args: "{that}.model.errCode"
            }
        },

        listeners: {
            onButtonClicked: "{channel}.close",
            "onCreate.log": {
                this: "console",
                method: "log",
                args: "{that}"
            }
        },

        invokers: {
            // merges with the current model
            updateConfig: {
                changePath: "",
                value: "{arguments}.0"
            },
            onContentHeightChanged: {
                funcName: "gpii.errorDialog.onContentHeightChanged",
                args: ["{that}", "{that}.container"]
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
            /*
             * Dialog Controls
             */
            btnLeft: {
                type: "gpii.errorDialog.button",
                container: "{that}.dom.btn1",
                options: {
                    label: "{errorDialog}.model.btn1"
                }
            },
            btnMid: {
                type: "gpii.errorDialog.button",
                container: "{that}.dom.btn2",
                options: {
                    label: "{errorDialog}.model.btnLabel2"
                }
            },
            btnRight: {
                type: "gpii.errorDialog.button",
                container: "{that}.dom.btn3",
                options: {
                    label: "{errorDialog}.model.btn3"
                }
            }
        }
    });


    /**
     * Either shows or hides a button depending on the label. Simply hide
     * a button if no label is provided, as buttons are optional.
     */
    gpii.errorDialog.toggleButton = function (container, value) {
        console.log("Toggle: ", value)
        if (value) {
            container.show();
        } else {
            container.hide();
        }
    };

    /**
     * Compute the size of the dialog content.
     * @param that {Component} The `gpii.errorDialog` component
     */
    gpii.errorDialog.onContentHeightChanged = function (that) {
        var container = that.container;
        // get speech triangle size, in case such exists
        var triangleSize = $(".fl-speech-triangle").outerHeight(true) || 0;

        that.channel.notifyHeightChanged({
            width: container.outerWidth(true),
            height: container.outerHeight(true) + triangleSize + 10 /* some spare  */
        });
    };

})(fluid);
