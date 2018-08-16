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


fluid.defaults("gpii.app.qssWidget", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable", "gpii.app.dialog.offScreenHidable"],

    model: {
        setting: {}
    },

    members: {
        // Used for postponed show of the dialog (e.g. based on an event)
        shouldShow: false
    },

    // Temporary. Should be removed when the widget becomes truly resizable.
    heightMap: {
        "http://registry\\.gpii\\.net/common/language": 625,
        "http://registry\\.gpii\\.net/common/highContrastTheme": 627
    },

    config: {
        closable: false,

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
            width: 316,
            height: 415,
            alwaysOnTop: true
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
        onQssWidgetNotificationRequired: null
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
                    onQssWidgetNotificationRequired: "{qssWidget}.events.onQssWidgetNotificationRequired",
                    onQssWidgetSettingAltered: "{qssWidget}.events.onQssWidgetSettingAltered",
                    onQssWidgetCreated: null
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
                    onQssWidgetSettingAltered: { // XXX dev
                        funcName: "console.log",
                        args: ["Settings Altered: ", "{arguments}.0"]
                    },
                    onQssWidgetCreated: {
                        funcName: "gpii.app.qssWidget.onQssWidgetCreated",
                        args: ["{qssWidget}"]
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
                "{that}.options.heightMap",
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

gpii.app.qssWidget.toggle = function (that, setting, btnCenterOffset, activationParams) {
    if (that.model.isShown && that.model.setting.path === setting.path) {
        that.hide();
        return;
    }

    if (setting.schema.type === "string" || setting.schema.type === "number") {
        that.show(setting, btnCenterOffset, activationParams);
    } else {
        that.hide();
    }
};

function getWidgetPosition(widget, btnCenterOffset) {
    return {
        x: btnCenterOffset.x - widget.width / 2,
        y: btnCenterOffset.y
    };
}

/**
 * Show the widget window and position it relatively to the
 * specified element. The window is positioned centered over
 * the element.
 *
 * @param {Component} that - The `gpii.app.qssWidget` instance
 * @param {Object} setting - The qssSetting object
 * @param {Object} btnCenterOffset - The metrics of the relative element
 * @param {Number} btnCenterOffset.offsetX - The offset of the element from the
 * @param {Number} btnCenterOffset.offsetY - The offset of the element from the
 * @param {Object} activationParams - Defines the way this show was triggered
 * @param {Object} activationParams.shortcut - Defines the way the show was triggered
 */
gpii.app.qssWidget.show = function (that, heightMap, setting, elementMetrics, activationParams) {
    activationParams = activationParams || {};

    that.dialog.setAlwaysOnTop(true);

    gpii.app.applier.replace(that.applier, "setting", setting);
    that.channelNotifier.events.onSettingUpdated.fire(setting, activationParams);

    // reposition window properly
    that.model.offset = getWidgetPosition(that, elementMetrics);

    that.height = heightMap[setting.path] || that.options.config.attrs.height;
    that.setRestrictedSize(that.width, that.height);

    that.shouldShow = true;
};

gpii.app.qssWidget.onQssWidgetCreated = function (qssWidget) {
    if (qssWidget.shouldShow) {
        qssWidget.shouldShow = false;
        setTimeout(function () {
            qssWidget.applier.change("isShown", true);
        }, 100);
    }
};


