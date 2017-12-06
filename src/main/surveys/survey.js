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

var fluid    = require("infusion");
var electron = require("electron");

var BrowserWindow = electron.BrowserWindow,
    gpii = fluid.registerNamespace("gpii"),
    ipcMain = electron.ipcMain;

require("../utils.js");
require("./surveyTriggerManager.js");
require("./surveyConnector.js");

require("electron").app.on("certificate-error", function (event, webContents, url, error, certificate, callback) {
    event.preventDefault();
    callback(true);
});



fluid.defaults("gpii.app.surveyManager", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        // TODO to be used with the survey
        machineId: null,
        userId: null
    },


    components: {
        surveyConnector: {
            type: "gpii.app.surveyConnector",
            options: {
                listeners: {
                    "{app}.events.onKeyedIn": {
                        func: "{that}.notifyKeyedIn"
                    },

                    onSurveyRequired: {
                        func: "{survey}.show",
                        args: "{arguments}.0" // the raw payload
                    },

                    onTriggersReceived: {
                        func: "{surveyTriggersManager}.registerTrigger",
                        args: ["{arguments}.0"]
                    }
                }
            }
        },

        surveyTriggersManager: {
            type: "gpii.app.surveyTriggersManager",
            options: {
                listeners: {
                    onTriggerOccurred: {
                        func: "{surveyConnector}.notifyTriggerOccurred",
                        args: "{arguments}.0" // the trigger payload
                    }
                }
            }
        },

        // Dialog manager
        survey: {
            type: "gpii.app.survey",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                }
            }
        }
    }
});

fluid.defaults("gpii.app.survey", {
    gradeNames: "fluid.modelComponent",
    attrs: {
        width: 800,
        height: 800,
        show: false,

        skipTaskbar: false,
        frame: true,
        fullscreenable: true,
        resizable: true,
        minimizable: true,
        maximizable: true,
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
            funcName: "gpii.app.showSampleSurvey",
            args: ["{that}", "{arguments}.0", "{that}.options.surveyParams.url"]
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
        survey.surveyWindow.hide();
    });
};

gpii.app.showSampleSurvey = function (survey, keyedInUserToken, url) {
//    if (!keyedInUserToken) {
//        survey.surveyWindow.hide();
//        return;
//    }

    survey.notifySurveyWindow("openSurvey", {
        url: url + "?keyedInUserToken=" + keyedInUserToken,
        keyedInUserToken: keyedInUserToken
    });
    survey.surveyWindow.show();
};
