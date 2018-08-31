/**
 * A dialog which can be scaled.
 *
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

/**
 * A special dialog which enables scaling of the dialog together with its
 * contents. It has the following options: `defaultWidth` and `defaultHeight`
 * which specify the dimensions of the dialog when no scaling is applied
 * and `scaleFactor` which determines how smaller (if less than 1) or bigger
 * (if more than 1) than its original size the dialog should be.
 */
fluid.defaults("gpii.app.scaledDialog", {
    gradeNames: ["fluid.component"],

    scaleFactor: 1,
    defaultWidth: 800,
    defaultHeight: 600,

    config: {
        attrs: {
            width: {
                expander: {
                    funcName: "gpii.app.scale",
                    args: [
                        "{that}.options.scaleFactor",
                        "{that}.options.defaultWidth"
                    ]
                }
            },
            height: {
                expander: {
                    funcName: "gpii.app.scale",
                    args: [
                        "{that}.options.scaleFactor",
                        "{that}.options.defaultHeight"
                    ]
                }
            }
        },
        params: {
            scaleFactor: "{that}.options.scaleFactor"
        }
    }
});
