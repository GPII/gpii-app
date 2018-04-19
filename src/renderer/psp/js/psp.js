/**
 * The PSP component in the renderer view
 *
 * A wrapper for the PSP window and the channel used for IPC between the main and the
 * renderer processes.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    fluid.registerNamespace("gpii.psp");

    fluid.defaults("gpii.psp", {
        gradeNames: ["fluid.component", "gpii.psp.messageBundles"],
        components: {
            channel: {
                type: "gpii.psp.clientChannel",
                options: {
                    listeners: {
                        onPSPOpen: {
                            funcName: "{mainWindow}.playActivePrefSetSound"
                        },
                        onPreferencesUpdated: {
                            funcName: "{mainWindow}.updatePreferences"
                        },
                        onAccentColorChanged: {
                            funcName: "{mainWindow}.updateAccentColor"
                        },
                        onThemeChanged: {
                            funcName: "{mainWindow}.updateTheme"
                        },
                        onSettingUpdated: {
                            funcName: "{mainWindow}.updateSetting"
                        },
                        onRestartRequired: {
                            funcName: "{mainWindow}.events.onRestartRequired.fire"
                        }
                    }
                }
            },

            mainWindow: {
                type: "gpii.psp.mainWindow",
                container: "#flc-body",
                options: {
                    listeners: {
                        onCreate: "{channel}.notifyPSPCreated",
                        onPSPClose: "{channel}.close",
                        onKeyOut: "{channel}.keyOut",
                        onSettingAltered: "{channel}.alterSetting",
                        onActivePreferenceSetAltered: "{channel}.alterActivePreferenceSet",
                        onHeightChanged: "{channel}.changeContentHeight",

                        onRestartNow:   "{channel}.restartNow",
                        onUndoChanges:  "{channel}.undoChanges"
                    }
                }
            }
        }
    });
})(fluid);
