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

/**
 * Listens for events from the renderer process (the BrowserWindow).
 */
fluid.defaults("gpii.app.qss.channelListener", {
    gradeNames: ["gpii.app.dialog.simpleChannelListener"],
    ipcTarget: require("electron").ipcMain,

    events: {
        onQssClosed: null,
        onQssButtonClicked: null,
        onQssButtonMouseEnter: null,
        onQssButtonMouseLeave: null
    }
});

/**
 * Notifies the render process for main events.
 */
fluid.defaults("gpii.app.qss.channelNotifier", {
    gradeNames: ["gpii.app.dialog.simpleChannelNotifier", "gpii.app.i18n.channel"],
    // TODO improve `i18n.channel` to use event instead of a direct notifying
    ipcTarget: "{dialog}.dialog.webContents", // get the closest dialog

    events: {
        onSettingUpdated: null
    }
});


/**
 * Component that represents the Quick Set strip.
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog"],

    // whether showing of the QSS is allowed
    disabled: false,

    config: {
        attrs: {
            width: 1000,
            height: 200
        },
        params: {
            settings: null
        },
        fileSuffixPath: "quickSetStrip/index.html"
    },

    components: {
        channelNotifier: {
            type: "gpii.app.qss.channelNotifier",
            options: {
                // XXX dev
                listeners: {
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
            type: "gpii.app.qss.channelListener",
            options: {
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
                        args: ["Item Enter: ", "{arguments}.0"]
                    },
                    onQssButtonMouseLeave: {
                        funcName: "console.log",
                        args: ["Item Leave: ", "{arguments}.0"]
                    }

                }
            }
        }
    },
    invokers: {
        showIfPossible: {
            funcName: "gpii.app.qss.showIfPossible",
            args: ["{that}"]
        }
    }
});

/**
 * Show the window in case QSS is not disabled.
 */
gpii.app.qss.showIfPossible = function (that) {
    if (!that.options.disabled) {
        that.show();
    }
};

/**
 * Loads the initial settings from a local configuration file.
 */
fluid.defaults("gpii.app.staticQss", {
    gradeNames: "gpii.app.qss",

    qssSettingsPath: "%gpii-app/testData/qss/settings.json",
    loadedSettings: {
        expander: {
            funcName: "fluid.require",
            args: "@expand:fluid.module.resolvePath({that}.options.qssSettingsPath)"
        }
    },

    config: {
        params: {
            settings: "{that}.options.loadedSettings.qssSettings"
        }
    }
});
