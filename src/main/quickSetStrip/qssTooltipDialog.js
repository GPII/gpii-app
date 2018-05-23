/**
 * The Quick Set Strip tooltip pop-up
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a QSS tooltip.
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

require("../dialog.js");
require("../blurrable.js");
require("../../common/channelUtils.js");

fluid.defaults("gpii.app.qssTooltipDialog", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

    model: {
        setting: {}
    },

    config: {
        attrs: {
            width: 200,
            height: 300,
            alwaysOnTop: true,
            transparent: true
        },
        fileSuffixPath: "qssTooltipPopup/index.html"
    },

    // close whenever focus is lost
    linkedWindowsGrades: null,

    invokers: {
        show: {
            // TODO split to some generic parts
            funcName: "gpii.app.qssWidget.show",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1",
                "{arguments}.2"
            ]
        }
    },

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    // update message in the tooltip
                    // expect this message to be translated
                    onSettingUpdated: null
                }
            }
        }
    }
});
