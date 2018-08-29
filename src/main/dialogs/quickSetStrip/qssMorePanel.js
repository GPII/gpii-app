/**
 * The "More" dialog for the QSS
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS
 * "More" dialog.
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

require("../basic/blurrable.js");
require("../basic/centeredDialog.js");

/**
 * A centered blurrable dialog which represents the "More" window
 * in the QSS.
 */
fluid.defaults("gpii.app.qssMorePanel", {
    gradeNames: ["gpii.app.centeredDialog", "gpii.app.scaledQssDialog", "gpii.app.blurrable"],

    scaleFactor: 1,
    defaultWidth: 600,
    defaultHeight: 450,

    config: {
        attrs: {
            alwaysOnTop: true
        },
        fileSuffixPath: "qssMorePanel/index.html"
    },

    linkedWindowsGrades: ["gpii.app.qssMorePanel"],

    components: {
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssMorePanelClosed: null
                },
                listeners: {
                    onQssMorePanelClosed: {
                        func: "{qssMorePanel}.hide"
                    }
                }
            }
        }
    }
});
