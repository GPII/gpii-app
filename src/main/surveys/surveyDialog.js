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
        surveyWindow: null
    },

    listeners: {
        "onCreate.initSurveyWindowIPC": {
            listener: "gpii.app.survey.initSurveyWindowIPC",
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
            funcName: "gpii.app.survey.hide",
            args: ["{that}.surveyWindow"]
        }
    }
});

gpii.app.survey.initSurveyWindowIPC = function (survey) {
    ipcMain.on("onSurveyClose", function () {
        survey.hide();
    });
};

gpii.app.survey.create = function (windowOptions, callback) {
    var surveyWindow = new BrowserWindow(windowOptions),
        position = gpii.app.getWindowPosition(windowOptions.width, windowOptions.height);

    surveyWindow.setMenu(null);
    surveyWindow.setPosition(position.x, position.y);

    surveyWindow.once("ready-to-show", function () {
        callback();
    });

    var url = fluid.stringTemplate("file://%gpii-app/src/renderer/survey/index.html", fluid.module.terms());
    surveyWindow.loadURL(url);
    // surveyWindow.openDevTools();

    return surveyWindow;
};

gpii.app.survey.show = function (survey, options) {
    survey.hide();

    var windowOptions = fluid.extend(true, {}, survey.options.attrs, options.window || {}),
        surveyWindow = gpii.app.survey.create(windowOptions, function () {
            survey.surveyWindow = surveyWindow;
            survey.notifySurveyWindow("openSurvey", options.url);
            survey.surveyWindow.show();
        });

    surveyWindow.once("closed", function () {
        survey.surveyWindow = null;
    });
};

gpii.app.survey.hide = function (surveyWindow) {
    if (surveyWindow) {
        surveyWindow.close();
    }
};
