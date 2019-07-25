/**
 * The QSS Open USB widget
 *
 * A custom widget for the Mount and Eject USB functionality
 * used the menuWidget as a base and fires the onQssOpenUsbRequested and
 * onQssUnmountUsbRequested events on the button clicks
 *
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
     * Represents the QSS USB widget.
     */
    fluid.defaults("gpii.qssWidget.openUSB", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],
        model: {
            messageChannel: "usbMessageChannel", // Channel listening for messages related to usb mount, unmount functionality
            closeOnBlur: false,
            messages: {
                footerTip: "{that}.model.setting.widget.footerTip",
                noUsbInserted: "",
                ejectUsbDrives: ""
            }
        },
        members: {
            // Holds the last keyboard event received during the "close" operation
            closingKeyboardEvent: null
        },
        selectors: {
            openUsbButton: ".flc-openUsbButton",
            ejectUsbButton: ".flc-ejectUsbButton",
            footerTip: ".flc-qssOpenUSBWidget-footerTip"
        },
        enableRichText: true,
        closeDelay: 1200,
        components: {
            openUsbButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.openUsbButton",
                options: {
                    model: {
                        label: "{openUSB}.model.messages.openUsbButtonLabel"
                    },
                    invokers: {
                        onClick: {
                            funcName: "gpii.qssWidget.openUSB.openUsbActivated",
                            args: [
                                "{openUSB}",
                                "{channelNotifier}.events.onQssOpenUsbRequested", // Mount USB event
                                "{openUSB}.model.messageChannel"
                            ]
                        }
                    }
                }
            },
            ejectUsbButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.ejectUsbButton",
                options: {
                    model: {
                        label: "{openUSB}.model.messages.ejectUsbButtonLabel"
                    },
                    invokers: {
                        onClick: {
                            funcName: "gpii.qssWidget.openUSB.ejectUsbActivated",
                            args: [
                                "{openUSB}",
                                "{channelNotifier}.events.onQssUnmountUsbRequested", // Unmount USB event
                                "{openUSB}.model.messageChannel"
                            ]
                        }
                    }
                }
            },
            closeTimer: {
                type: "gpii.app.timer",
                options: {
                    listeners: {
                        "onTimerFinished.closeWidget": {
                            func: "{qssWidget}.close",
                            args: ["{openUSB}.closingKeyboardEvent"]
                        }
                    }
                }
            }
        },
        listeners: {
            "onCreate.registerIpcListener": {
                funcName: "gpii.psp.registerIpcListener",
                args: ["{that}.model.messageChannel", "{openUSB}.showNotification"]
            },
            "onDestroy.removeIpcAllListeners": {
                funcName: "gpii.psp.removeIpcAllListeners",
                args: ["{that}.model.messageChannel"]
            }
        },
        invokers: {
            close: {
                funcName: "gpii.qssWidget.openUSB.close",
                args: [
                    "{that}",
                    "{closeTimer}",
                    "{arguments}.0" // keyboardEvent
                ]
            },
            showNotification: {
                func: "{that}.events.onNotificationRequired.fire",
                args: [{
                    description: "{arguments}.0",
                    closeOnBlur: "{that}.model.closeOnBlur"
                }]
            }
        }
    });

    /**
     * Invoked whenever the user changes the value of the given setting. Schedules that
     * the widget should be closed in `closeDelay` milliseconds.
     * @param {Component} that - The `gpii.qssWidget.menu` instance.
     * @param {Component} closeTimer - An instance of `gpii.app.timer` used for closing
     * the widget with a delay.
     * @param {KeyboardEvent} keyboardEvent - The keyboard event (if any) that led to the
     * change in the setting's value.
     */
    gpii.qssWidget.openUSB.close = function (that, closeTimer, keyboardEvent) {
        that.closingKeyboardEvent = keyboardEvent;
        closeTimer.start(that.options.closeDelay);
    };

    /**
     * Fire onQssOpenUsbRequested when the openUsbButton is pressed.
     * @param {Component} openUSB - The `gpii.qssWidget.openUSB` instance
     * @param {fluid.event} mountUsbEvent - the onQssOpenUsbRequested event
     * @param {String} messageChannel - The channel to which the message should be sent.
     */
    gpii.qssWidget.openUSB.openUsbActivated = function (openUSB, mountUsbEvent, messageChannel) {
        // fires the event that mounts and open the USB drive
        mountUsbEvent.fire(messageChannel, openUSB.model.messages);
        openUSB.close();
    };

    /**
     * Fire onQssUnmountUsbRequested when the ejectUsbButton is presed.
     * @param {Component} openUSB - The `gpii.qssWidget.openUSB` instance
     * @param {fluid.event} unmountUsbEvent - the onQssUnmountUsbRequested event
     * @param {String} messageChannel - The channel to which the message should be sent.
     */
    gpii.qssWidget.openUSB.ejectUsbActivated = function (openUSB, unmountUsbEvent, messageChannel) {
        // fires the event that ejects any attached USB drive
        unmountUsbEvent.fire(messageChannel, openUSB.model.messages);
        openUSB.close();
    };

})(fluid);
