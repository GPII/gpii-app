"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.psp");
    fluid.registerNamespace("gpii.captureTool");

    var remoteFluid = require("electron").remote.getGlobal("fluid");

    // TODO Ultimately these should be relocated to a JSON5 file, probably in
    // universal so they can be used by any application or reporting utility
    // that needs to present the results to a human. This would all be a part
    // of the "Presentation Registry" to be used across tools.
    gpii.captureTool.appOrdering = [
        "com.microsoft.windows.language",
        "com.microsoft.windows.screenDPI",
        "com.microsoft.windows.highContrast",
        "com.microsoft.windows.brightness",
        "com.microsoft.windows.nightScreen",
        "com.microsoft.windows.cursors",
        "com.microsoft.windows.mouseSettings",
        "com.microsoft.windows.mouseTrailing",
        "com.microsoft.windows.touchPadSettings",
        "com.microsoft.windows.mouseKeys",
        "com.microsoft.windows.filterKeys",
        "com.microsoft.windows.stickyKeys",
        "com.microsoft.windows.typingEnhancement",
        "com.microsoft.windows.onscreenKeyboard",
        "com.microsoft.windows.desktopBackground",
        "com.microsoft.windows.desktopBackgroundColor",
        "com.microsoft.windows.magnifier",
        "com.microsoft.windows.narrator",
        "com.texthelp.readWriteGold",
        "com.office.windowsWordHome365LearningTools",
        "com.office.windowsWordPro365LearningTools",
        "com.office.windowsOneNoteLearningTools",
        "com.freedomscientific.magic",
        "org.nvda-project",
        "com.freedomscientific.jaws",
        "eu.singularlogic.pixelsense.sociable",
        "net.gpii.uioPlus",
        "com.microsoft.windows.screenResolution",
        "net.opendirective.maavis",
        "com.microsoft.windows.volumeControl",
        "net.gpii.test.speechControl",
        "net.gpii.explode"
    ];

    fluid.defaults("gpii.captureTool", {
        gradeNames: ["gpii.handlebars.templateAware.standalone", "gpii.binder.bindMarkupEvents"],
        templates: {
            initial: "capturePage"
        },
        messages: {
            "hello-message-key": "Hello, %mood world."
        },
        model: {
            // General Purpose Model Values
            templates: {
                pages: {
                    capturePage: "<p>placeholder</p>",
                    "1_ready_to_capture": "@expand:gpii.captureTool.loadTemplate(1_ready_to_capture)",
                    "2_what_to_capture": "@expand:gpii.captureTool.loadTemplate(2_what_to_capture)",
                    "2_which_applications": "@expand:gpii.captureTool.loadTemplate(2_which_applications)",
                    "3_capturing_settings": "@expand:gpii.captureTool.loadTemplate(3_capturing_settings)",
                    "3_what_to_keep": "@expand:gpii.captureTool.loadTemplate(3_what_to_keep)",
                    "4_save_choose_prefsset": "@expand:gpii.captureTool.loadTemplate(4_save_choose_prefsset)",
                    "4_confirm_update_prefsset": "@expand:gpii.captureTool.loadTemplate(4_confirm_update_prefsset)",
                    "4_save_name": "@expand:gpii.captureTool.loadTemplate(4_save_name)",
                    "5_confirmation": "@expand:gpii.captureTool.loadTemplate(5_confirmation)"
                },
                partials: {
                    footer_location_partial: "@expand:gpii.captureTool.loadTemplate(footer_location_partial)",
                    page_header_partial: "@expand:gpii.captureTool.loadTemplate(page_header_partial)"
                }
            },

            // These are model relays to the core gpii-app detailing if there is
            // currently a user keyed in, and if they are, what their key in token is.
            isKeyedIn: null,
            keyedInUserToken: null,

            // Page Flow
            //
            // These model entries are used for keeping track of the current
            // page and step in the workflow.
            currentPage: "1_ready_to_capture",

            // Page 2: Select which Solutions to Capture
            //
            // This page has been temporarily removed from the UI, but the model
            // entries below are also used in diagnostics and debugging.
            installedSolutions: null, // Populated during initialiation, using the local device reporter
            // Populated based off the installed Solutions, will have the settings schemas keyed by:
            // appId -> settingId -> schema
            installedSolutionsSchemas: null,
            // Possible values for this are:
            // "everything", "running", "chooseapps"
            whatToCapture: "everything",
            runningSolutions: {},
            solutionsToCapture: [],

            // Interstitial Capturing Page, with animated Morphic logo!
            // These 2 model values keep track of how long the capture has been running
            captureAnimationLoopTimer: 1,
            captureDone: false,

            // Page 3: Choosing which settings to keep

            settingsToKeep: [],
            capturedSettings: {
                "checkbook": {
                    title: "Checkbook Balancer"
                }
            },
            // The capturedSettingsToRender are generated from the capturedSettings and
            // add all the metadata needed by the handlebars template to render them for the
            // user
            capturedSettingsToRender: [],
            // The capturedPreferences will be generated from the capturedSettings. These will
            // be the preferences ready to be attached to a prefset/context to be sent up.
            capturedPreferences: null,
            preferencesToKeep: null,

            showDefaultSettings: [],

            // This is a property meant for display in the UI that will take in to
            // account if we are using `showDefaultSettings`.  It is based off of `capturedSettingsToRender`
            // which also respects `showDefaultSettings`.  This should be calculated by tallying the
            // `numberOfRenderSettings` property for each entry in `capturedSettingsToRender`.
            currentNumberOfTotalSettingsToRender: 0,

            // Page 4: Where to save the settings

            // For the select dropdown which prefset page:
            prefsSetSaveType: "existing", // Should be `existing` or `save-new`
            selectedPrefsSet: "gpii-default",
            selectedPrefsSetName: "GPII Default",

            // Prefs Set Name to Save the captured settings to. This is either
            // what is typed in the input for saving to a new set, or the `selectedPrefsSetName`
            // if an existing set is chosen.
            prefsSetName: "MyCapture"

        },
        modelListeners: {
            "solutionsToCapture": [{
                func: "{that}.updateNumAppsSelected"
            }],
            "isKeyedIn": [
                {
                    funcName: "gpii.captureTool.watchKeyInOut",
                    args: ["{that}", "{that}.model.currentPage", "{change}.value"]
                }
            ],
            "capturedSettings": [
                {
                    func: "{that}.updateCapturedPreferences"
                },
                {
                    func: "{that}.updateCapturedSettingsToRender",
                    args: ["{that}.model.showDefaultSettings"]
                }
            ],
            "showDefaultSettings": [
                {
                    namespace: "clearAllSettingsToKeepButton",
                    func: "{that}.clearAllSettingsToKeepButton"
                },
                {
                    namespace: "updateCapturedSettingsToRender",
                    func: "{that}.updateCapturedSettingsToRender",
                    args: ["{change}.value"],
                    priority: "after:clearAllSettingsToKeepButton"
                },
                {
                    namespace: "render",
                    func: "{that}.render",
                    args: ["{that}.model.currentPage"],
                    priority: "after:updateCapturedSettingsToRender"
                }
            ],
            "capturedSettingsToRender": [
                {
                    func: "{that}.updateNumSettingsSelected"
                },
                {
                    func: "gpii.captureTool.updateCurrentNumberOfTotalSettingsToRender",
                    args: ["{that}.applier.change", "{that}.model.capturedSettingsToRender"]
                }
            ],
            "settingsToKeep": [
                {
                    func: "{that}.updatePreferencesToKeep"
                },
                {
                    func: "{that}.updateSolutionSettingsTree"
                },
                {
                    func: "{that}.updateNumSettingsSelected"
                }
            ],
            "installedSolutions": {
                func: "{that}.updateInstalledSolutionsSchemas"
            }
        },
        bindings: {
            whatToCaptureRadio: "whatToCapture",
            prefsSetNameInput: "prefsSetName",
            solutionsToCaptureCheckbox: "solutionsToCapture",
            settingsToKeepCheckbox: "settingsToKeep",
            toggleShowDefaultSettingsCheckbox: "showDefaultSettings"
        },
        selectors: {
            initial: "#flc-captureWidgetInitial",
            nextButton: ".flc-capture-next",
            backButton: ".flc-capture-back",
            doneButton: ".flc-capture-done",
            whatToCaptureRadio: "[name='fl-capture-whattocapture']",
            prefsSetNameInput: "[name='fl-capture-prefsetname']",
            solutionsToCaptureCheckbox: "[name='fc-choose-app']",
            // This is the group header for each solutions set of settings
            solutionsSettingsToKeepCheckbox: "[name='fc-solutions-to-keep']",
            settingsToKeepCheckbox: "[name='fc-settings-to-keep']",
            toggleShowDefaultSettingsCheckbox: "[name='flc-toggle-show-default-settings']",
            // These 2 select/clear all selectors are used on the "Which applications to Capture",
            // and "Which settings to keep" pages
            selectAllSolutionsButton: ".flc-select-all",
            clearAllSolutionsButton: ".flc-clear-all",
            selectAllSettingsToKeepButton: ".flc-select-all-settings",
            clearAllSettingsToKeepButton: ".flc-clear-all-settings",
            numAppsSelectedDisplay: ".flc-num-apps-selected",
            numSettingsSelectedDisplay: ".flc-num-settings-selected",
            hideShowSolutionButton: ".flc-hideshow-solution",
            hideShowNumSettingLink: ".flc-hideshow-numsetting-link",
            captureAnimationLoopEllipsis: ".flc-capture-animation-loop-ellipsis",
            captureAnimationLoopTimer: ".flc-capture-animation-loop-timer",
            selectPrefssetDropdown: ".flc-select-prefset-dropdown",
            currentlySelectedPrefset: ".flc-current-selected-prefset"
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
            },
            solutionsSettingsToKeepCheckbox: {
                method: "click",
                args: "{that}.onSolutionHeaderToKeepCheck"
            },
            hideShowSolutionButton: {
                method: "click",
                args: "{that}.onHideShowSolution"
            },
            hideShowNumSettingLink: {
                method: "click",
                args: "{that}.onHideShowNumSettingLink"
            },
            selectPrefssetDropdown: {
                method: "click",
                args: "{that}.onSelectPrefssetDropdown"
            }
        },
        listeners: {
            "onCreate.renderSignIn": {
                func: "{that}.render",
                args: ["1_ready_to_capture"],
                priority: "last"
            },
            "onCreate.channelGetInstalledSolutions": {
                func: "{that}.channelNotifier.events.getInstalledSolutions.fire"
            },
            "onCreate.channelModelUpdate": {
                func: "{that}.channelNotifier.events.modelUpdate.fire"
            }
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
                args: ["{that}", "{arguments}.0"]
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
                args: ["{that}", "{that}.model.settingsToKeep"]
            },
            updateSolutionSettingsTree: {
                funcName: "gpii.captureTool.updateSolutionSettingsTree",
                args: ["{that}"]
            },
            updateInstalledSolutionsSchemas: {
                funcName: "gpii.captureTool.updateInstalledSolutionsSchemas",
                args: ["{that}"]
            },
            onSolutionHeaderToKeepCheck: {
                funcName: "gpii.captureTool.onSolutionHeaderToKeepCheck",
                args: ["{that}", "{arguments}.0.currentTarget"] // event.currentTarget
            },
            onHideShowSolution: {
                funcName: "gpii.captureTool.onHideShowSolution",
                args: ["{that}", "{arguments}.0.currentTarget"] // event.currentTarget
            },
            onHideShowNumSettingLink: {
                funcName: "gpii.captureTool.onHideShowNumSettingLink",
                args: ["{arguments}.0.currentTarget"] // event.currentTarget
            },
            onSelectPrefssetDropdown: {
                funcName: "gpii.captureTool.onSelectPrefssetDropdown",
                args: ["{that}", "{arguments}.0.currentTarget"] // event.currentTarget
            }
        },
        components: {
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        sendingInstalledSolutions: null,
                        sendingRunningSolutions: null,
                        sendingAllSolutionsCapture: null,
                        modelUpdate: null
                    },
                    listeners: {
                        sendingInstalledSolutions: {
                            funcName: "gpii.captureTool.channelSendingInstalledSolutions",
                            args: ["{gpii.captureTool}", "{arguments}.0"]
                        },
                        sendingRunningSolutions: {
                            funcName: "gpii.captureTool.channelSendingRunningSolutions",
                            args: ["{gpii.captureTool}", "{arguments}.0"]
                        },
                        sendingAllSolutionsCapture: {
                            funcName: "gpii.captureTool.channelSendingAllSolutionsCapture",
                            args: ["{gpii.captureTool}", "{arguments}.0"]
                        },
                        modelUpdate: {
                            funcName: "gpii.captureTool.channelModelUpdate",
                            args: ["{gpii.captureTool}", "{arguments}.0"]
                        }
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        getInstalledSolutions: null,
                        getAllSolutionsCapture: null,
                        modelUpdate: null,
                        captureDoneButton: null,
                        saveCapturedPreferences: null
                    }
                }
            }
        }
    });

    gpii.captureTool.fullChange = function (applier, path, value) {
        var transaction = applier.initiate();
        transaction.fireChangeRequest({ path: path, value: {}, type: "DELETE"});
        transaction.fireChangeRequest({ path: path, value: value});
        transaction.commit();
    };

    /*
     * Annotates the merged capture with data for rendering the list including
     * solution names and the number of settings captured for each solutions.
     *
     * Edits the mergedCapture in place, and also re-returns it.
     */
    gpii.captureTool.annotateSettingsCapture = function (that, mergedCapture) {
        var togo = {};
        fluid.each(mergedCapture, function (capturedSolution, solutionID) {
            if (!that.model.installedSolutions[solutionID]) {
                fluid.log("The solutionID is missing for this installedSolution: ", solutionID);
                return;
            }

            togo[solutionID] = {
                settings: capturedSolution,
                name: that.model.installedSolutions[solutionID].name,
                numberOfSettings: Object.keys(capturedSolution).length
            };
        });
        return togo;
    };

    /*
     * Takes an object of values keyed by solution ids, converts them in to a list
     * adding the ID as a value with key `id`, and then sorts them based on our
     * preferred list of solutions orders for display.
     *
     * @param {Object} data - An object with keyed entries, were each key is the id
     * of a solutions registry entry.
     */
    gpii.captureTool.createArrayFromSolutionsHash = function (data) {
        var orderedInstalledSolutions = [];
        fluid.each(data, function (val, key) {
            var next = fluid.copy(val);
            next.id = key;
            orderedInstalledSolutions.push(next);
        });
        fluid.stableSort(orderedInstalledSolutions, function (a, b) {
            var idx = gpii.captureTool.appOrdering;
            function idxOrEnd(i) {
                var locI = idx.indexOf(i);
                return locI === -1 ? idx.length : locI;
            }

            var idxA = idxOrEnd(a.id);
            var idxB = idxOrEnd(b.id);
            return idxA - idxB;
        });
        return orderedInstalledSolutions;
    };

    /*
     * Given the `preferences` from a preferences safe, determine which preferences
     * set is the default. For nearly all cases this will be the preference set keyed
     * with id `gpii-default`, but in the event there is no entry with the key, we
     * will choose the first one from the objects keys.
     *
     * If for some reason there are no preference sets at all, we will create a new
     * default entry.
     */
    gpii.captureTool.determineDefaultPrefsSet = function (preferences) {
        if (!preferences || !preferences.contexts) {
            return {
                prefSetId: "",
                name: ""
            };
        }

        if (preferences.contexts["gpii-default"]) {
            return {
                prefsSetId: "gpii-default",
                name: preferences.contexts["gpii-default"].name
            };
        }
        else if (preferences.contexts.length > 0) {
            var firstEntry = Object.keys(preferences.contexts)[0];
            return {
                prefsSetId: firstEntry,
                name: preferences.contexts[firstEntry].name
            };
        }
        else {
            return {
                prefsSetId: "gpii-default",
                name: "Default Preferences"
            };
        }
    };

    gpii.captureTool.channelSendingInstalledSolutions = function (that, data) {
        that.fullChange("installedSolutions", data);
        var orderedInstalledSolutions = gpii.captureTool.createArrayFromSolutionsHash(data);
        that.fullChange("orderedInstalledSolutions", orderedInstalledSolutions);
    };

    gpii.captureTool.channelSendingRunningSolutions = function (that, data) {
        that.fullChange("runningSolutions", data);
    };

    gpii.captureTool.channelSendingAllSolutionsCapture = function (that, data) {
        var finalSettings = gpii.captureTool.annotateSettingsCapture(that, data);

        // Remove any solutions with zero settings per UX Review
        fluid.remove_if(finalSettings, function (item, key) {
            if (!item.numberOfSettings || item.numberOfSettings === 0) {
                fluid.log("Removing solution with zero settings: ", key);
                return true;
            }
        });

        that.fullChange("capturedSettings", finalSettings);
        that.fullChange("currentPage", "3_what_to_keep");
        that.applier.change("captureDone", true);
    };

    gpii.captureTool.channelModelUpdate = function (that, data) {
        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "isKeyedIn", value: data.isKeyedIn});
        transaction.fireChangeRequest({ path: "keyedInUserToken", value: data.keyedInUserToken});
        transaction.fireChangeRequest({ path: "preferences", value: data.preferences});
        // TODO: This update should potentially be a model listener on preferences
        transaction.fireChangeRequest({ path: "defaultPrefsSet",
            value: gpii.captureTool.determineDefaultPrefsSet(data.preferences)});
        transaction.commit();
    };

    gpii.captureTool.loadTemplate = function (templateName) {
        var resolvedPath = require("path").join(__dirname, "html", templateName + ".handlebars");
        var finalTemplate = require("electron").remote.require("fs").readFileSync(resolvedPath) + "";    //require(resolvedPath);
        return finalTemplate;
    };

    gpii.captureTool.startCapture = function (that) {
        that.applier.change("currentPage", "3_capturing_settings");
        that.render("3_capturing_settings");

        var captureAnimationLoop = function () {
            var curCount = that.model.captureAnimationLoopTimer + 1;
            fluid.each(that.dom.locate("captureAnimationLoopTimer"), function (el) {
                el.innerText = curCount;
            });
            fluid.each(that.dom.locate("captureAnimationLoopEllipsis"), function (el) {
                if (curCount % 3 === 0) {
                    el.innerText = ". . .";
                }
                else if ((curCount + 1) % 3 === 0) {
                    el.innerText = ". .";
                }
                else {
                    el.innerText = ".";
                }
            });
            that.applier.change("captureAnimationLoopTimer", curCount);

            if (that.model.captureDone && curCount > 5) {
                that.selectAllSettingsToKeepButton();
                that.render("3_what_to_keep");
                // This needs to happen again, because the page hasn't rendered yet,
                // and therefore the html element doens't exist yet.
                that.updateNumSettingsSelected();
                that.updateSolutionSettingsTree();
                that.applier.change("captureDone", false);
                that.applier.change("captureAnimationLoopTimer", 1);
            }
            else {
                setTimeout(captureAnimationLoop, 1000);
            }


        };
        setTimeout(captureAnimationLoop, 1000);

        var options = {};
        if (that.model.whatToCapture === "running") {
            options.solutionsList = Object.keys(that.model.runningSolutions);
        }
        else if (that.model.whatToCapture === "chooseapps") {
            options.solutionsList = that.model.solutionsToCapture;
        }

        // Clear any previous capture
        that.applier.change("capturedSettings", {}, "DELETE");

        that.channelNotifier.events.getAllSolutionsCapture.fire(options);
    };

    gpii.captureTool.nextButton = function (that, currentPage) {
        if (currentPage === "1_sign_in") { // Currently not used with UX redesign
            that.applier.change("currentPage", "2_what_to_capture");
            that.channel.notifier.events.getInstalledSolutions.fire();
            that.render("2_what_to_capture");
        }
        // This is the version of the start page without username/password login
        else if (currentPage === "1_ready_to_capture") {
            that.startCapture();
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
            that.applier.change("currentPage", "4_save_choose_prefsset");
            that.render("4_save_choose_prefsset");
        }
        else if (currentPage === "4_save_choose_prefsset") {
            if (that.model.prefsSetSaveType === "existing") {
                that.applier.change("currentPage", "4_confirm_update_prefsset");
                that.render("4_confirm_update_prefsset");
            }
            else { // === "save-new"
                that.applier.change("currentPage", "4_save_name");
                that.render("4_save_name");
            }
        }
        else if (currentPage === "4_confirm_update_prefsset") {
            that.applier.change("currentPage", "5_confirmation");
            if (that.model.prefsSetSaveType === "existing") {
                that.applier.change("prefsSetId", that.model.selectedPrefsSet);
                that.applier.change("prefsSetName", that.model.selectedPrefsSetName);
            }
            that.render("5_confirmation");
            that.saveCapturedPreferences();
        }
        else if (currentPage === "4_save_name") {
            that.applier.change("currentPage", "5_confirmation");
            that.render("5_confirmation");
            that.saveCapturedPreferences();
        }
        else {
            fluid.log("Unable to determine nextButton page in the Capture Tool workflow...");
        }
    };

    gpii.captureTool.backButton = function (that, currentPage) {
        if (currentPage === "2_which_applications") {
            that.applier.change("currentPage", "2_what_to_capture");
            that.render("2_what_to_capture");
        }
        else if (currentPage === "3_what_to_keep") {
            that.applier.change("currentPage", "1_ready_to_capture");
            that.render("1_ready_to_capture");
        }
        else if (currentPage === "4_save_choose_prefsset") {
            that.applier.change("currentPage", "3_what_to_keep");
            that.render("3_what_to_keep");
            that.clearAllSettingsToKeepButton();
        }
        else if (currentPage === "4_save_name") {
            that.applier.change("currentPage", "4_save_choose_prefsset");
            that.render("4_save_choose_prefsset");
        }
        else if (currentPage === "4_confirm_update_prefsset") {
            that.applier.change("currentPage", "4_save_choose_prefsset");
            that.render("4_save_choose_prefsset");
        }
        else {
            fluid.log("Unable to determine backButton page in the Capture Tool workflow...");
        }
    };

    gpii.captureTool.doneButton = function (that) {
        that.channelNotifier.events.captureDoneButton.fire();
    };

    gpii.captureTool.selectAllSolutionsButton = function (that) {
        that.fullChange("solutionsToCapture", Object.keys(that.model.installedSolutions));
    };

    gpii.captureTool.clearAllSolutionsButton = function (that) {
        that.applier.change("solutionsToCapture", []);
    };

    gpii.captureTool.selectAllSettingsToKeepButton = function (that) {
        var settings = [];
        fluid.each(that.model.capturedSettingsToRender, function (app) {
            fluid.each(app.renderSettings, function (setting, settingId) {
                settings.push(app.id + ":" + settingId);
            });
        });
        that.applier.change("settingsToKeep", settings);
    };

    gpii.captureTool.clearAllSettingsToKeepButton = function (that) {
        that.applier.change("settingsToKeep", []);
    };

    gpii.captureTool.saveCapturedPreferences = function (that) {
        var prefSetPayload = {
            name: that.model.prefsSetName,
            preferences: that.model.preferencesToKeep
        };
        that.channelNotifier.events.saveCapturedPreferences.fire({
            prefSetId: that.model.prefsSetId, //needs to be simplified... nospaces etc.
            prefSetPayload: prefSetPayload
        });
    };

    gpii.captureTool.updateCapturedPreferences = function (that) {
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

    /*
     * On the settings to keep page, this will be invoked each time an individual
     * setting is changed, in order to update the heirarchical checkboxs for each
     * solution, which can be in indeterminate form if only some of the solutions are
     * checked.
     */
    gpii.captureTool.updateSolutionSettingsTree = function (that) {
        fluid.each(that.model.capturedSettingsToRender, function (solution) {
            var numSelected = 0;
            fluid.each(Object.keys(solution.renderSettings), function (settingId) {
                var solSetting = solution.id + ":" + settingId;
                if (fluid.contains(that.model.settingsToKeep, solSetting)) {
                    numSelected += 1;
                }
            });

            // sgithens TODO how to use selectors for this
            var checkboxEl = $("#fc-solution-" + solution.id.replace(/\./g, "\\."))[0];
            // In case this is called before the page is finished rendering
            if (!checkboxEl) {
                return;
            }
            if (numSelected === 0) {
                checkboxEl.indeterminate = false;
                checkboxEl.checked = false;
            }
            else if (solution.numberOfRenderSettings === numSelected) {
                checkboxEl.indeterminate = false;
                checkboxEl.checked = true;
            }
            else {
                checkboxEl.indeterminate = true;
                checkboxEl.checked = false;
            }
        });
    };

    gpii.captureTool.onSolutionHeaderToKeepCheck = function (that, currentTarget) {
        var solutionId = currentTarget.value;
        var checkVal = currentTarget.checked;

        var curSettings = fluid.copy(that.model.settingsToKeep);
        var solutionData = fluid.find(that.model.capturedSettingsToRender, function (item) {
            if (item.id === solutionId) {
                return item;
            }
        });
        if (checkVal) {
            fluid.each(solutionData.settings, function (item, idx) {
                if (!fluid.contains(curSettings, solutionId + ":" + idx)) {
                    curSettings.push(solutionId + ":" + idx);
                }
            });
        }
        else {
            fluid.each(solutionData.settings, function (item, idx) {
                fluid.remove_if(curSettings, function (curSetting) {
                    return curSetting === solutionId + ":" + idx;
                });
            });
        }
        that.applier.change("settingsToKeep", curSettings);
    };

    gpii.captureTool.onHideShowNumSettingLink = function (currentTarget) {
        var solutionId = currentTarget.dataset.solution;
        var button = $(".flc-hideshow-solution[data-solution='" + solutionId + "']");
        button.click();
    };

    gpii.captureTool.onHideShowSolution = function (that, currentTarget) {
        var solutionId = currentTarget.dataset.solution;
        var hideShow = currentTarget.dataset.show;
        if (hideShow === true || hideShow === "true") {
            $("#flc-settings-for-" + solutionId.replace(/\./g, "\\.")).toggle(hideShow);
            currentTarget.dataset.show = false;
            currentTarget.value = "Show Settings";
        }
        else {
            $("#flc-settings-for-" + solutionId.replace(/\./g, "\\.")).toggle(hideShow);
            currentTarget.dataset.show = true;
            currentTarget.value = "Hide Settings";
        }

    };

    gpii.captureTool.onSelectPrefssetDropdown = function (that, currentTarget) {
        var curSelected = that.locate("currentlySelectedPrefset");
        curSelected[0].innerHTML = currentTarget.innerHTML;
        var curTarget = $(currentTarget);
        that.applier.change("prefsSetSaveType", curTarget.data("type"));
        that.applier.change("selectedPrefsSet", curTarget.data("prefsset-id"));
        that.applier.change("selectedPrefsSetName", curTarget.data("prefsset-name"));
    };

    gpii.captureTool.calculateCurrentNumberOfTotalSettingsToRender = function (capturedSettingsToRender) {
        var tally = 0;
        fluid.each(capturedSettingsToRender, function (item) {
            tally += item.numberOfRenderSettings;
        });
        return tally;
    };

    gpii.captureTool.updateCurrentNumberOfTotalSettingsToRender = function (applierFunc, capturedSettingsToRender) {
        var tally = gpii.captureTool.calculateCurrentNumberOfTotalSettingsToRender(capturedSettingsToRender);
        applierFunc("currentNumberOfTotalSettingsToRender", tally);
    };

    gpii.captureTool.updateCapturedSettingsToRender = function (that, showDefaultSettings) {
        var togo = {};
        fluid.each(that.model.capturedSettings, function (appData, appId) {
            if (appData.numberOfSettings >= 0) { // sgithens DEMO_TOGGLE
                togo[appId] = fluid.copy(appData);
                togo[appId].renderSettings = {};
                fluid.each(togo[appId].settings, function (settingVal, settingKey) {
                    var curRenderSetting = {};
                    curRenderSetting.settingId = settingKey;
                    var renderVal = fluid.copy(settingVal);
                    if (that.model.installedSolutionsSchemas[appId][settingKey] &&
                        that.model.installedSolutionsSchemas[appId][settingKey].title) {
                        var curSchema = that.model.installedSolutionsSchemas[appId][settingKey];

                        // TODO anything with a `path` attribute is probably an SPI setting, so we should likely
                        // remove it.
                        // If the setting value is an object and has only 1 key with name `value`, use that to
                        // replace the value.
                        // If the setting value is an object and has 2 keys, `value` and `path`, also set
                        // `value` to be the value.
                        if (fluid.isPlainObject(settingVal) && fluid.keys(settingVal).length === 1 &&
                            settingVal.value !== undefined) {
                            renderVal = renderVal.value;
                        }
                        else if (fluid.isPlainObject(settingVal) && fluid.keys(settingVal).length === 2 &&
                            settingVal.value !== undefined && settingVal.path !== undefined) {
                            renderVal = renderVal.value;
                        }
                        else {
                            fluid.log("Nothing to process for SPI or windows settings cleanup.");
                        }

                        curRenderSetting.settingLabel = curSchema.title;
                        curRenderSetting.settingDesc = curSchema.description;
                        // curRenderSetting.debugInfo = "Val: " + JSON.stringify(renderVal) + " Default: " + curSchema["default"];
                        curRenderSetting.debugInfo = "Default: " + curSchema["default"];

                        // Remove default values if checkbox is not enabled
                        if (showDefaultSettings.length === 0) {
                            var defaultVal = remoteFluid.invokeGlobalFunction("gpii.universal.solutionsRegistry.findDefaultValue", [curSchema]);
                            if (defaultVal.hasDefault && defaultVal["default"] === settingVal) {
                                // Remove this setting by going on to the next item before we
                                // add it to the list.
                                return;
                            }
                        };

                        if (curSchema.enumLabels && curSchema["enum"] && curSchema["enum"].indexOf(renderVal) >= 0) {
                            var enumIdx = curSchema["enum"].indexOf(renderVal);
                            curRenderSetting.settingVal = curSchema.enumLabels[enumIdx];
                        }
                        else if (fluid.isPrimitive(renderVal)) {
                            curRenderSetting.settingVal = renderVal;
                        }
                        else if (fluid.isPlainObject(renderVal)) {
                            curRenderSetting.settingVal = JSON.stringify(renderVal);
                        }
                        else {
                            curRenderSetting.settingVal = renderVal;
                        }
                    }
                    else {
                        curRenderSetting.settingLabel = settingKey;
                        curRenderSetting.settingVal = renderVal;
                    }
                    togo[appId].renderSettings[settingKey] = curRenderSetting;
                });
                // This takes into account whether or not we removed the default settings
                togo[appId].numberOfRenderSettings = Object.keys(togo[appId].renderSettings).length;
                if (togo[appId].numberOfRenderSettings === 0) {
                    delete togo[appId];
                }
            }
        });
        var orderedCapturedSettingsToRender = gpii.captureTool.createArrayFromSolutionsHash(togo);
        that.fullChange("capturedSettingsToRender", orderedCapturedSettingsToRender);
    };

    gpii.captureTool.updateNumAppsSelected = function (that) {
        var el = that.locate("numAppsSelectedDisplay");
        if (el && el.html) {
            el.html(that.model.solutionsToCapture.length);
        }
    };

    gpii.captureTool.updateNumSettingsSelected = function (that, settingsToKeep) {
        var el = that.locate("numSettingsSelectedDisplay");
        if (el && el.html) {
            el.html(settingsToKeep.length);
        }
    };

    gpii.captureTool.updateInstalledSolutionsSchemas = function (that) {
        var togo = {};
        fluid.each(that.model.installedSolutions, function (solution, appId) {
            fluid.each(solution.settingsHandlers, function (config) {
                fluid.each(config.supportedSettings, function (settingSchema, settingId) {
                    if (!togo[appId]) {
                        togo[appId] = {};
                    }
                    togo[appId][settingId] = settingSchema.schema;
                });
            });
        });
        that.fullChange("installedSolutionsSchemas", togo);
    };

    /*
     * Watch Key In/Outs. If we are on any the pages (4, 4a, 4b) where
     * the user choosing a preference set to save to, and save, we will
     * need to update the screens if they key-out, or key-in as a different
     * user.
     *
     * I believe in almost every scenerio the correct thing to do would be
     * to go back to the first page 4, and clear/update the model properties:
     *  - prefsSetSaveType
     *  - selectedPrefsSet
     *  - selectedPrefsSetName
     *  - prefsSetName
     */
    gpii.captureTool.watchKeyInOut = function (that, currentPage /*, isKeyedIn */) {
        var transaction = that.applier.initiate();
        transaction.fireChangeRequest({ path: "prefsSetSaveType", value: "existing"});
        transaction.fireChangeRequest({ path: "selectedPrefsSet", value: "gpii-default"});
        transaction.fireChangeRequest({ path: "selectedPrefsSetName", value: "GPII Default"});
        transaction.fireChangeRequest({ path: "prefsSetName", value: "My Capture"});
        transaction.commit();

        if (currentPage === "4_save_choose_prefsset" ||
            currentPage === "4_confirm_update_prefsset" ||
            currentPage === "4_save_name")
        {
            that.applier.change("currentPage", "4_save_choose_prefsset");
            that.render("4_save_choose_prefsset");
        }
    };
})(fluid);
