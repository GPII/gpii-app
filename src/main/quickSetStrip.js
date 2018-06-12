/**
 * The Quick Set Strip pop-up
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS.
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

require("./dialog.js");
require("./quickSetStrip/qssTooltipDialog.js");
require("./blurrable.js");
require("../common/channelUtils.js");


/**
 * Component that represents the Quick Set strip.
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

    // whether showing of the QSS is allowed
    disabled: false,

    config: {
        attrs: {
            width: 1085,
            height: 95,
            alwaysOnTop: true,
            transparent: false
        },
        params: {
            settings: null
        },
        fileSuffixPath: "qss/index.html"
    },

    events: {
        onQssOpen: null,
        onQssWidgetToggled: null,
        onQssSettingAltered: null,
        onSettingUpdated: null
    },

    linkedWindowsGrades: ["gpii.app.psp", "gpii.app.qssWidget", "gpii.app.qss"],

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onQssOpen: "{qss}.events.onQssOpen",
                    onQssWidgetToggled: "{qss}.events.onQssWidgetToggled",
                    onSettingUpdated: "{qss}.events.onSettingUpdated"
                },
                listeners: {
                    onSettingUpdated: {
                        "funcName": "console.log",
                        args: ["Sending Updated QSS: ", "{arguments}.0"]
                    }
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssClosed: null,
                    onQssButtonFocused: null,
                    onQssButtonsFocusLost: null,
                    onQssButtonActivated: null,
                    onQssButtonMouseEnter: null,
                    onQssButtonMouseLeave: null,

                    onQssSettingAltered: "{qss}.events.onQssSettingAltered"
                },

                listeners: {
                    onQssClosed: {
                        func: "{qss}.hide"
                    },
                    // XXX DEV
                    onQssButtonActivated: {
                        funcName: "console.log",
                        args: ["Item clicked: ", "{arguments}.0"]
                    },
                    // onQssButtonMouseEnter: {
                    //     funcName: "console.log",
                    //     args: ["Item Enter: ", "{arguments}.0.target.offsetLeft"]
                    // },
                    // onQssButtonMouseLeave: {
                    //     funcName: "console.log",
                    //     args: ["Item Leave: ", "{arguments}.0.target.offsetLeft"]
                    // },
                    onQssSettingAltered: {
                        funcName: "console.log",
                        args: ["Setting altered QSS:", "{arguments}.0.path", "{arguments}.0.value"]
                    }
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
    invokers: {
        show: {
            funcName: "gpii.app.qss.show",
            args: [
                "{that}",
                "{arguments}.0" // params
            ]
        }
    }
});

/**
 * Show the window in case QSS is not disabled.
 */
gpii.app.qss.show = function (that, params) {
    if (!that.options.disabled) {
        // Show the QSS or focus it if it is already shown.
        if (that.model.isShown) {
            that.focus();
        } else {
            that.applier.change("isShown", true);
        }

        that.events.onQssOpen.fire(params);
    }
};



fluid.defaults("gpii.app.qssWidget", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

    model: {
        setting: {}
    },

    config: {
        attrs: {
            width: 300,
            height: 400,
            alwaysOnTop: true,
            transparent: false
        },
        fileSuffixPath: "qssWidget/index.html"
    },

    linkedWindowsGrades: ["gpii.app.psp", "gpii.app.qss", "gpii.app.qssWidget"],

    events: {
        onSettingUpdated: null,
        onQssWidgetToggled: null,
        onQssSettingAltered: null
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
                    onQssSettingAltered: "{qssWidget}.events.onQssSettingAltered",
                    onQssWidgetBlur: null
                },
                listeners: {
                    onQssWidgetClosed: [{
                        func: "{qssWidget}.hide"
                    }, {
                        func: "{gpii.app.qss}.focus"
                    }],
                    onQssSettingAltered: { // XXX dev
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
gpii.app.qssWidget.show = function (that, setting, elementMetrics, activationParams) {
    // Find the offset for the window to be centered over the element
    var windowWidth = that.dialog.getSize()[0];
    // change offset to element's center
    var offsetX = elementMetrics.offsetRight - (elementMetrics.width / 2);
    // set offset to window center
    offsetX -= windowWidth / 2;

    activationParams = activationParams || {};
    that.channelNotifier.events.onSettingUpdated.fire(setting, activationParams);

    that.applier.change("setting", setting);
    that.applier.change("isShown", true);
    // reposition window properly
    that.positionWindow(offsetX, elementMetrics.height);
};


/**
 * Loads the initial settings from a local configuration file.
 */
fluid.defaults("gpii.app.qssWrapper", {
    gradeNames: "fluid.component",

    settingsPath: "%gpii-app/testData/qss/settings.json",
    loadedSettings: {
        expander: {
            funcName: "fluid.require",
            args: "@expand:fluid.module.resolvePath({that}.options.settingsPath)"
        }
    },

    events: {
        onQssSettingAltered: null,
        onSettingUpdated: null
    },

    components : {
        qss: {
            type: "gpii.app.qss",
            options: {
                config: {
                    params: {
                        settings: "{qssWrapper}.options.loadedSettings"
                    }
                },
                events: {
                    onQssWidgetToggled: "{qssWidget}.events.onQssWidgetToggled",
                    onQssSettingAltered: "{qssWrapper}.events.onQssSettingAltered",
                    onSettingUpdated: "{qssWrapper}.events.onSettingUpdated"
                },
                listeners: {
                    "{channelListener}.events.onQssButtonActivated": {
                        func: "{qssWidget}.toggle",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1", // elementMetrics
                            "{arguments}.2"  // activationParams
                        ]
                    }
                }
            }
        },
        qssWidget: {
            type: "gpii.app.qssWidget",
            options: {
                events: {
                    onQssSettingAltered: "{qssWrapper}.events.onQssSettingAltered",
                    onSettingUpdated: "{qssWrapper}.events.onSettingUpdated"
                },
                modelListeners: {
                    // Ensure the widget window is closed with the QSS
                    "{gpii.app.qss}.model.isShown": {
                        // it won't hurt if this is called
                        // even on QSS show
                        func: "{that}.hide"
                    }
                }
            }
        },
        qssTooltip: {
            type: "gpii.app.qssTooltipDialog",
            options: {
                listeners: {
                    // TODO list events for a method
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseEnter": {
                        func: "{that}.showIfPossible",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1"  // metrics
                        ]
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonFocused": {
                        func: "{that}.showIfPossible",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1"  // metrics
                        ]
                    },

                    // TODO we could also have a modelListener and always hide. See widget
                    "{gpii.app.qss}.events.onDialogHidden": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonActivated": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonsFocusLost": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseLeave": {
                        func: "{that}.hide"
                    }
                }
            }
        }
    }
});
