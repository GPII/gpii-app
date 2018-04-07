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
                funcName: "gpii.psp.errorDialog.channel.notifyChannel"
            }
        }
    });


    /**
     * Sends a message to the main process.
     * @param {...Any} The channel to be notified and the parameters to be passed
     * with the message.
     */
    gpii.psp.errorDialog.channel.notifyChannel = function () {
        ipcRenderer.send.apply(null, arguments);
    };

    /**
     * Registers for events from the Main process.
     * @param events {Object} Events map.
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
     * TODO - Jira ticket number
     * This is still an idea, as errors are not yet received from
     * the API. It would probably be better to use a different
     * identifier from `label` in case its uniqueness is not
     * guaranteed.
     */
    fluid.defaults("gpii.psp.errorDialog.button", {
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
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable"],

        model: {
            messages: {
                titlebarAppName: null
            },
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
            btn1:     ".flc-btn-1",
            btn2:     ".flc-btn-2",
            btn3:     ".flc-btn-3",

            titlebar: ".flc-titlebar",

            title:    ".flc-contentTitle",
            subhead:  ".flc-contentSubhead",
            details:  ".flc-contentDetails",

            errCode:  ".flc-errCode"
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
            onCreate: {
                func: "{channel}.notify",
                args: ["onErrorDialogCreated"]
            },
            onHeightChanged: {
                func: "{channel}.notify",
                args: ["onErrorDialogHeightChanged", "{arguments}.0"]
            },
            onButtonClicked: {
                func: "{channel}.notify",
                args: ["onErrorDialogClosed"]
            }
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
                type: "gpii.psp.errorDialog.channel",
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
                    model: {
                        messages: {
                            title: "{errorDialog}.model.messages.titlebarAppName"
                        }
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
