/**
 * The quick set strip
 *
 * Represents the quick set strip with which the user can update his settings.
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

    /**
     * Represents the list of QSS settings. It renders the settings and listens for events
     * triggered by the buttons. The `handlerGrades` hash maps the type of a setting to the
     * gradeName of the handler which will present the corresponding setting button in the
     * QSS. If for a given setting type there is no entry in the `handlerGrades` hash, the
     * the `defaultHandlerGrade` will be used for its presenter.
     */
    fluid.defaults("gpii.qss.list", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            messages: {
                infoBlock: null,
                buttonBlock1: null,
                buttonBlock2: null
            }
        },

        selectors: {
            morePanel: ".flc-quickSetStrip-more",
            morePanelGrid: ".flc-quickSetStrip-more-button-grid",
            mainPanel: ".flc-quickSetStrip-main",
            closeMorePanelBtn: ".flc-quickSetStrip-more-close"
        },

        defaultHandlerGrade: "gpii.qss.buttonPresenter",
        handlerGrades: {
            "boolean":           "gpii.qss.toggleButtonPresenter",
            "number":            "gpii.qss.widgetButtonPresenter",
            "string":            "gpii.qss.widgetButtonPresenter",
            "close":             "gpii.qss.closeButtonPresenter",
            "mySavedSettings":   "gpii.qss.mySavedSettingsButtonPresenter",
            "save":              "gpii.qss.saveButtonPresenter",
            "undo":              "gpii.qss.undoButtonPresenter",
            "resetAll":          "gpii.qss.resetAllButtonPresenter",
            "more":              "gpii.qss.moreButtonPresenter",
            "openUSB":           "gpii.qss.widgetButtonPresenter",
            "office":            "gpii.qss.widgetButtonPresenter",
            "cloud-folder-open": "gpii.qss.openCloudFolderPresenter",
            "launch-documorph":  "gpii.qss.launchDocuMorphPresenter",
            "volume":            "gpii.qss.volumeButtonPresenter",
            "mouse":             "gpii.qss.widgetButtonPresenter",
            "snipping-tool":     "gpii.qss.snippingToolPresenter",
            "disabled":          "gpii.qss.disabledButtonPresenter",
            // custom button grades
            "custom-launch-app": "gpii.qss.customLaunchAppPresenter",
            "custom-open-url":   "gpii.qss.customOpenUrlPresenter",
            "custom-keys":       "gpii.qss.customKeysPresenter",
            // separator grade
            "separator":         "gpii.qss.separatorButtonPresenter",
            // grid grade
            "grid":              "gpii.qss.gridButtonPresenter",
            // url based buttons
            "url-google-drive":  "gpii.qss.urlGoogleDrivePresenter",
            "url-one-drive":     "gpii.qss.urlOneDrivePresenter",
            "url-dropbox":       "gpii.qss.urlDropboxPresenter",
            "url-customize-qss": "gpii.qss.urlCustomizeQssPresenter"
        },
        eventDelay: 10,

        settings: {
            expander: {
                funcName: "gpii.qss.list.filterQssSettings",
                args: ["{that}.model.items", false]
            }
        },

        morePanelSettings: {
            expander: {
                funcName: "gpii.qss.list.filterQssSettings",
                args: ["{that}.model.items", true]
            }
        },

        dynamicContainerMarkup: {
            container:
                "<div class=\"%containerClass fl-focusable\">" +
                "</div>",
            containerClassPrefix: "fl-qss-button"
        },
        markup: "<div class=\"flc-qss-btnChangeIndicator fl-qss-btnChangeIndicator\"></div>" +
                "<div class=\"flc-qss-btnImage fl-qss-btnImage\"></div>" +
                "<span class=\"flc-qss-btnLabel fl-qss-btnLabel\"></span>" +
                "<div class=\"flc-qss-btnCaption fl-qss-btnCaption\"></div>",

        events: {
            onButtonFocusRequired: null,

            // external events
            onButtonFocused: null,
            onButtonActivated: null,
            onButtonMouseEnter: null,
            onButtonMouseLeave: null,

            onSettingAltered: null,
            onNotificationRequired: null,
            onMorePanelRequired: null,
            onMorePanelClosed: null,
            onUndoRequired: null,
            onResetAllRequired: null,
            onSaveRequired: null,
            onQssClosed: null,
            onUndoIndicatorChanged: null
        },
        listeners: {
            onResetAllRequired: "{list}.events.onMorePanelClosed.fire",
            onQssClosed: "{list}.events.onMorePanelClosed.fire"
        },
        modelListeners: {
            "items": {
                func: "gpii.qss.list.filterSettings",
                args: ["{qssStripRepeater}", "{qssMorePanelRepeater}", "{that}.model.items"]
            }
        },

        components: {
            qssStripRepeater: {
                type: "gpii.psp.repeater",
                container: "{list}.dom.mainPanel",
                options: {
                    defaultHandlerGrade: "{list}.options.defaultHandlerGrade",
                    handlerGrades: "{list}.options.handlerGrades",
                    model: {
                        items: "{list}.options.settings"
                    },
                    dynamicContainerMarkup: "{list}.options.dynamicContainerMarkup",
                    markup: "{list}.options.markup",
                    events: {
                        onUndoIndicatorChanged: "{list}.events.onUndoIndicatorChanged",
                        onButtonFocusRequired: "{list}.events.onButtonFocusRequired",

                        onButtonFocused: "{list}.events.onButtonFocused",
                        onButtonActivated: "{list}.events.onButtonActivated",
                        onButtonMouseEnter: "{list}.events.onButtonMouseEnter",
                        onButtonMouseLeave: "{list}.events.onButtonMouseLeave",

                        onSettingAltered: "{list}.events.onSettingAltered",
                        onNotificationRequired: "{list}.events.onNotificationRequired",
                        onMorePanelRequired: "{list}.events.onMorePanelRequired",
                        onUndoRequired: "{list}.events.onUndoRequired",
                        onResetAllRequired: "{list}.events.onResetAllRequired",
                        onSaveRequired: "{list}.events.onSaveRequired",
                        onQssClosed: "{list}.events.onQssClosed"
                    },
                    invokers: {
                        getHandlerType: {
                            funcName: "gpii.qss.list.getHandlerType",
                            args: [
                                "{that}",
                                "{arguments}.0" // item
                            ]
                        }
                    }
                }
            },
            qssMorePanel: {
                type: "fluid.viewComponent",
                container: "{list}.dom.morePanel",
                options: {
                    gradeNames: "gpii.psp.selectorsTextRenderer",
                    enableRichText: true,
                    selectors: {
                        infoBlock: ".flc-info-block",
                        buttonBlock1: ".flc-button-block-1",
                        buttonBlock2: ".flc-button-block-2"
                    },
                    model: {
                        messages: {
                            infoBlock: "{list}.model.messages.infoBlock",
                            buttonBlock1: "{list}.model.messages.buttonBlock1",
                            buttonBlock2: "{list}.model.messages.buttonBlock2"
                        }
                    }
                }
            },
            qssMorePanelRepeater: {
                type: "gpii.psp.repeater",
                container: "{list}.dom.morePanelGrid",
                options: {
                    defaultHandlerGrade: "{list}.options.defaultHandlerGrade",
                    handlerGrades: "{list}.options.handlerGrades",
                    model: {
                        items: "{list}.options.morePanelSettings"
                    },
                    dynamicContainerMarkup: "{list}.options.dynamicContainerMarkup",
                    markup: "{list}.options.markup",
                    events: {
                        onUndoIndicatorChanged: "{list}.events.onUndoIndicatorChanged",
                        onButtonFocusRequired: "{list}.events.onButtonFocusRequired",

                        onButtonFocused: "{list}.events.onButtonFocused",
                        onButtonActivated: "{list}.events.onButtonActivated",
                        onButtonMouseEnter: "{list}.events.onButtonMouseEnter",
                        onButtonMouseLeave: "{list}.events.onButtonMouseLeave",

                        onSettingAltered: "{list}.events.onSettingAltered",
                        onNotificationRequired: "{list}.events.onNotificationRequired",
                        onUndoRequired: "{list}.events.onUndoRequired",
                        onResetAllRequired: "{list}.events.onResetAllRequired",
                        onSaveRequired: "{list}.events.onSaveRequired"
                    },
                    invokers: {
                        getHandlerType: {
                            funcName: "gpii.qss.list.getHandlerType",
                            args: [
                                "{that}",
                                "{arguments}.0" // item
                            ]
                        }
                    }
                }
            },
            closeMorePanelBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.closeMorePanelBtn",
                options: {
                    attrs: {
                        "aria-label": "Close More Panel"
                    },
                    listeners: {
                        onClick: "{list}.events.onMorePanelClosed.fire"
                    }
                }
            },
            windowKeyListener: {
                type: "fluid.component",
                options: {
                    gradeNames: "gpii.app.keyListener",
                    target: {
                        expander: {
                            funcName: "jQuery",
                            args: [window]
                        }
                    },
                    events: {
                        onEscapePressed: null
                    },
                    listeners: {
                        onEscapePressed: {
                            funcName: "{list}.eventTimeout.start",
                            args: ["{list}.options.eventDelay"]
                        }
                    }
                }
            },
            eventTimeout: {
                type: "gpii.app.timer",
                options: {
                    listeners: {
                        onTimerFinished: {
                            func: "{list}.events.onMorePanelClosed.fire"
                        }
                    }
                }
            }
        }
    });

    /**
     * Using the filterQssSettings to add the items to the main and the more button
     * @param  {qssStripRepeater} qssStripRepeater     [description]
     * @param  {qssMorePanelRepeater} qssMorePanelRepeater [description]
     * @param  {Object[]} items - all available buttons found in settings.json
     */
    gpii.qss.list.filterSettings = function (qssStripRepeater, qssMorePanelRepeater, items) {
        var qssStripItems = gpii.qss.list.filterQssSettings(items, false),
            morePanelItems = gpii.qss.list.filterQssSettings(items, true);

        qssStripRepeater.applier.change("items", qssStripItems, null, "gpii.qss.list");
        qssMorePanelRepeater.applier.change("items", morePanelItems, null, "gpii.qss.list");
    };

    /**
     * Filter the settings object between the main and more panels using the
     * setting.schema.morePanel key
     * @param  {Object[]} settings - all available buttons found in settings.json
     * @param  {Boolean} morePanel - to be in the main or the main panel
     * @return {Object[]} - same structure as the settings, but filtered result
     */
    gpii.qss.list.filterQssSettings = function (settings, morePanel) {
        var filteredSetting = [];

        fluid.each(settings, function (setting) {
            if (setting.schema) {
                if (morePanel) {
                    if (setting.schema.morePanel) {
                        filteredSetting.push(setting);
                    }
                } else if (!setting.schema.morePanel) {
                    filteredSetting.push(setting);
                }
            }
        });

        return filteredSetting;
    };

    /**
     * Returns the correct handler type (a grade inheriting from `gpii.qss.buttonPresenter`)
     * for the given setting depending on its type.
     * @param {Component} that - The `gpii.qss.list` instance.
     * @param {Object} setting - The setting for which the handler type is to be determined.
     * @return {String} The grade name of the setting's handler.
     */
    gpii.qss.list.getHandlerType = function (that, setting) {
        var handlerGrades = that.options.handlerGrades,
            settingType = setting.schema.type;

        return handlerGrades[settingType] || that.options.defaultHandlerGrade;
    };

    /**
     * Wrapper that enables internationalization of the `gpii.qss` component and
     * intercepts all anchor tags on the page so that an external browser is used
     * for loading them.
     */
    fluid.defaults("gpii.psp.translatedQss", {
        gradeNames: [
            "gpii.psp.messageBundles",
            "fluid.viewComponent",
            "gpii.psp.linksInterceptor",
            "gpii.psp.baseWindowCmp.signalDialogReady"
        ],

        components: {
            quickSetStrip: {
                type: "gpii.qss",
                container: "{translatedQss}.container",
                options: {
                    model: {
                        settings: "{translatedQss}.model.settings"
                    },
                    siteConfig: "{translatedQss}.options.siteConfig"
                }
            }
        }
    });

    /**
     * Represents all renderer components of the QSS including the list of settings,
     * the `focusManager` and the channels for communication with the main process.
     */
    fluid.defaults("gpii.qss", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            isKeyedIn: false,
            settings: []
        },

        selectors: {
            logo: ".flc-qss-logo"
        },

        events: {
            onQssOpen: null,
            onQssClosed: null,
            onQssWidgetToggled: null,
            onQssLogoToggled: null
        },

        defaultFocusButtonType: "psp",

        listeners: {
            "onQssOpen": {
                funcName: "gpii.qss.onQssOpen",
                args: [
                    "{quickSetStripList}",
                    "{focusManager}",
                    "{that}.model.settings",
                    "{that}.options.defaultFocusButtonType",
                    "{arguments}.0" // params
                ]
            },

            onQssLogoToggled: {
                this: "{that}.dom.logo",
                method: "toggle",
                args: ["{arguments}.0"]
            }
        },

        components: {
            quickSetStripList: {
                type: "gpii.qss.list",
                container: "{that}.container",
                options: {
                    model: {
                        items: "{quickSetStrip}.model.settings"
                    },
                    events: {
                        onQssClosed: "{gpii.qss}.events.onQssClosed",
                        onUndoIndicatorChanged: null
                    }
                }
            },
            focusManager: {
                type: "gpii.qss.qssFocusManager",
                container: "{qss}.container",
                options: {
                    events: {
                        onMorePanelRequired: "{quickSetStripList}.events.onMorePanelRequired",
                        onMorePanelClosed: "{list}.events.onMorePanelClosed"
                    }
                }
            },
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        // Add events from the main process to be listened for
                        onQssOpen: "{qss}.events.onQssOpen",
                        onQssWidgetToggled: "{qss}.events.onQssWidgetToggled",
                        onQssLogoToggled: "{qss}.events.onQssLogoToggled",
                        onSettingUpdated: null,
                        onIsKeyedInChanged: null,

                        onUndoIndicatorChanged: "{quickSetStripList}.events.onUndoIndicatorChanged"
                    },
                    listeners: {
                        onSettingUpdated: {
                            funcName: "gpii.qss.updateSetting",
                            args: [
                                "{qss}",
                                "{arguments}.0"
                            ]
                        },
                        onIsKeyedInChanged: {
                            func: "{gpii.qss}.updateIsKeyedIn"
                        }
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        // Add events the main process to be notified for
                        onQssClosed:           "{qss}.events.onQssClosed",
                        onQssButtonFocused:    "{quickSetStripList}.events.onButtonFocused",
                        onQssButtonsFocusLost: "{focusManager}.events.onFocusLost",
                        onQssButtonActivated:  "{quickSetStripList}.events.onButtonActivated",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave",

                        onQssSettingAltered:   "{quickSetStripList}.events.onSettingAltered",
                        onQssNotificationRequired: "{quickSetStripList}.events.onNotificationRequired",
                        onQssMorePanelRequired: "{quickSetStripList}.events.onMorePanelRequired",
                        onMorePanelClosed: "{list}.events.onMorePanelClosed",
                        onQssUndoRequired: "{quickSetStripList}.events.onUndoRequired",
                        onQssResetAllRequired: "{quickSetStripList}.events.onResetAllRequired",
                        onQssSaveRequired: "{quickSetStripList}.events.onSaveRequired",

                        // Custom buttons events
                        onQssStartProcess: null,
                        onQssExecuteKeySequence: null
                    }
                }
            }
        },

        invokers: {
            updateIsKeyedIn: {
                changePath: "isKeyedIn",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * Returns the index of the `setting` object in the `settings` array. Settings are identified
     * by their `path` property which is expected to be existent and unique.
     * @param {Object[]} settings - An array of QSS settings.
     * @param {Object} setting - The particular setting whose index is queried.
     * @return {Number} The index of the setting in the specified array or -1 if the setting is not
     * present in the array.
     */
    gpii.qss.getSettingIndex = function (settings, setting) {
        return settings.findIndex(function (currentSetting) {
            return currentSetting.path === setting.path;
        });
    };

    /**
     * Finds a setting in a list of settings and updates it.
     * @param {Component} that - The component containing `settings` in its model
     * @param {Object} settingNewState - The new state of the setting
     * @param {String} settingNewState.path - The path of the setting. This field is required.
     */
    gpii.qss.updateSetting = function (that, settingNewState) {
        var settingIndex = gpii.qss.getSettingIndex(that.model.settings, settingNewState);
        gpii.app.applier.replace(that.applier, "settings." + settingIndex, settingNewState, "channelNotifier.settingUpdate");
    };

    /**
     * Handles opening of the QSS by focusing or removing the focus for the QSS buttons
     * depending on how the QSS was opened (using the keyboard shortcut, by clicking the
     * tray icon, by closing the QSS widget using the left, right arrow keys or the ESC).
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance for the QSS.
     * @param {Object[]} settings - An array of QSS settings.
     * @param {String} defaultFocusButtonType - The gradeName of the QSS button which should
     * be focused by default (i.e. when the QSS is opened using the keyboard shortcut).
     * @param {Object} params - An object containing parameter's for the activation
     * of the button (e.g. which key was used to open the QSS).
     */
    gpii.qss.onQssOpen = function (qssList, focusManager, settings, defaultFocusButtonType, params) {
        // Focus the first button of the specified `defaultFocusButtonType` if
        // the QSS is opened using the global shortcut.
        if (params.shortcut) {
            fluid.each(settings, function (setting, settingIndex) {
                if (setting.schema.type === defaultFocusButtonType) {
                    qssList.events.onButtonFocusRequired.fire(settingIndex);
                    return true;
                }
            });
        } else if (params.setting) {
            // Focus a button corresponding to a given setting or the previous or
            // following button depending on the activation parameters.
            var settingIndex = gpii.qss.getSettingIndex(settings, params.setting),
                silentFocus = false;

            if (params.key === "ArrowLeft") {
                settingIndex = gpii.psp.modulo(settingIndex - 1, settings.length);
            } else if (params.key === "ArrowRight") {
                settingIndex = gpii.psp.modulo(settingIndex + 1, settings.length);
            } else {
                /**
                 * The main process should not be notified about the focusing of the button if
                 * that was a result of closing the QSS widget via ESC or via its close button.
                 */
                silentFocus = true;
            }

            qssList.events.onButtonFocusRequired.fire(settingIndex, !!params.key, silentFocus);
        } else {
            focusManager.removeHighlight(true);
        }
    };
})(fluid);
