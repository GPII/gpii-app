"use strict";
(function () {
    var fluid = window.fluid,
        gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer,
        shell = require("electron").shell;

    fluid.registerNamespace("gpii.pcp");

    /**
     * Registers callbacks to be invoked whenever the main electron
     * process sends a corresponding message.
     * @param that {Component} An instance of mainWindow.
     */
    gpii.pcp.addCommunicationChannel = function (that) {
        ipcRenderer.on("keyIn", function (event, preferences) {
            that.updatePreferences(preferences);
        });

        ipcRenderer.on("updateSetting", function (event, settingData) {
            that.events.onSettingUpdate.fire(settingData);
        });

        ipcRenderer.on("keyOut", function (event, preferences) {
            that.updatePreferences(preferences);
        });

        ipcRenderer.on("accentColorChanged", function (event, accentColor) {
            var mainColor = "#" + accentColor.slice(0, 6),
                theme = ":root{ --main-color: " + mainColor + "; }";
            that.updateTheme(theme);
        });
    };

    /**
     * A function which should be called whenever a settings is updated
     * as a result of a user's input. Its purpose is to notify the main
     * electron process for the change.
     * @param path {String} The path of the updated setting.
     * @param value {Any} The new, updated value for the setting. Can be
     * of different type depending on the setting.
     */
    gpii.pcp.updateSetting = function (path, value) {
        ipcRenderer.send("updateSetting", {
            path: path,
            value: value
        });
    };

    /**
     * A function which should be called when the active preference set
     * has been changed as a result of a user's input. It will notify
     * the main electron process for the change.
     * @param value {String} The path of the new active preference set.
     */
    gpii.pcp.updateActivePreferenceSet = function (value) {
        ipcRenderer.send("updateActivePreferenceSet", {
            value: value
        });
    };

    /**
     * Notifies the main electron process that the user must be keyed out.
     */
    gpii.pcp.keyOut = function () {
        ipcRenderer.send("keyOut");
    };

    /**
     * A function which should be called when the PCP window needs to be
     * closed. It simply notifies the main electron process for this.
     */
    gpii.pcp.closeSettingsWindow = function () {
        ipcRenderer.send("closePCP");
    };

    /**
     * A function which should be called whenever the total height of the document
     * assuming that the settings panel is displayed fully, without the need for it
     * to scroll (i.e. if there is enough vertical space for the whole document),
     * changes.
     * @param mainWindow {Object} A jQuery object representing the mainWindow.
     * @param content {Object} A jQuery object representing the content of the
     * document between the header and footer. This container is scrollable.
     * @param settingsList {Object} A jQuery object representing the container in
     * which the various widgets will have their containers inserted.
     */
    gpii.pcp.onContentHeightChanged = function (mainWindow, content, settingsList) {
        var height = mainWindow.outerHeight(true) - content.height() + settingsList.height();
        ipcRenderer.send("contentHeightChanged", height);
    };

    /**
     * Opens the passed url externally using the default browser for the
     * OS (or set by the user).
     * @param url {String} The url to open externally.
     */
    gpii.pcp.openUrl = function (url) {
        shell.openExternal(url);
    };

    /**
     * Utility function for retrieving the last sub-element of a container
     * @param container {Object} The jQuery container object
     * @returns {Object} A jQuery container object
     */
    gpii.pcp.getContainerLastChild = function (container) {
        return container.children().last();
    };

    /**
     * A method responsible for showing a restart icon when the user changes a setting
     * which is not dynamic.
     * @param dynamic {Boolean} Whether the current setting is dynamic or not.
     * @param restartIcon {Object} A jQuery object representing the restart icon.
     */
    gpii.pcp.showRestartIcon = function (dynamic, restartIcon) {
        if (!dynamic) {
            restartIcon.show();
        }
    };

    /**
     * A method responsible for showing a memory icon if the setting will be persisted
     * after a user has changed it.
     * @param isPersisted {Boolean} Whether the current setting will be persisted or not.
     * @param memoryIcon {Object} A jQuery object representing the memory icon.
     */
    gpii.pcp.showMemoryIcon = function (isPersisted, memoryIcon) {
        if (isPersisted) {
            memoryIcon.show();
        }
    };



    /**
     * A function which checks if an array object holds more than one element.
     * @param arr {Array} The array to be checked.
     * @return {Boolean} Whether the array has more than one element.
     */
    gpii.pcp.hasMultipleItems = function (arr) {
        return arr && arr.length > 1;
    };

    /**
     * Retrieves the type for the preferenceSetPicker subcomponent. In case there
     * is more than one available preference set, the type should be a dropdown.
     * Otherwise, the component should not initialize and ignore all its config
     * properties (and hence must have an emptySubcomponent type).
     * @param preferenceSets {Array} An array of the current preference sets.
     * @return {String} The type of the preferenceSetPicker subcomponent.
     */
    gpii.pcp.getPreferenceSetPickerType = function (preferenceSets) {
        return gpii.pcp.hasMultipleItems(preferenceSets) ? "gpii.pcp.widgets.dropdown" : "fluid.emptySubcomponent";
    };

    /**
     * Updates the DOM elements corresponding to the header component whenever new
     * preferences are received.
     * @param preferenceSets {Array} An array containing the new preferece sets.
     * @param preferenceSetPickerElem {Object} A jQuery object corresponding to the
     * preference set dropdown (in case there are multiple preference sets, it should
     * be shown, otherwise it should be hidden).
     * @param activePreferenceSetElem {Object} A jQuery object corresponding to the
     * preference set label (in case there is a single preference set it should be
     * show, otherwise it should be hidden).
     */
    gpii.pcp.updateHeader = function (preferenceSets, preferenceSetPickerElem, activePreferenceSetElem) {
        if (gpii.pcp.hasMultipleItems(preferenceSets)) {
            preferenceSetPickerElem.show();
            activePreferenceSetElem.hide();
        } else {
            preferenceSetPickerElem.hide();
            activePreferenceSetElem.show();
        }
    };

    /**
     * A listener which is invoked whenever the preference set picker component is
     * destroyed. This function simply removes all options for the dropdown (actually
     * represented as a <select> element) from the DOM.
     * @param container {Object} A jQuery object representing the parent container
     * of the preference set picker.
     */
    gpii.pcp.onPreferenceSetPickerDestroy = function (container) {
        container.find("option").remove();
    };

    /**
     * Updates the passed DOM element to contain the name of the active preference
     * set. If there is no currently active preference set (e.g. if there is no
     * keyed-in user), nothing should be displayed.
     * @param activeSetElement {Object} A jQuery object representing the DOM element
     * whose text is to be updated.
     * @param preferences {Object} An object containing all preference set, as well
     * as information about the currently active preference set.
     */
    gpii.pcp.updateActiveSetElement = function (activeSetElement, preferences) {
        var activePreferenceSet = fluid.find_if(preferences.sets,
            function (preferenceSet) {
                return preferenceSet.path === preferences.activeSet;
            }
        );

        if (activePreferenceSet) {
            activeSetElement.text(activePreferenceSet.name);
        } else {
            activeSetElement.empty();
        }
    };

    /**
     * TODO
     */
    fluid.defaults("gpii.pcp.header", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            preferenceSetPicker: ".flc-prefSetPicker",
            activePreferenceSet: ".flc-activePreferenceSet",
            closeBtn: ".flc-closeBtn"
        },
        model: {
            preferences: {
                sets: "{mainWindow}.model.preferences.sets",
                activeSet: "{mainWindow}.model.preferences.activeSet"
            }
        },
        modelListeners: {
            "preferences.activeSet": [{
                funcName: "gpii.pcp.updateActivePreferenceSet",
                args: ["{change}.value"],
                excludeSource: ["init", "outer"],
                namespace: "notifyMainProcess"
            },{
                funcName: "gpii.pcp.updateActiveSetElement",
                args: ["{that}.dom.activePreferenceSet", "{that}.model.preferences"],
                namespace: "updateElement"
            }]
        },
        components: {
            preferenceSetPicker: {
                type: "@expand:gpii.pcp.getPreferenceSetPickerType({that}.model.preferences.sets)",
                container: "{that}.dom.preferenceSetPicker",
                createOnEvent: "{mainWindow}.events.onPreferencesUpdated",
                options: {
                    model: {
                        optionNames: {
                            expander: {
                                func: "fluid.getMembers",
                                args: ["{header}.model.preferences.sets", "name"]
                            }
                        },
                        optionList: {
                            expander: {
                                func: "fluid.getMembers",
                                args: ["{header}.model.preferences.sets", "path"]
                            }
                        },
                        selection: "{header}.model.preferences.activeSet"
                    },
                    listeners: {
                        "onDestroy.removeOptions": {
                            funcName: "gpii.pcp.onPreferenceSetPickerDestroy",
                            args: ["{that}.container"]
                        }
                    },
                    attrs: {
                        "aria-label": "Preference set"
                    }
                }
            },
            closeBtn: {
                type: "gpii.pcp.widgets.button",
                container: "{that}.dom.closeBtn",
                options: {
                    attrs: {
                        "aria-label": "Close"
                    },
                    invokers: {
                        "onClick": "{mainWindow}.close"
                    }
                }
            }
        },
        listeners: {
            "{mainWindow}.events.onPreferencesUpdated": {
                funcName: "gpii.pcp.updateHeader",
                args: ["{that}.model.preferences.sets", "{that}.dom.preferenceSetPicker", "{that}.dom.activePreferenceSet"]
            }
        }
    });

    fluid.defaults("gpii.pcp.splash", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            splash: ".flc-splash"
        },
        invokers: {
            show: {
                this: "{that}.dom.splash",
                method: "show"
            },
            hide: {
                this: "{that}.dom.splash",
                method: "hide"
            }
        }
    });

    /**
     * Whether shows or hides the splash window according to current
     * preference sets. The splash window should only be hidden when
     * there are no preference sets passed (the user is keyed out).
     *
     * @param splash {Object} The splash component
     * @param sets {Object[]} The list of currently set components
     */
    gpii.pcp.splash.toggleSplashWindow = function (splash, sets) {
        if (sets && sets.length > 0) {
            splash.hide();
        } else {
            splash.show();
        }
    };

    fluid.defaults("gpii.pcp.footer", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            keyOutBtn: ".flc-keyOutBtn",
            helpBtn: ".flc-helpBtn"
        },
        components: {
            keyOutBtn: {
                type: "gpii.pcp.widgets.button",
                container: "{that}.dom.keyOutBtn",
                options: {
                    label: "{footer}.options.labels.keyOut",
                    invokers: {
                        "onClick": "gpii.pcp.keyOut"
                    }
                }
            },
            helpBtn: {
                type: "gpii.pcp.widgets.button",
                container: "{that}.dom.helpBtn",
                options: {
                    label: "{footer}.options.labels.help",
                    invokers: {
                        "onClick": "gpii.pcp.openUrl({footer}.options.urls.help)"
                    }
                }
            }
        },
        urls: {
            help: "http://pmt.gpii.org/help"
        },
        labels: {
            keyOut: "Key Out",
            help: "Help"
        }
    });

    /**
     * Responsible for detecting height changes in the element in which
     * the component's container is nested.
     */
    fluid.defaults("gpii.pcp.heightChangeListener", {
        gradeNames: ["fluid.viewComponent"],
        listeners: {
            "onCreate.initResizeListener": {
                "this": "@expand:$({that}.container.0.contentWindow)",
                method: "on",
                args: ["resize", "{that}.onHeightChanged"]
            }
        },
        invokers: {
            onHeightChanged: null
        }
    });

    /**
     * Responsible for drawing the settings list
     *
     * TODO support redrawing of settings
     * currently only single update of available setting is supported
     */
    fluid.defaults("gpii.pcp.mainWindow", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            preferences: {
                sets: [],
                activeSet: null,
                settings: []
            }
        },
        selectors: {
            theme: "#flc-theme",
            header: "#flc-header",
            content: "#flc-content",
            footer: "#flc-footer",
            settingsList: "#flc-settingsList",
            heightChangeListener: "#flc-heightChangeListener"
        },
        components: {
            splash: {
                type: "gpii.pcp.splash",
                container: "{that}.container",
                options: {
                    listeners: {
                        "{mainWindow}.events.onPreferencesUpdated": {
                            funcName: "gpii.pcp.splash.toggleSplashWindow",
                            args: ["{that}", "{mainWindow}.model.preferences.sets"]
                        }
                    }
                }
            },
            header: {
                type: "gpii.pcp.header",
                container: "{that}.dom.header"
                // TODO send options
            },
            settingsPanel: {
                type: "gpii.pcp.settingsPanel",
                container: "{that}.dom.settingsList",
                createOnEvent: "{mainWindow}.events.onPreferencesUpdated",
                options: {
                    model: {
                        settings: "{mainWindow}.model.preferences.settings"
                    }
                }
            },
            footer: {
                type: "gpii.pcp.footer",
                container: "{that}.dom.footer"
            },
            heightChangeListener: {
                type: "gpii.pcp.heightChangeListener",
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
        listeners: {
            "onCreate.addCommunicationChannel": {
                funcName: "gpii.pcp.addCommunicationChannel",
                args: ["{that}"]
            }
        },
        invokers: {
            "updatePreferences": {
                changePath: "preferences",
                value: "{arguments}.0",
                source: "outer"
            },
            "updateTheme": {
                "this": "{that}.dom.theme",
                method: "text",
                args: ["{arguments}.0"]
            },
            "onContentHeightChanged": {
                funcName: "gpii.pcp.onContentHeightChanged",
                args: [
                    "{that}.container",
                    "{that}.dom.content",
                    "{that}.dom.settingsList"
                ]
            },
            "close": "gpii.pcp.closeSettingsWindow()"
        },
        events: {
            onPreferencesUpdated: null,
            onSettingUpdate: null
        }
    });

    $(function () {
        gpii.pcp.mainWindow("#flc-body");
    });
})();
