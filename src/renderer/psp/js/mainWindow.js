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
     * Calculates the total height of the PSP assuming that the settings panel is displayed fully, without the need for
     * it to scroll (i.e. if there were enough vertical space for the whole document).
     *
     * @param {Component} mainWindow - An instance of mainWindow.
     * @param {jQuery} container - A jQuery object representing the mainWindow container.
     * @param {jQuery} content - A jQuery object representing the content of the document between the header and footer.
     * This container is scrollable.
     * @param {jQuery} settingsList - A jQuery object representing the container in which the various widgets will have
     * their containers inserted.
     * @return {Number} - The height of the PSP assuming the settings panel is displayed fully.
     */
    gpii.psp.calculateHeight = function (mainWindow, container, content, settingsList) {
        return container.outerHeight(true) - content.height() + settingsList.height();
    };

    /**
     * Updates the accent color in the PSP `BrowserWindow`. The accent
     * color is taken into consideration only in the dark theme of the
     * PSP and is used for different styles (e.g. button backgrounds,
     * hover color for various inputs, etc).
     * @param {jQuery} theme - The `style` tag which houses the application
     * theme definitions.
     * @param {String} accentColor - The accent color used in the user's OS.
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
     * @param {jQuery} container - A jQuery object representing the body of
     * the page displayed in the PSP `BrowserWindow`.
     * @param {Object} themeClasses - A hash containing mapping between a
     * theme name and the corresponding CSS class which needs to be added
     * to the `body`.
     * @param {String} theme - The name of the theme that is to be applied.
     */
    gpii.psp.updateTheme = function (container, themeClasses, theme) {
        fluid.keys(themeClasses).forEach(function (themeKey) {
            container.removeClass(themeClasses[themeKey]);
        });

        if (themeClasses[theme]) {
            container.addClass(themeClasses[theme]);
        }
    };

    /**
     * Shows or hides the appropriate view (the sign in view or the psp view)
     * depending on the current preferences. If there is at least one preference
     * set, it is considered that the user has keyed in and hence the psp view
     * will be shown. Otherwise, the sign in view will be displayed.
     *
     * @param {jQuery} signInView - The signIn view container
     * @param {jQuery} pspView - The psp view container
     * @param {Boolean} keyedIn - Whether there is a keyed in user or not.
     * preference set, the active preference set and the available settings.
     */
    gpii.psp.toggleView = function (signInView, pspView, keyedIn) {
        if (keyedIn) {
            signInView.hide();
            pspView.show();
        } else {
            signInView.show();
            pspView.hide();
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
            theme: null,
            sounds: {}
        },
        modelRelay: {
            keyedIn: {
                target: "keyedIn",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.mainWindow.getKeyedIn",
                    args: ["{that}.model.preferences"]
                }
            }
        },
        selectors: {
            signIn: ".flc-signIn",
            psp:    ".flc-settingsEditor",

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

            signInPage: {
                type: "gpii.psp.signIn",
                container: ".flc-signIn",
                options: {
                    events: {
                        onSignInRequested: "{mainWindow}.events.onSignInRequested"
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
            preferences: [{
                func: "{that}.events.onPreferencesUpdated.fire",
                // as the `gpii.psp.elementRepeater` binding sends data back to here
                excludeSource: ["gpii.psp.repeater.element"]
            }, {
                funcName: "gpii.psp.mainWindow.playSoundNotification",
                args: ["{that}", "{change}.value", "{change}.oldValue"]
            }],
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
            "onCreate.setInitialView": {
                funcName: "{that}.toggleView"
            },
            "onPreferencesUpdated.toggleView": {
                funcName: "{that}.toggleView"
            }
        },
        invokers: {
            toggleView: {
                funcName: "gpii.psp.toggleView",
                args: [
                    "{that}.dom.signIn",
                    "{that}.dom.psp",
                    "{that}.model.keyedIn"
                ]
            },
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
            }
        },
        events: {
            onSignInRequested: null,

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
     * Returns whether there is a currently keyed in user.
     * @param {Object} preferences - An object containing all preference set, as well as
     * information about the currently active preference set.
     * @return {Boolean} `true` if there is currently a keyed in user and `false` otherwise.
     */
    gpii.psp.mainWindow.getKeyedIn = function (preferences) {
        return preferences && preferences.sets && preferences.sets.length > 0;
    };

    /**
     * Plays a sound notification in the following scenarios: when the user keyes in
     * or when the user changes the active preference set (either via the dropdown in
     * the PSP or through the context menu).
     * @param {Component} that - The `gpii.psp.mainWindow` instance.
     * @param {Object} preferences - An object containing all preference set, as well as
     * information about the currently active preference set.
     * @param {Object} oldPreferences - The previous value for the user's preferences.
     */
    gpii.psp.mainWindow.playSoundNotification = function (that, preferences, oldPreferences) {
        // The user is not / is no longer keyed in. No need for notification.
        if (!that.model.keyedIn) {
            return;
        }

        // The user was not keyed in before but now is. Play the keyed in sound.
        if (oldPreferences.sets.length === 0) {
            gpii.psp.playSound(that.model.sounds.keyedIn);
            return;
        }

        // The user is the same but the active set is different now.
        if (preferences.activeSet !== oldPreferences.activeSet) {
            gpii.psp.playSound(that.model.sounds.activeSetChanged);
        }
    };

    /**
     * Given the preferences received via the PSP channel and the current theme
     * for the PSP, creates an object which represents the preferences which are
     * to be used in the `header` component. The applicable image for each set is
     * determined based on the current application theme.
     * @param {Object} preferences - An object containing all preference set, as well as
     * information about the currently active preference set.
     * @param {String} theme - The current theme of the application.
     * @return {Object} The preferences object to be used in the `header` component
     * with the correct images for each preference set.
     */
    gpii.psp.mainWindow.getHeaderPreferences = function (preferences, theme) {
        var headerPreferences = fluid.copy(preferences);

        fluid.each(headerPreferences.sets, function (preferenceSet) {
            preferenceSet.imageSrc = preferenceSet.imageMap[theme];
        });

        return headerPreferences;
    };
})(fluid);
