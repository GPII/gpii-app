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

fluid.defaults("gpii.app.surveyParser", {
    gradeNames: ["fluid.component"],
    invokers: {
        parseSurveyPayload: {
            funcName: "gpii.app.surveyParser.parseSurveyPayload"
        }
    }
});

gpii.app.surveyParser.parseSurveyPayload = function (payload) {
    return {
        url: payload.url
    };
};
