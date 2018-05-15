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
    gradeNames: ["gpii.app.dialog"],

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
                        args: ["Item Enter: ", "{arguments}.0"]
                    },
                    onQssButtonMouseLeave: {
                        funcName: "console.log",
                        args: ["Item Leave: ", "{arguments}.0"]
                    },
                    onQssSettingAltered: {
                        funcName: "console.log",
                        args: ["Setting altered:", "{arguments}.0"]
                    }

                }
            }
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
        that.applier.change("isShown", true);
        that.events.onQssOpen.fire(params);
    }
};



fluid.defaults("gpii.app.qssWidget", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 300,
            height: 500
        },
        fileSuffixPath: "qssWidget/index.html"
    },

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                // XXX dev
                listeners: {
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssWidgetClosed: null
                },
                listeners: {
                    onQssWidgetClosed: {
                        func: "{qssWidget}.hide"
                    }
                }
            }
        }
    },
    invokers: {
        showWidget: {
            funcName: "gpii.app.qssWidget.showWidget",
            args: [
                "{that}",
                "{arguments}.0" // control
            ]
        }
    }
});

gpii.app.qssWidget.showWidget = function (that, control) {
    var setting = control.setting;

    if (controlType === "increment") {

    }

    // TODO how do we get there?
    var controlPosition = control.position; //
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
                    // "{that}.channelListener.events.onQssButtonClicked": {
                    //     qssWidget: {
                    //         // TODO The show method decides whether it is a menu or increase widget?
                    //         func: "{qssWidget}.show",
                    //         args: "{arguments}.0" // clickedElement
                    //     }
                    // }
                }
            }
        },
        qssWidget: {
            type: "gpii.app.qssWidget",
            options: {
                listeners: {
                    // XXX dev
                    "onCreate.log": {
                        func: "{that}.show"
                    }
                }
            }
        }
    }
});
