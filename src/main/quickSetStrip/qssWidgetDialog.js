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

require("../dialog.js");
require("../blurrable.js");
require("../../common/channelUtils.js");


fluid.defaults("gpii.app.qssWidget", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

    model: {
        setting: {}
    },

    // Temporary. Should be removed when the widget becomes truly resizable.
    heightMap: {
        "http://registry\\.gpii\\.net/common/language": 550,
        "http://registry\\.gpii\\.net/common/highContrastTheme": 600
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
            width: 316,
            height: 400,
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
                    onQssWidgetBlur: null
                },
                listeners: {
                    onQssWidgetClosed: [{
                        func: "{qssWidget}.hide"
                    }, {
                        func: "{gpii.app.qss}.focus"
                    }],
                    onQssWidgetSettingAltered: { // XXX dev
                        funcName: "console.log",
                        args: ["Settings Altered: ", "{arguments}.0"]
                    },
                    onQssWidgetBlur: [{
                        func: "{qssWidget}.hide"
                    }, {
                        func: "{gpii.app.qss}.show",
                        args: [
                            "{arguments}.0" // params
                        ]
                    }]
                }
            }
        }
    },
    listeners: {
        "onCreate.initBlurrable": {
            func: "{that}.initBlurrable",
            args: ["{that}.dialog"]
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

gpii.app.qssWidget.toggle = function (that, setting, elementMetrics, activationParams) {
    if (that.model.isShown && that.model.setting.path === setting.path) {
        that.hide();
        return;
    }

    if (setting.schema.type === "string" || setting.schema.type === "number") {
        that.show(setting, elementMetrics, activationParams);
    } else {
        that.hide();
    }
};

function getWidgetPosition(dialog, elementMetrics) {
    // Find the offset for the window to be centered over the element
    var windowWidth = dialog.getSize()[0];
    // change offset to element's center
    var offsetX = elementMetrics.offsetRight - (elementMetrics.width / 2);
    // set offset to window center
    offsetX -= windowWidth / 2;

    return {
        x: offsetX,
        y: elementMetrics.height
    };
}

/**
 * Show the widget window and position it relatively to the
 * specified element. The window is positioned centered over
 * the element.
 *
 * @param {Component} that - The `gpii.app.qssWidget` instance
 * @param {Object} setting - The qssSetting object
 * @param {Object} elementMetrics - The metrics of the relative element
 * @param {Number} elementMetrics.width - The width of the element
 * @param {Number} elementMetrics.height - The height of the element
 * @param {Number} elementMetrics.offsetRight - The offset of the element from the
 * right of its window's.
 * @param {Object} activationParams - Defines the way this show was triggered
 * @param {Object} activationParams.shortcut - Defines the way the show was triggered
 */
gpii.app.qssWidget.show = function (that, heightMap, setting, elementMetrics, activationParams) {
    var position = getWidgetPosition(that.dialog, elementMetrics);

    activationParams = activationParams || {};
    that.channelNotifier.events.onSettingUpdated.fire(setting, activationParams);
    that.dialog.setAlwaysOnTop(true);

    gpii.app.applier.replace(that.applier, "setting", setting);
    that.applier.change("isShown", true);

    // reposition window properly
    that.height = heightMap[setting.path] || that.options.config.attrs.height;
    that.setPosition(position.x, position.y);
};


