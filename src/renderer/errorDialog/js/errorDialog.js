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
    fluid.defaults("gpii.psp.errorDialog.channel", {
        gradeNames: ["fluid.component"],

        events: {
            onConfigReceived: null
        },

        listeners: {
            "onCreate.registerChannel": {
                funcName: "gpii.psp.errorDialog.channel.register",
                args: "{that}.events"
            }
        },

        invokers: {
            notify: {
                funcName: "gpii.psp.channel.notifyChannel"
            }
        }
    });


    /**
     * Registers for events from the Main process.
     * @param {Object} events - Events map.
     */
    gpii.psp.errorDialog.channel.register = function (events) {
        ipcRenderer.on("onErrorUpdate", function (event, config) {
            events.onConfigReceived.fire(config);
        });
    };


    /**
     * Defines a generic button that is represented
     * by its label once clicked. This is useful in case
     * multiple dynamic buttons are created and its actions
     * are handled from some distant logic.
     *
     * This is still an idea, as error buttons are not yet received from
     * the API as of GPII-1313. It would probably be better to use
     * a different identifier from `label` in case its uniqueness is not
     * guaranteed.
     */
    fluid.defaults("gpii.psp.errorDialog.button", {
        gradeNames: "gpii.psp.widgets.button",
        model: {
            label: null
        },

        listeners: {
            onClick: {
                func: "{channelNotifier}.events.onErrorDialogButtonClicked.fire",
                /* Simply identify a button by its label */
                args: "{that}.model.label"
            }
        },
        // Hide buttons that are not used
        modelListeners: {
            label: {
                this: "{that}.container",
                method: "toggle",
                args: "@expand:fluid.isValue({change}.value)"
            }
        }
    });

    /**
     * Responsible for the visualisation of the error dialog. As the title,
     * subhead and details messages can have an arbitrary length and due to
     * the fact that the `BrowserWindow` has fixed dimensions initially, it is
     * important for the `errorDialog` component to be aware of its height
     * and to notify the main process when it changes. Thus, the `BrowserWindow`
     * will be able to be adjusted accordingly to accommodate the whole error
     * message. That is why this component has the `gpii.psp.heightObservable`
     * grade specified.
     */
    fluid.defaults("gpii.psp.errorDialog", {
        gradeNames: [
            "fluid.viewComponent",
            "gpii.psp.heightObservable",
            "gpii.psp.selectorsTextRenderer"
        ],

        model: {
            messages: {
                titlebarAppName: null,
                errorCode: "Message %errCode",

                // treat these as messages as they are
                // sent to the error dialog i18ned
                title:   "{that}.model.title",
                subhead: "{that}.model.subhead",
                details: "{that}.model.details"
            },

            values: {
                errCode: "{that}.model.errCode"
            },

            /*
             * Support at most 3 buttons (optional)
             */
            btnLabel1: null,
            btnLabel2: null,
            btnLabel3: null
        },

        selectors: {
            btn1:     ".flc-btn-1",
            btn2:     ".flc-btn-2",
            btn3:     ".flc-btn-3",

            titlebar: ".flc-titlebar",

            title:    ".flc-contentTitle",
            subhead:  ".flc-contentSubhead",
            details:  ".flc-contentDetails",

            errorCode:  ".flc-errCode"
        },

        enableRichText: true,

        components: {
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        onErrorDialogClosed: null,
                        onErrorDialogButtonClicked: null,
                        onErrorDialogContentHeightChanged: "{errorDialog}.events.onHeightChanged"
                    }
                }
            },
            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{errorDialog}.model.messages.titlebarAppName"
                        }
                    },
                    listeners: {
                        "onClose": "{channelNotifier}.events.onErrorDialogClosed"
                    }
                }
            },

            /*
             * Dialog Controls
             */
            btnRight: {
                type: "gpii.psp.errorDialog.button",
                container: "{that}.dom.btn1",
                options: {
                    model: {
                        label: "{errorDialog}.model.btnLabel1"
                    }
                }
            },
            btnMid: {
                type: "gpii.psp.errorDialog.button",
                container: "{that}.dom.btn2",
                options: {
                    model: {
                        label: "{errorDialog}.model.btnLabel2"
                    }
                }
            },
            btnLeft: {
                type: "gpii.psp.errorDialog.button",
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
