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
    electron = require("electron"),
    ipcMain = electron.ipcMain,
    gpii = fluid.registerNamespace("gpii");

require("../dialog.js");

require("electron").app.on("certificate-error", function (event, webContents, url, error, certificate, callback) {
    event.preventDefault();
    callback(true);
});

fluid.defaults("gpii.app.surveyDialog", {
    gradeNames: ["gpii.app.dialog"],
    config: {
        attrs: {
            show: false,
            skipTaskbar: false,
            frame: true,
            alwaysOnTop: false,

            width: 800,
            height: 600,
            resizable: true,
            fullscreenable: true,
            closable: true,
            minimizable: false,
            maximizable: false,
            movable: true
        },
        fileSuffixPath: "survey/index.html"
    },
    listeners: {
        "onCreate.hideMenu": {
            this: "{that}.dialog",
            method: "setMenu",
            args: [null]
        },
        "onCreate.initReadyToShowListener": {
            listener: "gpii.app.surveyDialog.initReadyToShowListener",
            args: ["{that}", "{that}.options.config.surveyUrl"]
        },
        "onCreate.initClosedListener": {
            listener: "gpii.app.surveyDialog.initClosedListener",
            args: ["{that}"]
        },
        "onCreate.initSurveyWindowIPC": {
            listener: "gpii.app.surveyDialog.initSurveyWindowIPC",
            args: ["{that}"]
        }
    },
    invokers: {
        notifySurveyWindow: {
            funcName: "gpii.app.notifyWindow",
            args: ["{that}.dialog", "{arguments}.0", "{arguments}.1"]
        }
    }
});

gpii.app.surveyDialog.initReadyToShowListener = function (that, surveyUrl) {
    that.dialog.once("ready-to-show", function () {
        that.notifySurveyWindow("openSurvey", surveyUrl);
        that.show();
    });
};

gpii.app.surveyDialog.initClosedListener = function (that) {
    that.dialog.on("closed", function () {
        that.destroy();
    });
};

gpii.app.surveyDialog.initSurveyWindowIPC = function (that) {
    ipcMain.on("onSurveyClose", function () {
        that.close();
    });
};

fluid.defaults("gpii.app.survey", {
    gradeNames: "fluid.component",

    components: {
        surveyDialog: {
            type: "gpii.app.surveyDialog",
            createOnEvent: "onDialogCreate",
            options: {
                config: {
                    surveyUrl: "{arguments}.0",
                    attrs: "{arguments}.1"
                }
            }
        }
    },

    events: {
        onDialogCreate: null
    },

    invokers: {
        show: {
            funcName: "gpii.app.survey.show",
            args: ["{that}", "{arguments}.0"]
        },
        hide: {
            funcName: "gpii.app.survey.hide",
            args: ["{that}"]
        },
        close: {
            funcName: "gpii.app.survey.close",
            args: ["{that}"]
        }
    }
});

gpii.app.survey.show = function (survey, options) {
    survey.events.onDialogCreate.fire(options.url, options.window || {});
};

gpii.app.survey.hide = function (survey) {
    if (survey.surveyDialog) {
        survey.surveyDialog.hide();
    }
};

gpii.app.survey.close = function (survey) {
    if (survey.surveyDialog) {
        survey.surveyDialog.close();
    }
};
