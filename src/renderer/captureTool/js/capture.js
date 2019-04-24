"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;
    fluid.registerNamespace("gpii.psp");
    fluid.registerNamespace("gpii.captureTool");

    fluid.defaults("gpii.captureTool", {
        gradeNames: ["gpii.handlebars.templateAware.standalone", "gpii.binder.bindMarkupEvents"],
        model: {
            installedSolutions: null, // Populated during initialiation, using the local device reporter
            currentPage: "1_sign_in",
            // Possible values for this are:
            // "everything", "running", "chooseapps"
            whatToCapture: "everything",
            runningSolutions: {},
            solutionsToCapture: [],
            settingsToKeep: [],
            // Prefs Set Name to Save the captured settings to
            prefsSetName: "MyCapture",
            templates: {
                pages: {
                    capturePage: "<p>This is a capture page 8!</p>",
                    "1_sign_in": "@expand:gpii.captureTool.loadTemplate(1_sign_in)",
                    "2_what_to_capture": "@expand:gpii.captureTool.loadTemplate(2_what_to_capture)",
                    "2_which_applications": "@expand:gpii.captureTool.loadTemplate(2_which_applications)",
                    "3_capturing_settings": "@expand:gpii.captureTool.loadTemplate(3_capturing_settings)",
                    "3_what_to_keep": "@expand:gpii.captureTool.loadTemplate(3_what_to_keep)",
                    "4_save_name": "@expand:gpii.captureTool.loadTemplate(4_save_name)",
                    "5_confirmation": "@expand:gpii.captureTool.loadTemplate(5_confirmation)"
                },
                partials: {
                    footer_location_partial: "@expand:gpii.captureTool.loadTemplate(footer_location_partial)",
                    page_header_partial: "@expand:gpii.captureTool.loadTemplate(page_header_partial)"
                }
            },
            capturedSettings: {
                "checkbook": {
                    title: "Checkbook Balancer"
                }
            },
            capturedSettingsToRender: {},
            // The capturedPreferences will be generated from the capturedSettings. These will
            // be the preferences ready to be attached to a prefset/context to be sent up.
            capturedPreferences: null,
            preferencesToKeep: null,

            // These should be model relays to the main app
            isKeyedIn: null,
            keyedInUserToken: null
        },
        bindings: {
            whatToCaptureRadio: "whatToCapture",
            prefsSetNameInput: "prefsSetName",
            solutionsToCaptureCheckbox: "solutionsToCapture",
            settingsToKeepCheckbox: "settingsToKeep"
        },
        templates: {
            initial: "capturePage"
        },
        messages: {
            "hello-message-key": "Hello, %mood world."
        },
        modelListeners: {
            "whatToCapture": [{
                funcName: "console.log",
                args: ["What To Capture: ", "{that}.model.whatToCapture"]
            }
            ],
            "solutionsToCapture": [{
                funcName: "console.log",
                args: ["Specific solutions to capture: ", "{that}.model.solutionsToCapture"]
            }, {
                func: "{that}.updateNumAppsSelected"
            }],
            "prefsSetName": {
                funcName: "console.log",
                args: ["PrefSet Name: ", "{that}.model.prefsSetName"]
            },
            "isKeyedIn": {
                funcName: "{that}.render",
                args: ["{that}.model.currentPage"]
            },
            "capturedSettings": [
                {
                    func: "{that}.updateCapturedPreferences"
                },
                {
                    func: "{that}.updateCapturedSettingsToRender"
                }
            ],
            "settingsToKeep": [{
                func: "{that}.updatePreferencesToKeep"
            }, {
                func: "{that}.updateNumSettingsSelected"
            }]
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.templates.initial", "{that}.model"]
            },
            render: {
                func: "{that}.renderMarkup",
                args: ["initial", "{arguments}.0", "{that}.model"]
            },
            nextButton: {
                funcName: "gpii.captureTool.nextButton",
                args: ["{that}", "{that}.model.currentPage"]
            },
            backButton: {
                funcName: "gpii.captureTool.backButton",
                args: ["{that}", "{that}.model.currentPage"]
            },
            doneButton: {
                funcName: "gpii.captureTool.doneButton",
                args: ["{that}"]
            },
            selectAllSolutionsButton: {
                funcName: "gpii.captureTool.selectAllSolutionsButton",
                args: ["{that}"]
            },
            clearAllSolutionsButton: {
                funcName: "gpii.captureTool.clearAllSolutionsButton",
                args: ["{that}"]
            },
            selectAllSettingsToKeepButton: {
                funcName: "gpii.captureTool.selectAllSettingsToKeepButton",
                args: ["{that}"]
            },
            clearAllSettingsToKeepButton: {
                funcName: "gpii.captureTool.clearAllSettingsToKeepButton",
                args: ["{that}"]
            },
            startCapture: {
                funcName: "gpii.captureTool.startCapture",
                args: ["{that}"]
            },
            saveCapturedPreferences: {
                funcName: "gpii.captureTool.saveCapturedPreferences",
                args: ["{that}"]
            },
            updateCapturedPreferences: {
                funcName: "gpii.captureTool.updateCapturedPreferences",
                args: ["{that}"]
            },
            updatePreferencesToKeep: {
                funcName: "gpii.captureTool.updatePreferencesToKeep",
                args: ["{that}"]
            },
            updateCapturedSettingsToRender: {
                funcName: "gpii.captureTool.updateCapturedSettingsToRender",
                args: ["{that}"]
            },
            fullChange: {
                funcName: "gpii.captureTool.fullChange",
                args: ["{that}.applier", "{arguments}.0", "{arguments}.1"]
            },
            updateNumAppsSelected: {
                funcName: "gpii.captureTool.updateNumAppsSelected",
                args: ["{that}"]
            },
            updateNumSettingsSelected: {
                funcName: "gpii.captureTool.updateNumSettingsSelected",
                args: ["{that}"]
            }
        },
        selectors: {
            initial: "#flc-captureWidgetInitial",
            nextButton: ".flc-capture-next",
            backButton: ".flc-capture-back",
            doneButton: ".flc-capture-done",
            whatToCaptureRadio: "[name='fl-capture-whattocapture']",
            prefsSetNameInput: "[name='fl-capture-prefsetname']",
            solutionsToCaptureCheckbox: "[name='fc-choose-app']",
            settingsToKeepCheckbox: "[name='fc-settings-to-keep']",
            // These 2 select/clear all selectors are used on the "Which applications to Capture",
            // and "Which settings to keep" pages
            selectAllSolutionsButton: ".flc-select-all",
            clearAllSolutionsButton: ".flc-clear-all",
            selectAllSettingsToKeepButton: ".flc-select-all-settings",
            clearAllSettingsToKeepButton: ".flc-clear-all-settings",
            numAppsSelectedDisplay: ".flc-num-apps-selected",
            numSettingsSelectedDisplay: ".flc-num-settings-selected"
        },
        markupEventBindings: {
            nextButton: {
                method: "click",
                args: "{that}.nextButton"
            },
            backButton: {
                method: "click",
                args: "{that}.backButton"
            },
            doneButton: {
                method: "click",
                args: "{that}.doneButton"
            },
            selectAllSolutionsButton: {
                method: "click",
                args: "{that}.selectAllSolutionsButton"
            },
            clearAllSolutionsButton: {
                method: "click",
                args: "{that}.clearAllSolutionsButton"
            },
            selectAllSettingsToKeepButton: {
                method: "click",
                args: "{that}.selectAllSettingsToKeepButton"
            },
            clearAllSettingsToKeepButton: {
                method: "click",
                args: "{that}.clearAllSettingsToKeepButton"
            }
        },
        listeners: {
            "onCreate.renderSignIn": {
                func: "{that}.render",
                args: ["1_sign_in"],
                priority: "last"
            },
            "onCreate.setupIPC": {
                func: "gpii.captureTool.setupIPC",
                args: ["{that}"]
            }
        }
    });

    gpii.captureTool.fullChange = function (applier, path, value) {
        var transaction = applier.initiate();
        transaction.fireChangeRequest({ path: path, value: {}, type: "DELETE"});
        transaction.fireChangeRequest({ path: path, value: value});
        transaction.commit();
    };

    gpii.captureTool.mergeSettingsCapture = function (rawCapture) {
        var capture = {};
        fluid.each(rawCapture, function (capturedItem) {
            fluid.each(capturedItem, function (settings, name) {
                fluid.each(settings, function (outerSettingBlock) {
                    fluid.each(outerSettingBlock, function (oofSettingBlock) {
                        if (Object.keys(oofSettingBlock).length === 0) {
                            console.log("THERE ARE ZERO SETTINGS HERE!!!");
                            capture[name] = { settings: {} };
                        }
                        fluid.each(oofSettingBlock, function (settingBlock, settingName) {
                            if (capture[name]) {
                                console.log("Existing: ", name, settingName, settingBlock);
                                capture[name].settings[settingName] = settingBlock;
                            }
                            else {
                                console.log("New: ", name, settingName, settingBlock);
                                capture[name] = { settings: {} };
                                capture[name].settings[settingName] = settingBlock;
                            }
                        });
                    });
                });
            });
        });

        return capture;
    };

    /*
     * Annotates the merged capture with data for rendering the list including
     * solution names and the number of settings captured for each solutions.
     *
     * Edits the mergedCapture in place, and also re-returns it.
     */
    gpii.captureTool.annotateSettingsCapture = function (that, mergedCapture) {
        var togo = mergedCapture;
        fluid.each(togo, function (capturedSolution, solutionID) {
            capturedSolution.name = that.model.installedSolutions[solutionID].name;
            capturedSolution.numberOfSettings = Object.keys(capturedSolution.settings).length;
        });
        return togo;
    };

    gpii.captureTool.setupIPC = function (that) {
        ipcRenderer.on("sendingInstalledSolutions", function (event, arg) {
            that.fullChange("installedSolutions", arg);
        });

        ipcRenderer.on("sendingRunningSolutions", function (event, arg) {
            that.fullChange("runningSolutions", arg);
        });

        ipcRenderer.on("sendingAllSolutionsCapture", function (event, arg) {
            var finalSettings = gpii.captureTool.annotateSettingsCapture(that, gpii.captureTool.mergeSettingsCapture(arg));
            that.fullChange("capturedSettings", finalSettings);
            that.fullChange("currentPage", "3_what_to_keep");
            that.selectAllSettingsToKeepButton();
            that.render("3_what_to_keep");
            // This needs to happen again, because the page hasn't rendered yet,
            // and therefore the html element doens't exist yet.
            that.updateNumSettingsSelected();
        });

        ipcRenderer.on("modelUpdate", function (event, arg) {
            var transaction = that.applier.initiate();
            transaction.fireChangeRequest({ path: "isKeyedIn", value: arg.isKeyedIn});
            transaction.fireChangeRequest({ path: "keyedInUserToken", value: arg.keyedInUserToken});
            transaction.commit();
        });

        // Get initial keyin state
        ipcRenderer.send("modelUpdate");
    };

    gpii.captureTool.loadTemplate = function (templateName) {
        var resolvedPath = require("path").join(__dirname, "html", templateName + ".handlebars");
        var finalTemplate = require("electron").remote.require("fs").readFileSync(resolvedPath) + "";    //require(resolvedPath);
        return finalTemplate;
    };

    gpii.captureTool.startCapture = function (that) {
        that.applier.change("currentPage", "3_capturing_settings");
        that.render("3_capturing_settings");
        var options = {};
        if (that.model.whatToCapture === "running") {
            options.solutionsList = Object.keys(that.model.runningSolutions);
        }
        else if (that.model.whatToCapture === "chooseapps") {
            options.solutionsList = that.model.solutionsToCapture;
        }

        // Clear any previous capture
        that.applier.change("capturedSettings", {}, "DELETE");

        ipcRenderer.send("getAllSolutionsCapture", options);
    };

    gpii.captureTool.nextButton = function (that, currentPage) {
        if (currentPage === "1_sign_in") {
            that.applier.change("currentPage", "2_what_to_capture");
            ipcRenderer.send("getInstalledSolutions", "Please please!");
            that.render("2_what_to_capture");
        }
        else if (currentPage === "2_what_to_capture") {
            if (that.model.whatToCapture === "chooseapps") {
                that.applier.change("currentPage", "2_which_applications");
                that.render("2_which_applications");
            }
            else {
                that.startCapture();
            }
        }
        else if (currentPage === "2_which_applications") {
            that.startCapture();
        }
        else if (currentPage === "3_what_to_keep") {
            that.applier.change("currentPage", "4_save_name");
            that.render("4_save_name");
        }
        else if (currentPage === "4_save_name") {
            that.applier.change("currentPage", "5_confirmation");
            that.render("5_confirmation");
            console.log("These should be saved:", that.model.capturedSettings);
            that.saveCapturedPreferences();
        }
        else {
            console.log("Not sure what the next page is...");
        }
    };

    gpii.captureTool.backButton = function (that, currentPage) {
        if (currentPage === "2_which_applications") {
            that.applier.change("currentPage", "2_what_to_capture");
            that.render("2_what_to_capture");
        }
        else if (currentPage === "3_what_to_keep") {
            that.applier.change("currentPage", "2_what_to_capture");
            that.render("2_what_to_capture");
        }
        else if (currentPage === "4_save_name") {
            that.applier.change("currentPage", "3_what_to_keep");
            that.render("3_what_to_keep");
        }
        else {
            console.log("Not sure what the next page is...");
        }
    };

    gpii.captureTool.doneButton = function (/* that */) {
        ipcRenderer.send("captureDoneButton", "Done button clicked!");
    };

    gpii.captureTool.selectAllSolutionsButton = function (that) {
        that.fullChange("solutionsToCapture", Object.keys(that.model.installedSolutions));
    };

    gpii.captureTool.clearAllSolutionsButton = function (that) {
        that.applier.change("solutionsToCapture", []);
    };

    gpii.captureTool.selectAllSettingsToKeepButton = function (that) {
        console.log("SGITHENS: Select all settings");
        var settings = [];
        fluid.each(that.model.capturedSettingsToRender, function (app, appId) {
            fluid.each(app.settings, function (setting, settingId) {
                settings.push(appId + ":" + settingId);
            });
        });
        that.applier.change("settingsToKeep", settings);
    };

    gpii.captureTool.clearAllSettingsToKeepButton = function (that) {
        console.log("SGITHENS: Clear all settings");
        that.applier.change("settingsToKeep", []);
    };

    gpii.captureTool.saveCapturedPreferences = function (that) {
        var prefSetPayload = {
            name: that.model.prefsSetName,
            preferences: that.model.preferencesToKeep
        };
        ipcRenderer.send("saveCapturedPreferences", {
            prefSetId: that.model.prefsSetName, //needs to be simplified... nospaces etc.
            prefSetPayload: prefSetPayload
        });
    };

    gpii.captureTool.updateCapturedPreferences = function (that) {
        console.log("SGITHENS updateCapturedPreferences");
        var prefs = {};
        fluid.each(that.model.capturedSettings, function (appData, appId) {
            if (appData.numberOfSettings > 0) {
                var appUri = "http://registry.gpii.net/applications/" + appId;
                prefs[appUri] = {};
                fluid.each(appData.settings, function (settingVal, settingId) {
                    prefs[appUri][settingId] = settingVal;
                });
            }
        });
        that.fullChange("capturedPreferences", prefs);
    };

    gpii.captureTool.updatePreferencesToKeep = function (that) {
        var togo = {};
        fluid.each(that.model.settingsToKeep, function (unparsedSetting) {
            var appSettingPair = unparsedSetting.split(":");
            var appId = appSettingPair[0];
            var appUri = "http://registry.gpii.net/applications/" + appId;
            var settingId = appSettingPair[1];
            var settingValue = that.model.capturedPreferences[appUri][settingId];
            if (!togo[appUri]) {
                togo[appUri] = {};
            }
            togo[appUri][settingId] = settingValue;
        });
        that.fullChange("preferencesToKeep", togo);
    };

    gpii.captureTool.updateCapturedSettingsToRender = function (that) {
        var togo = {};
        fluid.each(that.model.capturedSettings, function (appData, appId) {
            if (appData.numberOfSettings >= 0) { // sgithens DEMO_TOGGLE
                togo[appId] = appData;
            }
        });
        that.fullChange("capturedSettingsToRender", togo);
    };

    gpii.captureTool.updateNumAppsSelected = function (that) {
        var el = that.locate("numAppsSelectedDisplay");
        if (el && el.html) {
            el.html(that.model.solutionsToCapture.length);
        }
    };

    gpii.captureTool.updateNumSettingsSelected = function (that) {
        var el = that.locate("numSettingsSelectedDisplay");
        if (el && el.html) {
            el.html(that.model.settingsToKeep.length);
        }
    };
})(fluid);
