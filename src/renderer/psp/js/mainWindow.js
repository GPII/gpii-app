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

    /**
     * A function which should be called whenever the total height of the document
     * assuming that the settings panel is displayed fully, without the need for it
     * to scroll (i.e. if there is enough vertical space for the whole document),
     * changes.
     * @param mainWindow {Component} An instance of mainWindow.
     * @param container {jQuery} A jQuery object representing the mainWindow container.
     * @param content {jQuery} A jQuery object representing the content of the
     * document between the header and footer. This container is scrollable.
     * @param settingsList {jQuery} A jQuery object representing the container in
     * which the various widgets will have their containers inserted.
     */
    gpii.psp.onContentHeightChanged = function (mainWindow, container, content, settingsList) {
        var height = container.outerHeight(true) - content.height() + settingsList.height();
        mainWindow.events.onContentHeightChanged.fire(height);
    };

    /**
     * Shows or hides the splash window according to the current
     * preference sets. The splash window should only be hidden when
     * there are no preference sets passed (the user is keyed out).
     *
     * @param splash {Object} The splash component
     * @param sets {Object[]} The current preference sets
     */
    gpii.psp.toggleSplashWindow = function (splash, sets) {
        if (sets && sets.length > 0) {
            splash.hide();
        } else {
            splash.show();
        }
    };

    /**
     * Updates the "theme" of the PSP `BrowserWindow`. Currently, the
     * theme consists simply of a definition of a `--main-color` variable
     * which is used for styling various widgets within the application.
     * @param theme {jQuery} The `style` tag which houses the application
     * theme definitions.
     * @param accentColor {String} The accent color used in the user's OS.
     */
    gpii.psp.updateTheme = function (theme, accentColor) {
        var mainColor = "#" + accentColor.slice(0, 6),
            themeRules = ":root{ --main-color: " + mainColor + "; }";
        theme.text(themeRules);
    };

    /**
     * Responsible for detecting height changes in the element in which
     * the component's container is nested.
     */
    fluid.defaults("gpii.psp.heightChangeListener", {
        gradeNames: ["fluid.viewComponent"],
        listeners: {
            "onCreate.initResizeListener": {
                "this": "@expand:$({that}.container.0.contentWindow)",
                method: "on",
                args: ["resize", "{that}.onHeightChanged"]
            }
        },
        invokers: {
            onHeightChanged: fluid.notImplemented
        }
    });

    /**
     * Responsible for drawing the settings list
     *
     * TODO support redrawing of settings
     * currently only single update of available setting is supported
     */
    fluid.defaults("gpii.psp.mainWindow", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            preferences: {
                sets: [],
                activeSet: null,
                settings: []
            },
            solutionNames: []
        },
        selectors: {
            theme: "#flc-theme",
            header: "#flc-header",
            content: "#flc-content",
            footer: "#flc-footer",
            settingsList: "#flc-settingsList",
            heightChangeListener: "#flc-heightChangeListener",
            restartWarning: "#flc-restartWarning"
        },
        components: {
            splash: {
                type: "gpii.psp.splash",
                container: "{that}.container",
                options: {
                    listeners: {
                        "{mainWindow}.events.onPreferencesUpdated": {
                            funcName: "gpii.psp.toggleSplashWindow",
                            args: ["{that}", "{mainWindow}.model.preferences.sets"]
                        }
                    }
                }
            },
            header: {
                type: "gpii.psp.header",
                container: "{that}.dom.header",
                options: {
                    model: {
                        preferences: {
                            sets: "{mainWindow}.model.preferences.sets",
                            activeSet: "{mainWindow}.model.preferences.activeSet"
                        }
                    },
                    events: {
                        onPreferencesUpdated: "{mainWindow}.events.onPreferencesUpdated",
                        onActivePreferenceSetAltered: "{mainWindow}.events.onActivePreferenceSetAltered"
                    },
                    listeners: {
                        "onPSPClose": "{mainWindow}.events.onPSPClose"
                    }
                }
            },
            settingsPanel: {
                type: "gpii.psp.settingsPanel",
                container: "{that}.dom.settingsList",
                createOnEvent: "{mainWindow}.events.onPreferencesUpdated",
                options: {
                    model: {
                        settings: "{mainWindow}.model.preferences.settings"
                    },
                    events: {
                        onSettingAltered: "{mainWindow}.events.onSettingAltered",
                        onSettingUpdated: "{mainWindow}.events.onSettingUpdated",
                        onSettingApplied: "{mainWindow}.events.onRestartNow"
                    }
                }
            },
            restartWarning: {
                type: "gpii.psp.restartWarning",
                container: "{that}.dom.restartWarning",
                options: {
                    model: {
                        solutionNames: "{mainWindow}.model.solutionNames"
                    },
                    events: {
                        onRestartNow: "{mainWindow}.events.onRestartNow",
                        onRestartLater: "{mainWindow}.events.onRestartLater",
                        onUndoChanges: "{mainWindow}.events.onUndoChanges"
                    }
                }
            },
            footer: {
                type: "gpii.psp.footer",
                container: "{that}.dom.footer",
                options: {
                    events: {
                        onKeyOut: "{mainWindow}.events.onKeyOut"
                    }
                }
            },
            heightChangeListener: {
                type: "gpii.psp.heightChangeListener",
                container: "{that}.dom.heightChangeListener",
                options: {
                    invokers: {
                        onHeightChanged: "{mainWindow}.onContentHeightChanged"
                    }
                }
            }
        },
        modelListeners: {
            "preferences": "{that}.events.onPreferencesUpdated"
        },
        invokers: {
            "updatePreferences": {
                changePath: "preferences",
                value: "{arguments}.0",
                source: "psp.mainWindow"
            },
            "updateSetting": {
                // TODO just fire because... (redrawing)
                func: "{that}.events.onSettingUpdated.fire",
                args: [
                    "{arguments}.0",
                    "{arguments}.1"
                ]
            },
            "updateTheme": {
                funcName: "gpii.psp.updateTheme",
                args: ["{that}.dom.theme", "{arguments}.0"]
            },
            "onContentHeightChanged": {
                funcName: "gpii.psp.onContentHeightChanged",
                args: ["{that}", "{that}.container", "{that}.dom.content", "{that}.dom.settingsList"]
            },
            "updateSolutionNames": {
                changePath: "solutionNames",
                value: "{arguments}.0"
            }
        },
        events: {
            onPreferencesUpdated: null,

            onSettingAltered: null, // the setting was altered by the user
            onSettingUpdated: null,  // setting update is present from the API

            onPSPClose: null,
            onKeyOut: null,
            onActivePreferenceSetAltered: null,
            onContentHeightChanged: null,

            onRestartNow: null,
            onRestartLater: null,
            onUndoChanges: null
        }
    });
})(fluid);
