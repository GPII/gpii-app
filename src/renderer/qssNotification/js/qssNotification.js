/**
 * The renderer portion of the QSS Notification dialog
 *
 * Creates the Quick Set Strip widget once the document has been loaded.
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

    fluid.defaults("gpii.psp.translatedQssNotification", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent"],

        components: {
            qssNotification: {
                type: "gpii.psp.qssNotification",
                container: "{translatedQssNotification}.container"
            }
        }
    });

    fluid.defaults("gpii.psp.qssNotification", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer", "gpii.psp.heightObservable"],

        model: {
            messages: {
                title: "GPII Notification",
                dismissButtonLabel: "OK"
            }
        },

        selectors: {
            titlebar: ".flc-titlebar",
            description: ".flc-qssNotification-description",
            dismissButton: ".flc-qssNotification-dismissButton",

            dialogContent: ".flc-dialog-content",
            heightListenerContainer: ".flc-dialog-contentText"
        },

        events: {
            onQssNotificationShown: null,
            onQssNotificationClosed: null
        },

        components: {
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        onQssNotificationShown: "{qssNotification}.events.onQssNotificationShown"
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        onQssNotificationHeightChanged: "{qssNotification}.events.onHeightChanged",
                        onQssNotificationClosed: "{qssNotification}.events.onQssNotificationClosed"
                    }
                }
            },
            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{qssNotification}.model.messages.title"
                        }
                    },
                    listeners: {
                        "onClose": "{qssNotification}.events.onQssNotificationClosed"
                    }
                }
            },
            dismissButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.dismissButton",
                options: {
                    model: {
                        label: "{qssNotification}.model.messages.dismissButtonLabel"
                    },
                    invokers: {
                        onClick: "{qssNotification}.events.onQssNotificationClosed.fire"
                    }
                }
            }
        },

        listeners: {
            onQssNotificationShown: {
                funcName: "gpii.app.applier.replace",
                args: [
                    "{that}.applier",
                    "messages",
                    "{arguments}.0"
                ]
            }
        },

        invokers: {
            calculateHeight: {
                funcName: "gpii.psp.qssNotification.calculateHeight",
                args: ["{that}.container", "{that}.dom.dialogContent", "{that}.dom.heightListenerContainer"]
            }
        }
    });

    gpii.psp.qssNotification.calculateHeight = function (container, dialogContent, heightListenerContainer) {
        return Math.ceil(container.outerHeight(true) - dialogContent.height() + heightListenerContainer.height());
    };
})(fluid);
