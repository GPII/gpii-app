/**
 * QSS service buttons
 *
 * Contains components representing QSS buttons which can be used by the user to perform
 * tasks other than updating his settings (e.g. key in, reset, undo, etc).
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
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Key in"
     * QSS button.
     */
    fluid.defaults("gpii.qss.mySavedSettingsButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        attrs: {
            "aria-label": "My saved settings"
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Close"
     * QSS button.
     */
    fluid.defaults("gpii.qss.closeButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        attrs: {
            "aria-label": "Close" // screen reader text for the button
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.closeButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Close" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.closeButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.closeButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onQssClosed.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Save"
     * QSS button.
     */
    fluid.defaults("gpii.qss.saveButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        model: {
            messages: {
                notification: {
                    keyedOut: null,
                    keyedIn: null
                }
            }
        },
        styles: {
            dimmed: "fl-qss-dimmed"
        },
        modelListeners: {
            "{gpii.qss}.model.isKeyedIn": {
                this: "{that}.container",
                method: "toggleClass",
                args: [
                    "{that}.options.styles.dimmed",
                    "@expand:fluid.negate({change}.value)" // dim if not keyed in
                ]
            }
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.saveButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{gpii.qss}.model.isKeyedIn",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Save" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.saveButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Boolean} isKeyedIn - Whether there is an actual keyed in user. The
     * "noUser" is not considererd an actual user.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.saveButtonPresenter.activate = function (that, qssList, isKeyedIn, activationParams) {
        that.notifyButtonActivated(activationParams);

        var messages = that.model.messages.notification,
            notification = isKeyedIn ? messages.keyedIn : messages.keyedOut;
        qssList.events.onSaveRequired.fire(notification);
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "More..."
     * QSS button.
     */
    fluid.defaults("gpii.qss.moreButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.qss.moreButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "More..." QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.moreButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.moreButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onMorePanelRequired.fire();
        qssList.qssMorePanelRepeater.container.show();
    };


    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the
     * "Launch DocuMorph" QSS button. It uses the universal launchExecutable function
     * which tries to execute the file from the provided path
     */
    fluid.defaults("gpii.qss.launchDocuMorphPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.launchExecutable",
                args: ["{gpii.qss}.options.siteConfig.docuMorphExecutable"]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the
     * "Screen Snip" QSS button. It uses the openSnippingTool function
     * which tries to execute the file from the provided path
     */
    fluid.defaults("gpii.qss.snippingToolPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openSnippingTool",
                args: ["{gpii.qss}.options.siteConfig.snippingToolCommand"]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with snippingToolPresenterthe
     * custom buttons that need to open application, it requires only the (full) path
     * to the executable.
     */
    fluid.defaults("gpii.qss.customLaunchAppPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.qss.startProcessPresenter",
                args: [
                    "{that}.model.item.schema.filepath", // using the file's path from the custom button's schema
                    "{that}.model.item.schema.fullScreen", // using the fullScreen from the custom button's schema
                    "{channelNotifier}.events.onQssStartProcess"
                ]
            }
        }
    });

    /**
     * Custom function that handles starting new processes
     * @param {String} process - path to the executable
     * @param {Boolean} fullScreen - true/false to start the process in full screen or not
     * @param {Event} startProcessEvent - handle to the onQssStartProcess event
     */
    gpii.qss.startProcessPresenter = function (process, fullScreen, startProcessEvent) {
        startProcessEvent.fire(process, fullScreen);
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the
     * custom buttons that need to open url in the browser, it requires both the
     * url, and the boolean that determines if will try to force Chrome or not
     */
    fluid.defaults("gpii.qss.customOpenUrlPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openUrl",
                args: [
                    "{that}.model.item.schema.url", // using the url from the custom button's schema
                    "{gpii.qss}.options.siteConfig.alwaysUseChrome", // Override the OS default browser.
                    "{that}.model.item.schema.fullScreen" // using the fullScreen from the custom button's schema
                ]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the
     * custom buttons that need to execute key sequence or key combination, it requires
     * a key data and a handle to the onQssExecuteKeySequence event, documentation:
     * https://github.com/stegru/windows/blob/GPII-4135/gpii/node_modules/gpii-userInput/README.md
     */
    fluid.defaults("gpii.qss.customKeysPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.qss.executeKeySequence",
                args: [
                    "{that}.model.item.schema.keyData", // using the key data from the custom button's schema
                    "{channelNotifier}.events.onQssExecuteKeySequence"
                ]
            }
        }
    });

    /**
     * Custom function that handles executing the key sequence
     * @param  {String} keyData - string with key combinations
     * @param  {Event} executeKeyEvent - handle to the onQssExecuteKeySequence event
     */
    gpii.qss.executeKeySequence = function (keyData, executeKeyEvent) {
        executeKeyEvent.fire(keyData);
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Undo"
     * QSS button.
     */
    fluid.defaults("gpii.qss.undoButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter", "gpii.qss.changeIndicator"],
        applyKeyboardHighlight: true,
        listeners: {
            "{list}.events.onUndoIndicatorChanged": {
                func: "{that}.toggleIndicator",
                args: "{arguments}.0" // shouldShow
            }
        },

        invokers: {
            activate: {
                funcName: "gpii.qss.undoButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Undo" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.undoButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.undoButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onUndoRequired.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Reset All
     * to Standard" QSS button.
     */
    fluid.defaults("gpii.qss.resetAllButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.qss.resetAllButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Reset All to Standard" QSS button.
     * Reuses the generic `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.resetAllButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.resetAllButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onResetAllRequired.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Open Quick Folder"
     * QSS button. For all url based buttons we use different siteConfig variable for the data,
     * but the same function to open the browser.
     */
    fluid.defaults("gpii.qss.openCloudFolderPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openUrl",
                args: [
                    "{gpii.qss}.options.siteConfig.urls.cloudFolder",  // siteConfig's cloud folder url
                    "{gpii.qss}.options.siteConfig.alwaysUseChrome" // Override the OS default browser.
                ]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Customize Quickstrip"
     * QSS button. For all url based buttons we use different siteConfig variable for the data,
     * but the same function to open the browser.
     */
    fluid.defaults("gpii.qss.urlCustomizeQssPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openUrl",
                args: [
                    "{gpii.qss}.options.siteConfig.urls.customizeQss",  // siteConfig's url
                    "{gpii.qss}.options.siteConfig.alwaysUseChrome" // Override the OS default browser.
                ]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "My Google Drive"
     * QSS button. For all url based buttons we use different siteConfig variable for the data,
     * but the same function to open the browser.
     */
    fluid.defaults("gpii.qss.urlGoogleDrivePresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openUrl",
                args: [
                    "{gpii.qss}.options.siteConfig.urls.myGoogleDrive",  // siteConfig's url
                    "{gpii.qss}.options.siteConfig.alwaysUseChrome" // Override the OS default browser.
                ]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "My One Drive"
     * QSS button. For all url based buttons we use different siteConfig variable for the data,
     * but the same function to open the browser.
     */
    fluid.defaults("gpii.qss.urlOneDrivePresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openUrl",
                args: [
                    "{gpii.qss}.options.siteConfig.urls.myOneDrive",  // siteConfig's url
                    "{gpii.qss}.options.siteConfig.alwaysUseChrome" // Override the OS default browser.
                ]
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "My Dropbox"
     * QSS button. For all url based buttons we use different siteConfig variable for the data,
     * but the same function to open the browser.
     */
    fluid.defaults("gpii.qss.urlDropboxPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.windows.openUrl",
                args: [
                    "{gpii.qss}.options.siteConfig.urls.myDropbox",  // siteConfig's url
                    "{gpii.qss}.options.siteConfig.alwaysUseChrome" // Override the OS default browser.
                ]
            }
        }
    });
})(fluid);
