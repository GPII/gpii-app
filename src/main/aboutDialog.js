/**
 * About page BrowserWindow Dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a "About" dialog.
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
 * Component that contains an Electron Dialog.
 */

fluid.defaults("gpii.app.aboutDialog", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 400,
            height: 250
        },
        fileSuffixPath: "aboutDialog/index.html"
    },

    components: {
        channel: {
            type: "gpii.app.i18n.channel"
        }
    }
});


