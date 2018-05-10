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

require("./dialog.js");

/**
 * TODO
 */
fluid.defaults("gpii.app.qss.channel", {
    gradeNames: ["gpii.app.dialog.simpleChannelListener", "gpii.app.i18n.channel"],
    ipcTarget: require("electron").ipcMain,

    events: {
        onQssClosed: null,
        onQssButtonClicked: null,
        onQssButtonMouseEnter: null,
        onQssButtonMouseLeave: null
    }
});

/**
 * Component that represents the Quick Set strip
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 1000,
            height: 200
        },
        params: {
            settings: [
                {label: "More ..."},
                {label: "Some long long long long setting label"},
                {label: "Caption"},
                {label: "Languages"},
                {label: "Key out"}
            ]
        },
        fileSuffixPath: "quickSetStrip/index.html"
    },

    listeners: {
        "onCreate": {
            funcName: "{that}.show"
        }
    },

    components: {
        channel: {
            type: "gpii.app.qss.channel",
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
    }
});
