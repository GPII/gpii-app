"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;
    fluid.registerNamespace("gpii.psp");
    fluid.registerNamespace("gpii.captureTool");

    fluid.defaults("gpii.captureTool", {
        gradeNames: ["gpii.handlebars.templateAware.standalone", "gpii.binder.bindMarkupEvents"],
        model: {
            currentPage: "1_sign_in",
            // Possible values for this are:
            // "everything", "running", "chooseapps"
            whatToCapture: "everything",
            runningSolutions: {},
            solutionsToCapture: [],
            // Prefs Set Name to Save the captured settings to
            prefsSetName: "",
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
                    footer_location_partial: "@expand:gpii.captureTool.loadTemplate(footer_location_partial)"
                }
            },
            capturedSettings: [
                {
                    title: "Checkbook Balancer",
                }
            ],

            // These should be model relays to the main app
            isKeyedIn: true,
            keyedInUserToken: "alice"
        },
        bindings: {
            whatToCaptureRadio: "whatToCapture",
            prefsSetNameInput: "prefsSetName",
            solutionsToCaptureCheckbox: "solutionsToCapture"
        },
        templates: {
            initial: "capturePage"
        },
        messages: {
            "hello-message-key": "Hello, %mood world."
        },
        modelListeners: {
            "whatToCapture": {
                funcName: "console.log",
                args: ["What To Capture: ", "{that}.model.whatToCapture"]
            },
            "solutionsToCapture": {
                funcName: "console.log",
                args: ["Specific solutions to capture: ", "{that}.model.solutionsToCapture"]
            },
            "prefsSetName": {
                funcName: "console.log",
                args: ["PrefSet Name: ", "{that}.model.prefsSetName"]
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
            startCapture: {
                funcName: "gpii.captureTool.startCapture",
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
            solutionsToCaptureCheckbox: "[name='fc-choose-app']"
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

    /**
     * Annotates the merged capture with data for rendering the list including
     * solution names and the number of settings captured for each solutions.
     *
     * Edits the mergedCapture in place, and also re-returns it.
     */
    gpii.captureTool.annotateSettingsCapture = function(that, mergedCapture) {
        var togo = mergedCapture;
        fluid.each(togo, function(capturedSolution, solutionID) {
            capturedSolution.name = that.model.installedSolutions[solutionID].name;
            capturedSolution.numberOfSettings = Object.keys(capturedSolution.settings).length;
        });
        return togo;
    }

    gpii.captureTool.setupIPC = function (that) {
        ipcRenderer.on('sendingInstalledSolutions', (event, arg) => {
            that.applier.change("installedSolutions", arg);
        });

        ipcRenderer.on('sendingRunningSolutions', (event, arg) => {
            that.applier.change("runningSolutions", arg);
        });

        ipcRenderer.on('sendingAllSolutionsCapture', (event, arg) => {
            var finalSettings = gpii.captureTool.annotateSettingsCapture(that, gpii.captureTool.mergeSettingsCapture(arg));
            that.applier.change("capturedSettings", finalSettings);
            that.applier.change("currentPage", "3_what_to_keep");
            that.render("3_what_to_keep");
        });
    };

    gpii.captureTool.loadTemplate = function (templateName) {
        var resolvedPath = require("path").join(__dirname, "html", templateName + ".handlebars");
        var finalTemplate = require('electron').remote.require("fs").readFileSync(resolvedPath) + "";    //require(resolvedPath);
        return finalTemplate;
    };

    gpii.captureTool.startCapture = function (that) {
        that.applier.change("currentPage", "3_capturing_settings");
        that.render("3_capturing_settings");
        var options = {};
        if (that.model.whatToCapture === 'running') {
            options.solutionsList = Object.keys(that.model.runningSolutions);
        }
        else if (that.model.whatToCapture === 'chooseapps') {
            options.solutionsList = that.model.solutionsToCapture;
        }

        // Clear any previous capture
        that.applier.change("capturedSettings", {}, 'DELETE');

        ipcRenderer.send('getAllSolutionsCapture', options);
    };

    gpii.captureTool.nextButton = function (that, currentPage) {
        if (currentPage === "1_sign_in") {
            that.applier.change("currentPage", "2_what_to_capture");
            ipcRenderer.send('getInstalledSolutions', 'Please please!');
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

    gpii.captureTool.doneButton = function (that) {
        ipcRenderer.send('captureDoneButton', 'Done button clicked!');
    };
})(fluid);
