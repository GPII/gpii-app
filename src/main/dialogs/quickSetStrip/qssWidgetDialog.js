/**
 * The Quick Set Strip widget pop-up
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS widget (menu or increment/decrement).
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion");

var gpii = fluid.registerNamespace("gpii");

require("../basic/dialog.js");
require("../basic/blurrable.js");
require("../basic/offScreenHidable.js");
require("../../../shared/channelUtils.js");

/**
 * A blurrable dialog which represents the QSS widget. As this dialog is reused,
 * it is hidden off-screen to avoid content flickering when the displayed setting
 * changes.
 */
fluid.defaults("gpii.app.qssWidget", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable", "gpii.app.dialog.offScreenHidable"],

    /*
     * When setting the size of a `BrowserWindow` Electron sometimes changes its position
     * with a few pixels if the DPI is different than 1. This offset ensures that the dialog's
     * arrow will not be hidden behind the QSS in case Electron decides to position the window
     * lower than it actually has to be.
     */
    extraVerticalOffset: 7,

    // A list of QSS setting types for which this widget is applicable.
    supportedSettings: ["string", "number", "boolean", "screenCapture", "openUSB"],

    model: {
        setting: {}
    },

    members: {
        // Used for postponed showing of the dialog (based on an event)
        shouldShow: false
    },

    config: {
        params: {
            sounds: {
                boundReached: {
                    expander: {
                        funcName: "{assetsManager}.resolveAssetPath",
                        args: ["{that}.options.sounds.boundReachedErrorSound"]
                    }
                }
            }
        },
        attrs: {
            width: 170,
            height: 255,
            alwaysOnTop: true
        },
        restrictions: {
            minHeight: 255
        },
        fileSuffixPath: "qssWidget/index.html"
    },

    linkedWindowsGrades: ["gpii.app.psp", "gpii.app.qss", "gpii.app.qssNotification", "gpii.app.qssWidget"],

    sounds: {
        boundReachedErrorSound: "boundReachedError.mp3"
    },

    events: {
        onSettingUpdated: null,
        onQssWidgetToggled: null,
        onQssWidgetSettingAltered: null,
        onQssWidgetNotificationRequired: null,
        onQssWidgetCreated: null
    },

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onSettingUpdated: "{qssWidget}.events.onSettingUpdated"
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssWidgetClosed: null,
                    onQssWidgetHideQssRequested: null,
                    onQssWidgetHeightChanged: "{qssWidget}.events.onContentHeightChanged",
                    onQssWidgetNotificationRequired: "{qssWidget}.events.onQssWidgetNotificationRequired",
                    onQssWidgetSettingAltered: "{qssWidget}.events.onQssWidgetSettingAltered",
                    onQssWidgetCreated: "{qssWidget}.events.onQssWidgetCreated",
                    // USB related events
                    onQssOpenUsbRequested: null,
                    onQssUnmountUsbRequested: null
                },
                listeners: {
                    onQssWidgetClosed: [{
                        func: "{qssWidget}.hide"
                    }, {
                        func: "{gpii.app.qss}.show",
                        args: [
                            "{arguments}.0" // params
                        ]
                    }],
                    onQssWidgetHideQssRequested: {
                        func: "{gpii.app.qss}.hide",
                        args: [
                            "{arguments}.0" // params
                        ]
                    },
                    onQssWidgetSettingAltered: {
                        funcName: "fluid.log",
                        args: ["QssWidget - Settings Altered: ", "{arguments}.0"]
                    },
                    onQssWidgetCreated: {
                        funcName: "gpii.app.qssWidget.showOnInit",
                        args: ["{qssWidget}"]
                    },
                    onQssOpenUsbRequested: {
                        funcName: "gpii.app.openUSB",
                        args: []
                    },
                    onQssUnmountUsbRequested: {
                        funcName: "gpii.app.unmountUSB",
                        args: []
                    }
                }
            }
        }
    },
    modelListeners: {
        "isShown": {
            func: "{that}.events.onQssWidgetToggled",
            args: [
                "{that}.model.setting",
                "{change}.value" // isShown
            ]
        },
        "setting": {
            func: "{that}.events.onQssWidgetToggled",
            args: [
                "{change}.value", // setting
                "{that}.model.isShown"
            ]
        }
    },
    invokers: {
        show: {
            funcName: "gpii.app.qssWidget.show",
            args: [
                "{that}",
                "{arguments}.0", // setting
                "{arguments}.1",  // elementMetrics
                "{arguments}.2"// activationParams
            ]
        },
        toggle: {
            funcName: "gpii.app.qssWidget.toggle",
            args: [
                "{that}",
                "{arguments}.0", // setting
                "{arguments}.1",  // elementMetrics
                "{arguments}.2"// activationParams
            ]
        }
    }
});

