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

require("./surveyDialog.js");

fluid.defaults("gpii.app.dialogManager", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        keyedInUserToken: null
    },
    modelListeners: {
        keyedInUserToken: {
            funcName: "gpii.app.dialogManager.closeDialogsIfNeeded",
            args: ["{that}", "{change}.value"],
            excludeSource: "init"
        }
    },

    components: {
        survey: {
            type: "gpii.app.survey"
        }
    },

    invokers: {
        get: {
            funcName: "gpii.app.dialogManager.get",
            args: ["{that}", "{arguments}.0"]
        },
        show: {
            funcName: "gpii.app.dialogManager.show",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        hide: {
            funcName: "gpii.app.dialogManager.hide",
            args: ["{that}", "{arguments}.0"]
        },
        close: {
            funcName: "gpii.app.dialogManager.close",
            args: ["{that}", "{arguments}.0"]
        }
    }
});

gpii.app.dialogManager.get = function (dialogManager, iocSelector) {
    var dialogs = fluid.queryIoCSelector(dialogManager, iocSelector);
    if (dialogs.length > 0) {
        return dialogs[0];
    }
};

gpii.app.dialogManager.show = function (dialogManager, iocSelector, options) {
    var dialog = dialogManager.get(iocSelector);
    if (dialog) {
        dialog.show(options);
    }
};

gpii.app.dialogManager.hide = function (dialogManager, iocSelector) {
    var dialog = dialogManager.get(iocSelector);
    if (dialog) {
        dialog.hide();
    }
};

gpii.app.dialogManager.close = function (dialogManager, iocSelector) {
    var dialog = dialogManager.get(iocSelector);
    if (dialog) {
        dialog.close();
    }
};

gpii.app.dialogManager.closeDialogsIfNeeded = function (dialogManager, keyedInUserToken) {
    if (!fluid.isValue(keyedInUserToken)) {
        dialogManager.close("survey");
    }
};
