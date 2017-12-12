/*!
GPII Application
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

/**
 * A component responsible for parsing various payloads related to the
 * surveys (e.g. the payload for showing a particular survey pop-up).
 */
fluid.defaults("gpii.app.surveyParser", {
    gradeNames: ["fluid.component"],
    invokers: {
        parseSurveyPayload: {
            funcName: "gpii.app.surveyParser.parseSurveyPayload"
        }
    }
});

/**
 * A function responsible for correctly parsing the payload received by
 * the survey server for showing a survey pop-up. Basically, this
 * function converts from the server format of the options to the
 * format expected by the `BrowserWindow`.
 */
gpii.app.surveyParser.parseSurveyPayload = function (payload) {
    var windowParams = payload.window || {},
        titlebarParams = windowParams.titleBar || {};

    return {
        url: payload.url,
        window: {
            width: windowParams.width,
            height: windowParams.height,
            resizable: windowParams.userResizable,

            title: titlebarParams.title,
            icon: titlebarParams.icon,
            closable: titlebarParams.closeButton,
            minimizable: titlebarParams.minimizeButton,
            maximizable: titlebarParams.maximizeButton
        }
    };
};