/**
 * Called whenever a QSS button is activated. Determines whether the QSS dialog
 * should be shown or hidden.
 * @param {Component} that - The `gpii.app.qssWidget` instance
 * @param {Object} setting - The setting corresponding to the QSS button that
 * has been activated
 * @param {Object} btnCenterOffset - An object containing metrics for the QSS
 * button that has been activated
 * @param {Object} [activationParams] - Parameters sent to the renderer portion
 * of the QSS dialog (e.g. whether the activation occurred via keyboard)
 */
gpii.app.qssWidget.toggle = function (that, setting, btnCenterOffset, activationParams) {
    if (that.model.isShown && that.model.setting.path === setting.path) {
        that.hide();
        return;
    }

    if (that.options.supportedSettings.includes(setting.schema.type)) {
        that.show(setting, btnCenterOffset, activationParams);
    } else {
        that.hide();
    }
};

/**
 * Retrieves the QSS widget dialog's position.
 * @param {Component} that - The `gpii.app.qssWidget` instance
 * @param {Object} btnCenterOffset - An object containing metrics for the QSS
 * button that has been activated.
 * @return {Object} The offset of the widget from the bottom right corner of
 * the screen.
 */
gpii.app.qssWidget.getWidgetPosition = function (that, btnCenterOffset) {
    var extraVerticalOffset = that.options.extraVerticalOffset,
        scaleFactor = that.model.scaleFactor;

    return {
        x: btnCenterOffset.x - that.model.width / 2,
        y: btnCenterOffset.y + scaleFactor * extraVerticalOffset
    };
};

/**
 * Shows the widget window and position it centered with respect to the
 * corresponding QSS button.
 * @param {Component} that - The `gpii.app.qssWidget` instance
 * @param {Object} setting - The setting corresponding to the QSS button that
 * has been activated
 * @param {Object} elementMetrics - An object containing metrics for the QSS
 * button that has been activated
 * @param {Object} [activationParams] - Parameters sent to the renderer portion
 * of the QSS dialog (e.g. whether the activation occurred via keyboard)
 */
gpii.app.qssWidget.show = function (that, setting, elementMetrics, activationParams) {
    activationParams = activationParams || {};

    gpii.app.applier.replace(that.applier, "setting", setting);
    that.channelNotifier.events.onSettingUpdated.fire(setting, activationParams);

    // store the offset so that the widget can be positioned correctly when
    // the renderer process sends the corresponding message
    var offset = gpii.app.qssWidget.getWidgetPosition(that, elementMetrics);
    that.applier.change("offset", offset);

    var scaleFactor = that.model.scaleFactor,
        height = that.options.config.attrs.height;
    that.setRestrictedSize(that.model.width, scaleFactor * height);

    that.shouldShow = true;
};

/**
 * Shows the QSS widget when the renderer process notifies the main process that
 * the view has been initialized.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance
 */
gpii.app.qssWidget.showOnInit = function (qssWidget) {
    if (qssWidget.shouldShow) {
        qssWidget.shouldShow = false;
        setTimeout(function () {
            qssWidget.applier.change("isShown", true);
        }, 100);
    }
};
