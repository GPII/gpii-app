"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;
    fluid.registerNamespace("gpii.psp");
    fluid.registerNamespace("gpii.captureTool");

    // TODO Ultimately these should be relocated to a JSON5 file, probably in
    // universal so they can be used by any application or reporting utility
    // that needs to present the results to a human.
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
        model: {
            installedSolutions: null, // Populated during initialiation, using the local device reporter
            // Populated based off the installed Solutions, will have the settings schemas keyed by:
            // appId -> settingId -> schema
            installedSolutionsSchemas: null,
            currentPage: "1_ready_to_capture",
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
                    "1_ready_to_capture": "@expand:gpii.captureTool.loadTemplate(1_ready_to_capture)",
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
            capturedSettingsToRender: [],
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
            }, {
                func: "{that}.updateSolutionSettingsTree"
            }],
            "installedSolutions": {
                func: "{that}.updateInstalledSolutionsSchemas"
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
                args: ["{that}", "{arguments}.0"]
            },
            onHideShowSolution: {
                funcName: "gpii.captureTool.onHideShowSolution",
                args: ["{that}", "{arguments}.0"]
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
            // This is the group header for each solutions set of settings
            solutionsSettingsToKeepCheckbox: "[name='fc-solutions-to-keep']",
            settingsToKeepCheckbox: "[name='fc-settings-to-keep']",
            // These 2 select/clear all selectors are used on the "Which applications to Capture",
            // and "Which settings to keep" pages
            selectAllSolutionsButton: ".flc-select-all",
            clearAllSolutionsButton: ".flc-clear-all",
            selectAllSettingsToKeepButton: ".flc-select-all-settings",
            clearAllSettingsToKeepButton: ".flc-clear-all-settings",
            numAppsSelectedDisplay: ".flc-num-apps-selected",
            numSettingsSelectedDisplay: ".flc-num-settings-selected",
            hideShowSolutionButton: ".flc-hideshow-solution"
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
            }
        },
        listeners: {
            "onCreate.renderSignIn": {
                func: "{that}.render",
                args: ["1_ready_to_capture"],
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
                            capture[name] = { settings: {} };
                        }
                        fluid.each(oofSettingBlock, function (settingBlock, settingName) {
                            if (capture[name]) {
                                capture[name].settings[settingName] = settingBlock;
                            }
                            else {
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
            if (!that.model.installedSolutions[solutionID]) {
                console.log("The solutionID is missing for this installedSolution: ", solutionID);
                return;
            }

            if (capturedSolution) {
                capturedSolution.name = that.model.installedSolutions[solutionID].name;
                capturedSolution.numberOfSettings = Object.keys(capturedSolution.settings).length;
            }
            else {
                console.log("This capturedSolution is undefined: ", solutionID);
            }
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
                return idx.indexOf(i) === -1 ? idx.length + 1 : idx.indexOf(i);
            }

            var idxA = idxOrEnd(a.id);
            var idxB = idxOrEnd(b.id);
            if (idxA < idxB) {
                return -1;
            }
            else if (idxA > idxB) {
                return 1;
            }
            else {
                return 0;
            }
        });
        return orderedInstalledSolutions;
    };

    gpii.captureTool.setupIPC = function (that) {
        ipcRenderer.on("sendingInstalledSolutions", function (event, arg) {
            that.fullChange("installedSolutions", arg);
            var orderedInstalledSolutions = gpii.captureTool.createArrayFromSolutionsHash(arg);
            that.fullChange("orderedInstalledSolutions", orderedInstalledSolutions);
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
            that.updateSolutionSettingsTree();
        });

        ipcRenderer.on("modelUpdate", function (event, arg) {
            var transaction = that.applier.initiate();
            transaction.fireChangeRequest({ path: "isKeyedIn", value: arg.isKeyedIn});
            transaction.fireChangeRequest({ path: "keyedInUserToken", value: arg.keyedInUserToken});
            transaction.commit();
        });

        // Get initial keyin state and solutions metadata
        ipcRenderer.send("getInstalledSolutions", "Please please!");
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
        if (currentPage === "1_sign_in") { // Currently not used with UX redesign
            that.applier.change("currentPage", "2_what_to_capture");
            ipcRenderer.send("getInstalledSolutions", "Please please!");
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
            that.applier.change("currentPage", "4_save_name");
            that.render("4_save_name");
        }
        else if (currentPage === "4_save_name") {
            that.applier.change("currentPage", "5_confirmation");
            that.render("5_confirmation");
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
            that.applier.change("currentPage", "1_ready_to_capture");
            that.render("1_ready_to_capture");
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
        var settings = [];
        fluid.each(that.model.capturedSettingsToRender, function (app) {
            fluid.each(app.settings, function (setting, settingId) {
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
        ipcRenderer.send("saveCapturedPreferences", {
            prefSetId: that.model.prefsSetName, //needs to be simplified... nospaces etc.
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
        fluid.each(that.model.capturedSettingsToRender, function(solution) {
            var numSelected = 0;
            fluid.each(Object.keys(solution.settings), function (settingId) {
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
            else if (solution.numberOfSettings === numSelected) {
                checkboxEl.indeterminate = false;
                checkboxEl.checked = true;
            }
            else {
                checkboxEl.indeterminate = true;
                checkboxEl.checked = false;
            }
        });
    };

    gpii.captureTool.onSolutionHeaderToKeepCheck = function (that, event) {
        var solutionId = event.currentTarget.value;
        var checkVal = event.currentTarget.checked;

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

    gpii.captureTool.onHideShowSolution = function (that, event) {
        var solutionId = event.currentTarget.dataset.solution;
        var hideShow = event.currentTarget.dataset.show;
        var buttonEl = $(event.currentTarget);
        if (hideShow) {
            $("#flc-settings-for-" + solutionId.replace(/\./g, "\\.")).toggle();
            buttonEl.data("show", true);
            buttonEl.val("Show Settings");
        }
        else {
            $("#flc-settings-for-" + solutionId.replace(/\./g, "\\.")).toggle();
            buttonEl.data("show", false);
            buttonEl.val("Hide Settings");
        }

    };

    gpii.captureTool.updateCapturedSettingsToRender = function (that) {

        var togo = {};
        fluid.each(that.model.capturedSettings, function (appData, appId) {
            if (appData.numberOfSettings >= 0) { // sgithens DEMO_TOGGLE
                togo[appId] = appData;
                togo[appId].renderSettings = {};
                fluid.each(togo[appId].settings, function (settingVal, settingKey) {
                    togo[appId].renderSettings[settingKey] = {};
                    var curRenderSetting = togo[appId].renderSettings[settingKey];
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
                            console.log("First case");
                        }
                        else if (fluid.isPlainObject(settingVal) && fluid.keys(settingVal).length === 2 &&
                            settingVal.value !== undefined && settingVal.path !== undefined) {
                            renderVal = renderVal.value;
                            console.log("Second case");
                        }
                        else {
                            console.log("Third Case");
                        }

                        console.log("The current schema is: ", settingVal, settingKey, curSchema);
                        curRenderSetting.settingLabel = curSchema.title;
                        curRenderSetting.settingDesc = curSchema.description;
                        // curRenderSetting.debugInfo = "Val: " + JSON.stringify(renderVal) + " Default: " + curSchema["default"];
                        curRenderSetting.debugInfo = "Default: " + curSchema["default"];

                        if (curSchema.enumLabels && curSchema["enum"] && curSchema["enum"][renderVal]) {
                            curRenderSetting.settingVal = curSchema.enumLabels[renderVal];
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
                });
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

    gpii.captureTool.updateNumSettingsSelected = function (that) {
        var el = that.locate("numSettingsSelectedDisplay");
        if (el && el.html) {
            el.html(that.model.settingsToKeep.length);
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
})(fluid);
