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
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain,
    gpii = fluid.registerNamespace("gpii");

require("electron").app.on("certificate-error", function (event, webContents, url, error, certificate, callback) {
    event.preventDefault();
    callback(true);
});

fluid.defaults("gpii.app.survey", {
    gradeNames: "fluid.component",
    attrs: {
        show: false,
        skipTaskbar: false,
        frame: true,

        width: 800,
        height: 600,
        resizable: true,
        fullscreenable: true,
        closable: true,
        minimizable: false,
        maximizable: false,
        movable: true
    },

    members: {
        surveyWindow: {
            expander: {
                funcName: "gpii.app.survey.makeSurveyWindow",
                args: ["{that}.options.attrs", "{that}.options.surveyParams"]
            }
        }
    },

    surveyParams: {
        url: "https://survey.az1.qualtrics.com/jfe/form/SV_7QWbGd4JuGmSu33"
    },

    listeners: {
        "onCreate.initSurveyWindowIPC": {
            listener: "gpii.app.initSurveyWindowIPC",
            args: ["{that}"]
        }
    },

    invokers: {
        notifySurveyWindow: {
            funcName: "gpii.app.notifyWindow",
            args: ["{that}.surveyWindow", "{arguments}.0", "{arguments}.1"]
        },
        show: {
            funcName: "gpii.app.survey.show",
            args: ["{that}", "{arguments}.0"]
        },
        hide: {
            this: "{that}.surveyWindow",
            method: "hide"
        }
    }
});

gpii.app.survey.makeSurveyWindow = function (windowOptions) {
    var surveyWindow = new BrowserWindow(windowOptions),
        position = gpii.app.getWindowPosition(windowOptions.width, windowOptions.height);

    surveyWindow.setMenu(null);
    surveyWindow.setPosition(position.x, position.y);

    var url = fluid.stringTemplate("file://%gpii-app/src/renderer/survey/index.html", fluid.module.terms());
    surveyWindow.loadURL(url);
    // surveyWindow.openDevTools();

    return surveyWindow;
};

gpii.app.initSurveyWindowIPC = function (survey) {
    ipcMain.on("onSurveyClose", function () {
        survey.hide();
    });
};

gpii.app.survey.show = function (survey, options) {
    survey.notifySurveyWindow("openSurvey", options);
    survey.surveyWindow.show();
};
