/**
 * The main window component of the PSP
 *
 * A component which houses all visual components of the PSP (header, settingsPanel,
 * footer, restart warning).
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
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.psp");

    /**
     * Calculates the total height of the PSP assuming that the settings panel is
     * displayed fully, without the need for it to scroll (i.e. if there were enough
     * vertical space for the whole document).
     * @param mainWindow {Component} An instance of mainWindow.
     * @param container {jQuery} A jQuery object representing the mainWindow container.
     * @param content {jQuery} A jQuery object representing the content of the
     * document between the header and footer. This container is scrollable.
     * @param settingsList {jQuery} A jQuery object representing the container in
     * which the various widgets will have their containers inserted.
     * @param {Number} The height of the PSP assuming the settings panel is displayed
     * fully.
     */
    gpii.psp.calculateHeight = function (mainWindow, container, content, settingsList) {
        return container.outerHeight(true) - content.height() + settingsList.height();
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
     * Updates the accent color in the PSP `BrowserWindow`. The accent
     * color is taken into consideration only in the dark theme of the
     * PSP and is used for different styles (e.g. button backgrounds,
     * hover color for various inputs, etc).
     * @param theme {jQuery} The `style` tag which houses the application
     * theme definitions.
     * @param accentColor {String} The accent color used in the user's OS.
     */
    gpii.psp.updateAccentColor = function (theme, accentColor) {
        // The accent color is an 8-digit hex number whose last 2 digits
        // represent the alpha. In case the user has chosen his accent
        // color to be automatically picked by Windows, the accent color
        // is sometimes reported as an 8-digit hex number and sometimes
        // as a 6-digit number. The latter appears is incorrect and
        // should be ignored.
        if (accentColor && accentColor.length === 8) {
            var mainColor = "#" + accentColor.slice(0, 6),
                themeRules = ":root{ --main-color: " + mainColor + "; }";
            theme.text(themeRules);
        }
    };

    /**
     * Updates the theme of the PSP. There are two supported themes - a
     * `dark` and a `white` theme. The `white` theme is the default one
     * and it is applied automatically. In order to apply the `dark`
     * theme, the "theme-alt" class needs to be added to the `body` element.
     * @param container {jQuery} A jQuery object representing the body of
     * the page displayed in the PSP `BrowserWindow`.
     * @param themeClasses {Object} A hash containing mapping between a
     * theme name and the corresponding CSS class which needs to be added
     * to the `body`.
     * @param theme {String} The name of the theme that is to be applied.
     */
    gpii.psp.updateTheme = function (container, themeClasses, theme) {
        fluid.keys(themeClasses).forEach(function (themeKey) {
            container.removeClass(themeClasses[themeKey]);
        });

        if (themeClasses[theme]) {
            container.addClass(themeClasses[theme]);
        }
    };

    gpii.psp.playActivePrefSetSound = function (preferences) {
        if (!preferences.activeSet) {
            return;
        }

        var activePreferenceSet = fluid.find_if(preferences.sets,
            function (preferenceSet) {
                return preferenceSet.path === preferences.activeSet;
            }
        );

        if (activePreferenceSet && activePreferenceSet.soundSrc) {
            var sound = new Audio(activePreferenceSet.soundSrc);
            sound.play();
        }
    };

    /**
     * Responsible for drawing the settings list
     *
     * Note: currently only single update of available setting is supported
     */
    fluid.defaults("gpii.psp.mainWindow", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable"],
        model: {
            messages: {
                titlebarAppName: null
            },
            preferences: {
                sets: [],
                activeSet: null,
                settingGroups: []
            },
            theme: null
        },
        selectors: {
            theme: "#flc-theme",
            titlebar: "#flc-titlebar",
            header: "#flc-header",
            content: "#flc-content",
            footer: "#flc-footer",
            settingsList: "#flc-settingsList",
            restartWarning: "#flc-restartWarning",
            heightListenerContainer: "#flc-settingsList"
        },
        themeClasses: {
            dark: "theme-alt"
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
            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{mainWindow}.model.messages.titlebarAppName"
                        }
                    },
                    listeners: {
                        "onClose": "{mainWindow}.events.onPSPClose"
                    }
                }
            },
            header: {
                type: "gpii.psp.header",
                container: "{that}.dom.header",
                options: {
                    modelRelay: {
                        "preferences": {
                            target: "preferences",
                            singleTransform: {
                                type: "fluid.transforms.free",
                                func: "gpii.psp.mainWindow.getHeaderPreferences",
                                args: ["{mainWindow}.model.preferences", "{mainWindow}.model.theme"]
                            }
                        }
                    },
                    events: {
                        onPreferencesUpdated: "{mainWindow}.events.onPreferencesUpdated",
                        onActivePreferenceSetAltered: "{mainWindow}.events.onActivePreferenceSetAltered",
                        onKeyOut: "{mainWindow}.events.onKeyOut"
                    }
                }
            },
            settingsPanel: {
                type: "gpii.psp.settingsPanel",
                container: "{that}.dom.settingsList",
                createOnEvent: "{mainWindow}.events.onPreferencesUpdated",
                options: {
                    listeners: {
                        onHeightChanged: {
                            funcName: "{mainWindow}.updateHeight"
                        },
                        "{mainWindow}.events.onRestartRequired": {
                            funcName: "{that}.updatePendingChanges"
                        }
                    },
                    model: {
                        settingGroups: "{mainWindow}.model.preferences.settingGroups"
                    },
                    events: {
                        onSettingAltered: "{mainWindow}.events.onSettingAltered",
                        onSettingUpdated: "{mainWindow}.events.onSettingUpdated",
                        onRestartRequired: "{mainWindow}.events.onRestartRequired",

                        onRestartNow: "{mainWindow}.events.onRestartNow",
                        onUndoChanges: "{mainWindow}.events.onUndoChanges"
                    }
                }
            },
            footer: {
                type: "gpii.psp.footer",
                container: "{that}.dom.footer"
            }
        },
        modelListeners: {
            preferences: "{that}.events.onPreferencesUpdated",
            theme: {
                funcName: "gpii.psp.updateTheme",
                args: [
                    "{that}.container",
                    "{that}.options.themeClasses",
                    "{change}.value" // theme
                ]
            }
        },
        listeners: {
            onActivePreferenceSetAltered: {
                func: "{that}.playActivePrefSetSound"
            }
        },
        invokers: {
            "updatePreferences": {
                changePath: "preferences",
                value: "{arguments}.0",
                source: "psp.mainWindow"
            },
            "updateSetting": {
                func: "{that}.events.onSettingUpdated.fire",
                args: [
                    "{arguments}.0", // path
                    "{arguments}.1"  // value
                ]
            },
            "updateAccentColor": {
                funcName: "gpii.psp.updateAccentColor",
                args: [
                    "{that}.dom.theme",
                    "{arguments}.0" // accentColor
                ]
            },
            "updateTheme": {
                changePath: "theme",
                value: "{arguments}.0"
            },
            "calculateHeight": {
                funcName: "gpii.psp.calculateHeight",
                args: ["{that}", "{that}.container", "{that}.dom.content", "{that}.dom.settingsList"]
            },
            "playActivePrefSetSound": {
                funcName: "gpii.psp.playActivePrefSetSound",
                args: ["{that}.model.preferences"]
            }
        },
        events: {
            onPreferencesUpdated: null,

            onSettingAltered: null, // the setting was altered by the user
            onSettingUpdated: null,  // setting update is present from the API

            onPSPClose: null,
            onKeyOut: null,
            onActivePreferenceSetAltered: null,
            onHeightChanged: null,

            onRestartRequired: null,
            onRestartNow: null,
            onUndoChanges: null
        }
    });

    /**
     * Given the preferences received via the PSP channel and the current theme
     * for the PSP, creates an object which represents the preferences (i.e. the
     * preference sets and the path of the active preference set) which are to
     * be used in the `header` component. The applicable image for each set is
     * determined based on the current application theme.
     * @param preferences {Object} An object containing all preference set, as well as
     * information about the currently active preference set.
     * @param theme {String} The current theme of the application.
     * @return {Object} The preferences object to be used in the `header` component
     * with the correct images for each preference set.
     */
    gpii.psp.mainWindow.getHeaderPreferences = function (preferences, theme) {
        var headerPreferences = fluid.copy(preferences);

        fluid.each(headerPreferences.sets, function (preferenceSet) {
            preferenceSet.imageSrc = preferenceSet.imageMap[theme];
        });
        delete headerPreferences.settingGroups;

        return headerPreferences;
    };
})(fluid);
