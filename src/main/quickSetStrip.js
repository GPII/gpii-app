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
require("./blurrable.js");
require("../common/channelUtils.js");



// TODO extract to a common place
/**
 * Listens for events from the renderer process (the BrowserWindow).
 */
fluid.defaults("gpii.app.channelListener", {
    gradeNames: ["gpii.app.common.simpleChannelListener"],
    ipcTarget: require("electron").ipcMain
});

/**
 * Notifies the render process for main events.
 */
fluid.defaults("gpii.app.channelNotifier", {
    gradeNames: ["gpii.app.common.simpleChannelNotifier", "gpii.app.i18n.channel"],
    // TODO improve `i18n.channel` to use event instead of a direct notifying
    ipcTarget: "{dialog}.dialog.webContents" // get the closest dialog
});


/**
 * Component that represents the Quick Set strip.
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

    // whether showing of the QSS is allowed
    disabled: false,

    config: {
        attrs: {
            width: 640,
            height: 80,
            alwaysOnTop: true
        },
        params: {
            settings: null
        },
        fileSuffixPath: "qss/index.html"
    },

    events: {
        onQssOpen: null
    },

    linkedWindowsGrades: ["gpii.app.psp", "gpii.app.qssWidget", "gpii.app.qss"],

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onQssOpen: "{qss}.events.onQssOpen",
                    onSettingUpdated: null
                },
                listeners: {
                    // XXX dev
                    onCreate: {
                        funcName: "setTimeout",
                        args: [
                            "{that}.events.onSettingUpdated.fire",
                            6000,
                            "Oh Hello setting update"
                        ]
                    },
                    onSettingUpdated: {
                        "funcName": "console.log",
                        args: ["Sending setting: ", "{arguments}.0"]
                    }
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssClosed: null,
                    onQssButtonClicked: null,
                    onQssButtonMouseEnter: null,
                    onQssButtonMouseLeave: null,

                    onQssSettingAltered: null
                },

                listeners: {
                    onQssClosed: {
                        func: "{qss}.hide"
                    },
                    // XXX DEV
                    onQssButtonClicked: {
                        funcName: "console.log",
                        args: ["Item clicked: ", "{arguments}.0"]
                    },
                    onQssButtonMouseEnter: {
                        funcName: "console.log",
                        args: ["Item Enter: ", "{arguments}.0.target.offsetLeft"]
                    },
                    onQssButtonMouseLeave: {
                        funcName: "console.log",
                        args: ["Item Leave: ", "{arguments}.0.target.offsetLeft"]
                    },
                    onQssSettingAltered: {
                        funcName: "console.log",
                        args: ["Setting altered:", "{arguments}.0"]
                    }

                }
            }
        }
    },
    listeners: {
        // onBlur: {
        //     func: "{that}.hide"
        // }
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
        that.setBlurTarget(that.dialog);
        that.applier.change("isShown", true);
        that.events.onQssOpen.fire(params);
    }
};



fluid.defaults("gpii.app.qssWidget", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

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

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onSettingUpdated: null
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssWidgetClosed: null,
                    onQssSettingAltered: null
                },
                listeners: {
                    onQssWidgetClosed: {
                        func: "{qssWidget}.hide"
                    },
                    onQssSettingAltered: { // XXX dev
                        funcName: "console.log",
                        args: ["Settings Altered: ", "{arguments}.0"]
                    }
                }
            }
        }
    },
    listeners: {
        // onBlur: {
        //     func: "{that}.hide"
        // }
    },
    invokers: {
        show: {
            funcName: "gpii.app.qssWidget.show",
            args: [
                "{that}",
                "{arguments}.0", // setting
                "{arguments}.1"  // elementMetrics
            ]
        }
    }
});



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
 */
gpii.app.qssWidget.show = function (that, setting, elementMetrics) {
    // Find the offset for the window to be centered over the element
    var windowWidth = that.dialog.getSize()[0];
    // change offset to element's center
    var offsetX = elementMetrics.offsetRight - (elementMetrics.width / 2);
    // set offset to window center
    offsetX -= windowWidth / 2;

    that.channelNotifier.events.onSettingUpdated.fire(setting);

    // TODO toggle sets position?
    that.applier.change("isShown", true);
    // reposition window properly
    that.positionWindow(offsetX, elementMetrics.height);
    that.setBlurTarget(that.dialog);
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

    // listeners: {
    //     "qssMain.events.onQssButtonClicked": {
    //         func: "{that}.qssWidget.showMaybe"
    //     },
    //     "qssWidget.events.onBoundReached",
    //     "qssWidget.events.onSettingAltered",// -> to pcp itself
    // },

    components : {
        qss: {
            type: "gpii.app.qss",
            options: {
                config: {
                    params: {
                        settings: "{qssWrapper}.options.loadedSettings"
                    }
                },
                listeners: {
                    "{channelListener}.events.onQssButtonClicked": {
                        func: "{qssWidget}.show",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1"  // elementMetrics
                        ]
                    }
                }
            }
        },
        qssWidget: {
            type: "gpii.app.qssWidget",
            options: {
                modelListeners: {
                    // Ensure the widget window is closed with the QSS
                    "{gpii.app.qss}.model.isShown": {
                        // it won't hurt if this is called
                        // even on QSS show
                        func: "{that}.hide"
                    }
                },

                listeners: {
                    // TODO
                }
            }
        }
    }
});
