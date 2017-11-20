/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.psp");

    fluid.defaults("gpii.psp", {
        gradeNames: ["fluid.component"],
        components: {
            clientChannel: {
                type: "gpii.psp.clientChannel",
                options: {
                    listeners: {
                        onPreferencesUpdated: {
                            funcName: "{mainWindow}.updatePreferences"
                        },
                        onAccentColorChanged: {
                            funcName: "{mainWindow}.updateTheme"
                        },
                        onSettingUpdated: {
                            funcName: "{mainWindow}.updateSetting"
                        },
                        onRestartRequired: {
                            funcName: "{mainWindow}.updateSolutionNames"
                        }
                    }
                }
            },

            mainWindow: {
                type: "gpii.psp.mainWindow",
                container: "#flc-body",
                options: {
                    listeners: {
                        onPSPClose: "{clientChannel}.close",
                        onKeyOut: "{clientChannel}.keyOut",
                        onSettingAltered: "{clientChannel}.alterSetting",
                        onActivePreferenceSetAltered: "{clientChannel}.alterActivePreferenceSet",
                        onContentHeightChanged: "{clientChannel}.changeContentHeight",

                        onRestartNow: "{clientChannel}.restartNow",
                        onRestartLater: "{clientChannel}.restartLater",
                        onUndoChanges: "{clientChannel}.undoChanges"
                    }
                }
            }
        }
    });

    $(function () {
        gpii.psp();
    });
})(fluid);
