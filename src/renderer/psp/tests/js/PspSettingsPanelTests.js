/**
 * UI tests for the PSP
 *
 * Tests for the PSP widgets, for the expansion of attributes and for the restart warning
 * within the PSP `BrowserWindow`.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid, jqUnit */

"use strict";
(function (fluid, jqUnit) {
    var gpii = fluid.registerNamespace("gpii");

    var dropdownSettingFixture = {
        path: "settingOnePath",
        value: "b",
        solutionName: "solutions1",

        liveness: "manualRestart",
        memory: false,

        schema: {
            type: "string",
            "enum": ["a", "b", "c", "d"],
            title: "Setting one title",
            description: "Setting one description"
        }
    };

    var textfieldSettingFixture = {
        path: "textfieldPath",
        value: "Someee",

        liveness: "live",

        schema: {
            type: "text",
            title: "Text input",
            description: "Text input description"
        }
    };

    var switchSettingFixture = {
        path: "invertColorsPath",
        value: true,

        liveness: "liveRestart",
        memory: true,

        schema: {
            type: "boolean",
            title: "Invert colors",
            description: "Invert colors description"
        }
    };

    var compositeSwitchSettingFixture = fluid.extend(true, {}, switchSettingFixture, {
        settings: [textfieldSettingFixture, dropdownSettingFixture]
    });

    var stepperSettingFixture = {
        path: "zoomPath",
        value: 1,

        liveness: "OSRestart",

        schema: {
            type: "number",
            title: "Zoom",
            description: "Zoom description",
            min: 0.5,
            max: 4,
            divisibleBy: 0.1
        }
    };

    var multipickerSettingFixture = {
        path: "ttsTrackingPath",
        value: ["mouse", "focus"],

        liveness: "manualRestart",

        schema: {
            type: "array",
            title: "TTS tracking mode",
            description: "TTS tracking mode description",
            "enum":  ["mouse", "caret", "focus"]
        }
    };

    var allSettingGroupsFixtures = [
        {
            settings: [dropdownSettingFixture]
        }, {
            settings: [textfieldSettingFixture]
        }, {
            settings: [switchSettingFixture]
        }, {
            settings: [stepperSettingFixture]
        }, {
            settings: [multipickerSettingFixture]
        }
    ];

    fluid.registerNamespace("gpii.tests.psp.utils");

    gpii.tests.psp.utils.getSubcomponents = function (component) {
        return fluid.values(component)
            .filter(fluid.isComponent);
    };

    gpii.tests.psp.utils.testContainerEmpty = function (containerClass) {
        jqUnit.assertEquals(
            "DOM container is empty",
            0,
            $(containerClass).find("*[class^=flc-settingGroup-]").length
        );
    };

    /**
     * A wrapper component that ensures synchronous environment for `gpii.psp.settingsPanel` related tests.
     * Needed in order to ensure that the underlying `gpii.psp.settingsPanel`-s will be created with
     * corresponding resources loaded, when tests are run.
     */
    fluid.defaults("gpii.tests.psp.settingsPanelTestsWrapper", {
        gradeNames: "fluid.component",
        distributeOptions: {
            target: "{/ settingPresenter}.options.model.messages",
            record: {
                osRestart: "To change this setting,\nWindows requires a restart.",
                osRestartRequired: "You changed this setting, which\nrequires Windows to restart."
            }
        },
        components: {
            settingsPanelMock: {
                type: "gpii.tests.psp.settingsPanelMock",
                container: ".flc-settingsPanel-all",
                options: {
                    model: {
                        settingGroups: allSettingGroupsFixtures
                    }
                }
            },
            settingsPanelTests: {
                type: "gpii.tests.psp.settingsPanelTests",
                createOnEvent: "{settingsPanelMock}.resourcesLoader.events.onResourcesLoaded",
                options: {
                    components: {
                        settingsPanelMock: "{settingsPanelMock}"
                    }
                }
            },

            // widget tests
            singleSettingPanelsMock: {
                type: "gpii.tests.psp.singleSettingPanelsMock"
            },
            widgetsTests: {
                type: "gpii.tests.psp.widgetsTests",
                createOnEvent: "{singleSettingPanelsMock}.events.onResourcesLoaded",
                options: {
                    components: {
                        singleSettingPanelsMock: "{singleSettingPanelsMock}"
                    }
                }
            }
        }
    });


    /**
     * More or less isolated tests for the different widgets
     */
    fluid.defaults("gpii.tests.psp.widgetsTests", {
        gradeNames: "fluid.test.testEnvironment",
        components: {
            widgetsTester: {
                type: "gpii.tests.psp.widgetsTester",
                priority: "after:singleSettingPanelsMock"
            }
        }
    });

    /**
     * Generic (end-to-end) tests for the visualization of settings
     */
    fluid.defaults("gpii.tests.psp.settingsPanelTests", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            settingsPanelTester: {
                type: "gpii.tests.psp.settingsPanelTester"
            }
        }
    });

    gpii.tests.psp.testSwitch = function (container, setting) {
        jqUnit.assertEquals(
            "Widgets: Switch - should have proper value rendered",
            setting.value.toString(),
            $(".flc-switchUI-control", container).attr("aria-checked")
        );
    };

    gpii.tests.psp.testTextfield = function (container, setting) {
        jqUnit.assertEquals(
            "Widgets: Textfield - should have proper value",
            setting.value,
            $(".flc-textfieldInput", container).val()
        );
    };

    gpii.tests.psp.testMultipicker = function (container, setting) {
        var renderedMultipickerLabels = $(".flc-multipickerLabel", container)
            .map(function (idx, label) {
                return label.innerText;
            })
            .toArray();

        jqUnit.assertDeepEq(
            "Widgets: Multipicker - should have proper list of rendered option labels",
            setting.schema["enum"],
            renderedMultipickerLabels
        );

        jqUnit.assertEquals(
            "Widgets: Multipicker - should have proper number of checkbox inputs",
            setting.schema["enum"].length,
            $("input[type=checkbox] ~ span", container).length
        );

        var checkedInputs = $("input:checked ~ span", container)
            .map(function (idx, label) { return label.innerText; })
            .toArray();

        jqUnit.assertDeepEq(
            "Widgets: Multipicker - should have proper items checked",
            setting.value,
            checkedInputs
        );
    };

    gpii.tests.psp.testStepper = function (container, setting) {
        var stepper = $(".flc-textfieldStepper-field", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - stepper value should be proper",
            setting.value.toString(),
            stepper.val()
        );
    };

    gpii.tests.psp.testDropdownWidget = function (container, setting) {
        /*
         * We expect fot the dropdown element to use use `<option>` tags.
         * We validate these tags with the expected.
         */
        var renderedOptions = $(".flc-dropdown-options > option", container)
            .map(function (idx, optionContainer) {
                return optionContainer.text;
            })
            .toArray();

        jqUnit.assertDeepEq(
            "Widgets: Dropdown - should have proper options list rendered",
            setting.schema["enum"],
            renderedOptions
        );

        jqUnit.assertEquals(
            "Widgets: Dropdown - should have proper select",
            setting.value,
            $(".flc-dropdown-options > option:selected", container).text()
        );
    };

    gpii.tests.psp.testSettingGroupsRendered = function (containerClass, settingGroups) {
        // Get the containers of all setting groups
        var settingGroupContainers = $("*[class^=flc-settingGroup-]", containerClass);

        // Widgets tests
        /*
         * Type - schemaType:checker
         */
        var widgetCheckersMap = {
            "string": gpii.tests.psp.testDropdownWidget,
            "number": gpii.tests.psp.testStepper,
            "array": gpii.tests.psp.testMultipicker,
            "text": gpii.tests.psp.testTextfield,
            "boolean": gpii.tests.psp.testSwitch
        };

        settingGroupContainers.each(function (groupIndex, settingGroupContainer) {
            var settingGroup = settingGroups[groupIndex],
                settingContainers = $(".flc-setting", settingGroupContainer);
            settingContainers.each(function (settingIndex, settingContainer) {
                var setting = settingGroup.settings[settingIndex];
                jqUnit.assertEquals(
                    "Setting element should have title",
                    setting.schema.title,
                    $(".flc-title", settingContainer).text().trim()
                );

                var solutionName = setting.solutionName || "";
                jqUnit.assertEquals(
                    "Setting element should have solutionName",
                    solutionName,
                    $(".flc-solutionName", settingContainer).text().trim()
                );

                widgetCheckersMap[setting.schema.type](
                    settingContainer,
                    setting
                );
            });
        });
    };

    gpii.tests.psp.testSettingPanelConstruction = function (settingsPanel) {
        var widgetsCount = 5;
        jqUnit.assertEquals("SettingsPanel should have proper number of loaded resources",
            widgetsCount + 2, /* one for the group template and one for the settings row */
            fluid.values(settingsPanel.resourcesLoader.resources).length
        );

        var settingComponents = gpii.tests.psp.utils.getSubcomponents(settingsPanel.settingGroupsVisualizer);
        jqUnit.assertEquals("SettingsPanel should have valid number of subcomponents",
            allSettingGroupsFixtures.length,
            settingComponents.length
        );

        settingComponents.forEach(function (settingContainer, idx) {
            jqUnit.assertEquals("SettingsPanel setting containers should have proper identifiers",
                "flc-settingGroup-" + idx,
                settingComponents[idx].handler.container.attr("class")
            );

            jqUnit.assertLeftHand("SettingsPanel subelements should have proper model values",
                allSettingGroupsFixtures[idx],
                settingComponents[idx].handler.model
            );
        });
    };

    fluid.defaults("gpii.tests.psp.settingsPanelTester", {
        gradeNames: "fluid.test.testCaseHolder",
        modules: [{
            name: "Test PSP SettingsPanel",
            tests: [{
                // Test all components construction
                name: "Test components constucted properly",
                expect: 12,
                sequence: [{ // initiate `settingsVisualizer` creation
                    funcName: "{settingsPanelMock}.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.psp.testSettingPanelConstruction",
                    args: "{settingsPanel}"
                }]
            }, {
                // Test all visible markup
                name: "Test elements rendered properly",
                expect: 19,
                sequence: [{
                    funcName: "gpii.tests.psp.testSettingGroupsRendered",
                    args: ["{settingsPanelMock}.container", allSettingGroupsFixtures]
                }, {
                    // NOTE - a destructive step
                    //   this should always be last in the sequence
                    func: "{settingsPanelMock}.destroy"
                }, { // Dom cleared with component destruction
                    event: "{settingsPanelMock}.events.onDestroy",
                    listener: "gpii.tests.psp.utils.testContainerEmpty",
                    args: "{settingsPanelMock}.container"
                }]
            }]
        }]
    });

    gpii.tests.psp.testWidgetAccessibility = function (elements, ariaLabelledBy) {
        fluid.each(elements, function (element) {
            jqUnit.assertEquals(
                "Widgets: Widget element has correct aria-labelledby attribute",
                ariaLabelledBy,
                element.attr("aria-labelledby")
            );
        });
    };

    gpii.tests.psp.testSubsettingVisibility = function (container, visible) {
        var subsettingsContainer = container.find(".flc-subsettings");
        jqUnit.assertEquals(
            "Widgets: Subsettings are correctly shown / hidden",
            visible,
            subsettingsContainer.is(":visible")
        );
    };

    gpii.tests.psp.testWidgetMemoryIcon = function (container, memory) {
        var memoryIcon = container.find(".flc-memoryIcon");
        jqUnit.assertEquals(
            "Widgets: Widget is correctly (not) showing its memory icon",
            memory,
            memoryIcon.is(":visible")
        );
    };

    gpii.tests.psp.testRestartIcon = function (container, isVisible, isModified, settingGroupPresenter) {
        var restartIcon = $(".flc-restartIcon", container);
        jqUnit.assertEquals(
            "Widgets: Restart icon is correctly shown / hidden",
            isVisible,
            restartIcon.is(":visible")
        );

        if (isVisible) {
            var settingPresenter = settingGroupPresenter.settings.element.handler,
                messages = settingPresenter.model.messages,
                tooltip = isModified ? messages.osRestartRequired : messages.osRestart;
            jqUnit.assertEquals(
                "Widget: Restart icon has correct tooltip text",
                tooltip,
                restartIcon.attr("title")
            );
        }
    };

    gpii.tests.psp.testStepperModelInteraction = function (container, expected) {
        var textfield = $(".flc-textfieldStepper-field", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - text input has correct value after model update",
            expected.toString(),
            textfield.val()
        );
    };

    gpii.tests.psp.testTextfieldModelInteraction = function (container, expected) {
        var textfield = $(".flc-textfieldInput", container);
        jqUnit.assertEquals(
            "Widgets: Textfield - text input has correct value after model update",
            expected,
            textfield.val()
        );
    };

    gpii.tests.psp.changeDropdownValue = function (container, value) {
        $(".flc-dropdown-options", container)
            .find("option[value=" + value + "]")
            .prop("selected", true)
            .trigger("change");
    };

    gpii.tests.psp.testDropdownModelInteraction = function (container, expected) {
        var select = $(".flc-dropdown-options", container);
        jqUnit.assertEquals(
            "Widgets: Dropdown - select input has correct value after model update",
            expected,
            select.val()
        );
    };

    gpii.tests.psp.testSwitchInteraction = function (container, expected) {
        jqUnit.assertEquals(
            "Widgets: Switch - should have re-rendered switch value after model update",
            expected.toString(),
            $(".flc-switchUI-control", container).attr("aria-checked")
        );
    };

    gpii.tests.psp.changeMultipickerValues = function (container, values) {
        $("input[type=checkbox]", container)
            .prop("checked", false)
            .each(function () {
                var inputValue = $(this).prop("value");
                if (values.indexOf(inputValue) > -1) {
                    $(this).prop("checked", true);
                }
            })
            .change();
    };

    gpii.tests.psp.testMultipickerModelInteraction = function (container, expected) {
        var values = $("input[type=checkbox]", container)
            .filter(function () {
                return $(this).prop("checked");
            })
            .map (function () {
                return $(this).prop("value");
            })
            .toArray();

        jqUnit.assertDeepEq(
            "Widgets: Multipicker - should have re-rendered switch value after model update",
            expected,
            values
        );
    };

    /*
     * More isolated tests for the widgets
     */
    fluid.defaults("gpii.tests.psp.widgetsTester", {
        gradeNames: "fluid.test.testCaseHolder",

        modules: [{
            name: "PSP widgets interaction tests",
            tests: [{
                name: "Widgets: Switch - interactions test",
                expect: 8,
                sequence: [{ // initiate `settingsVisualizer` creation
                    funcName: "{singleSettingPanelsMock}.switchPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.psp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-switchUI-control, {singleSettingPanelsMock}.switchPanel.container)"],
                        compositeSwitchSettingFixture.path
                    ]
                }, {
                    funcName: "gpii.tests.psp.testWidgetMemoryIcon",
                    args: [
                        "{singleSettingPanelsMock}.switchPanel.container",
                        compositeSwitchSettingFixture.memory
                    ]
                }, {
                    funcName: "gpii.tests.psp.testRestartIcon",
                    args: [
                        "{singleSettingPanelsMock}.switchPanel.container",
                        false
                    ]
                }, {
                    funcName: "gpii.tests.psp.testSubsettingVisibility",
                    args: [
                        "{singleSettingPanelsMock}.switchPanel.container",
                        true
                    ]
                }, [ // Test DOM interaction
                    { // simulate manual click from the user
                        jQueryTrigger: "click",
                        element: "@expand:$(.flc-switchUI-control, {singleSettingPanelsMock}.switchPanel.container)"
                    }, { // check whether the update event was thrown
                        event: "{singleSettingPanelsMock}.switchPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Switch - component notified for the update with proper path/value",
                            [compositeSwitchSettingFixture.path, !compositeSwitchSettingFixture.value],
                            ["{arguments}.0.path", "{arguments}.0.value"]
                        ]
                    }, {
                        funcName: "gpii.tests.psp.testSubsettingVisibility",
                        args: [
                            "{singleSettingPanelsMock}.switchPanel.container",
                            false
                        ]
                    }
                ], [ // Test model interaction (settingsVisualizer is already created)
                    { // simulate setting from PSP update
                        funcName: "{singleSettingPanelsMock}.switchPanel.events.onSettingUpdated.fire",
                        args: [compositeSwitchSettingFixture.path, compositeSwitchSettingFixture.value]
                    }, { // Test if rendered item updated
                        event: "{singleSettingPanelsMock}.switchPanel.events.onSettingUpdated",
                        listener: "gpii.tests.psp.testSwitchInteraction",
                        args: ["{singleSettingPanelsMock}.switchPanel.container", true]
                    }, {
                        funcName: "gpii.tests.psp.testSubsettingVisibility",
                        args: [
                            "{singleSettingPanelsMock}.switchPanel.container",
                            true
                        ]
                    }]
                ]
            }, {
                name: "Widgets: Stepper - interactions test",
                expect: 8,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.stepperPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.psp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-textfieldStepper-field, {singleSettingPanelsMock}.stepperPanel.container)"],
                        stepperSettingFixture.path
                    ]
                }, {
                    funcName: "gpii.tests.psp.testRestartIcon",
                    args: [
                        "{singleSettingPanelsMock}.stepperPanel.container",
                        true,
                        false,
                        "{singleSettingPanelsMock}.stepperPanel.settingGroupsVisualizer.element.handler"
                    ]
                }, [
                    {
                        jQueryTrigger: "click",
                        element: "@expand:$(.flc-textfieldStepper-increase, {singleSettingPanelsMock}.stepperPanel.container)"
                    }, {
                        event: "{singleSettingPanelsMock}.stepperPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Stepper - component is notified when increasing for the update with proper path/value",
                            [stepperSettingFixture.path, stepperSettingFixture.value + stepperSettingFixture.schema.divisibleBy],
                            ["{arguments}.0.path", "{arguments}.0.value"]
                        ]
                    }, {
                        // Fire this event manually in order not to introduce several other components in the tests
                        // which would increase the complexity of the tests as a whole.
                        func: "{singleSettingPanelsMock}.stepperPanel.events.onRestartRequired.fire",
                        args: [
                            [stepperSettingFixture]
                        ]
                    }, {
                        event: "{singleSettingPanelsMock}.stepperPanel.events.onRestartRequired",
                        listener: "gpii.tests.psp.testRestartIcon",
                        args: [
                            "{singleSettingPanelsMock}.stepperPanel.container",
                            true,
                            true,
                            "{singleSettingPanelsMock}.stepperPanel.settingGroupsVisualizer.element.handler"
                        ]
                    }, {
                        jQueryTrigger: "click",
                        element: "@expand:$(.flc-textfieldStepper-decrease, {singleSettingPanelsMock}.stepperPanel.container)"
                    }, {
                        event: "{singleSettingPanelsMock}.stepperPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Stepper - component is notified when decreasing for the update with proper path/value",
                            [stepperSettingFixture.path, stepperSettingFixture.value],
                            ["{arguments}.0.path", "{arguments}.0.value"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.stepperPanel.events.onSettingUpdated.fire",
                        args: [stepperSettingFixture.path, stepperSettingFixture.value + stepperSettingFixture.schema.divisibleBy]
                    },
                    {
                        event: "{singleSettingPanelsMock}.stepperPanel.events.onSettingUpdated",
                        listener: "gpii.tests.psp.testStepperModelInteraction",
                        args: ["{singleSettingPanelsMock}.stepperPanel.container", stepperSettingFixture.value + stepperSettingFixture.schema.divisibleBy]
                    }
                ]]
            }, {
                name: "Widgets: Textfield - interactions test",
                expect: 3,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.textfieldPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.psp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-textfieldInput, {singleSettingPanelsMock}.textfieldPanel.container)"],
                        textfieldSettingFixture.path
                    ]
                }, [
                    {
                        funcName: "fluid.changeElementValue",
                        args: ["@expand:$(.flc-textfieldInput, {singleSettingPanelsMock}.textfieldPanel.container)", "Test value"]
                    }, {
                        event: "{singleSettingPanelsMock}.textfieldPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Textfield - component notified for the update with proper path/value",
                            [textfieldSettingFixture.path, "Test value"],
                            ["{arguments}.0.path", "{arguments}.0.value"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.textfieldPanel.events.onSettingUpdated.fire",
                        args: [textfieldSettingFixture.path, textfieldSettingFixture.value]
                    },
                    {
                        event: "{singleSettingPanelsMock}.textfieldPanel.events.onSettingUpdated",
                        listener: "gpii.tests.psp.testTextfieldModelInteraction",
                        args: ["{singleSettingPanelsMock}.textfieldPanel.container", textfieldSettingFixture.value]
                    }
                ]]
            }, {
                name: "Widgets: Dropdown - interactions test",
                expect: 5,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.dropdownPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.psp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-dropdown-options, {singleSettingPanelsMock}.dropdownPanel.container)"],
                        dropdownSettingFixture.path
                    ]
                }, {
                    funcName: "gpii.tests.psp.testRestartIcon",
                    args: [
                        "{singleSettingPanelsMock}.dropdownPanel.container",
                        false
                    ]
                }, {
                    funcName: "gpii.tests.psp.testWidgetMemoryIcon",
                    args: [
                        "{singleSettingPanelsMock}.dropdownPanel.container",
                        dropdownSettingFixture.memory
                    ]
                }, [
                    {
                        funcName: "gpii.tests.psp.changeDropdownValue",
                        args: ["{singleSettingPanelsMock}.dropdownPanel.container", dropdownSettingFixture.schema["enum"][2]]
                    }, {
                        event: "{singleSettingPanelsMock}.dropdownPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Dropdown - component notified for the update with proper path/value",
                            [dropdownSettingFixture.path, dropdownSettingFixture.schema["enum"][2]],
                            ["{arguments}.0.path", "{arguments}.0.value"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.dropdownPanel.events.onSettingUpdated.fire",
                        args: [dropdownSettingFixture.path, dropdownSettingFixture.value]
                    },
                    {
                        event: "{singleSettingPanelsMock}.dropdownPanel.events.onSettingUpdated",
                        listener: "gpii.tests.psp.testDropdownModelInteraction",
                        args: ["{singleSettingPanelsMock}.dropdownPanel.container", dropdownSettingFixture.value]
                    }
                ]]
            }, {
                name: "Widgets: Multipicker - interactions test",
                expect: 2,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.multipickerPanel.events.onTemplatesLoaded.fire"
                }, [
                    {
                        funcName: "gpii.tests.psp.changeMultipickerValues",
                        args: ["{singleSettingPanelsMock}.multipickerPanel.container", [multipickerSettingFixture.schema["enum"][1]]]
                    }, {
                        event: "{singleSettingPanelsMock}.multipickerPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Multipicker - component notified for the update with proper path/value",
                            [multipickerSettingFixture.path, [multipickerSettingFixture.schema["enum"][1]]],
                            ["{arguments}.0.path", "{arguments}.0.value"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.multipickerPanel.events.onSettingUpdated.fire",
                        args: [multipickerSettingFixture.path, multipickerSettingFixture.value]
                    },
                    {
                        event: "{singleSettingPanelsMock}.multipickerPanel.events.onSettingUpdated",
                        listener: "gpii.tests.psp.testMultipickerModelInteraction",
                        args: ["{singleSettingPanelsMock}.multipickerPanel.container", multipickerSettingFixture.value]
                    }
                ]]
            }]
        }]
    });


    fluid.defaults("gpii.tests.psp.singleSettingPanelsMock", {
        gradeNames: "fluid.component",

        events: {
            onDropdownPanelLoaded: null,
            onTextfieldPanelLoaded: null,
            onSwitchPanelLoaded: null,
            onStepperPanelLoaded: null,
            onMultipickerPanelLoaded: null,

            // a compound event thrown once all subcomponents have finished
            // fetching their resources (possibly async work)
            onResourcesLoaded: {
                events: {
                    onDropdownPanelLoaded: "onDropdownPanelLoaded",
                    onTextfieldPanelLoaded: "onTextfieldPanelLoaded",
                    onSwitchPanelLoaded: "onSwitchPanelLoaded",
                    onStepperPanelLoaded: "onStepperPanelLoaded",
                    onMultipickerPanelLoaded: "onMultipickerPanelLoaded"
                }
            }
        },

        components: {
            dropdownPanel: {
                type: "gpii.tests.psp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-dropdown",
                options: {
                    model: {
                        settingGroups: [
                            {
                                settings: [dropdownSettingFixture]
                            }
                        ]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onDropdownPanelLoaded"
                    }
                }
            },
            textfieldPanel: {
                type: "gpii.tests.psp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-textfield",
                options: {
                    model: {
                        settingGroups: [
                            {
                                settings: [textfieldSettingFixture]
                            }
                        ]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onTextfieldPanelLoaded"
                    }
                }
            },
            switchPanel: {
                type: "gpii.tests.psp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-switch",
                options: {
                    model: {
                        settingGroups: [
                            {
                                settings: [compositeSwitchSettingFixture]
                            }
                        ]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onSwitchPanelLoaded"
                    }
                }
            },
            stepperPanel: {
                type: "gpii.tests.psp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-stepper",
                options: {
                    model: {
                        settingGroups: [
                            {
                                settings: [stepperSettingFixture]
                            }
                        ]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onStepperPanelLoaded"
                    }
                }
            },
            multipickerPanel: {
                type: "gpii.tests.psp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-multipicker",
                options: {
                    model: {
                        settingGroups: [
                            {
                                settings: [multipickerSettingFixture]
                            }
                        ]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onMultipickerPanelLoaded"
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.tests.psp.settingsPanelMock", {
        gradeNames: "gpii.psp.settingsPanel",

        // set proper path for the resources
        distributeOptions: {
            record: "../../html",
            target: "{/ exemplar}.options.resourceDir"
        },
        model: {
            settingGroups: null
        },
        // XXX in order to avoid async behavior
        //   fire event for `settingsVisualizer` manually
        components: {
            resourcesLoader: {
                options: {
                    listeners: {
                        "onResourcesLoaded": null
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.tests.psp.attrsExpanderTests", {
        gradeNames: ["fluid.test.testEnvironment"],

        components: {
            attrsExpanderWrapperMock: {
                type: "gpii.tests.psp.attrsExpanderWrapperMock"
            },
            attrsExpanderTester: {
                type: "gpii.tests.psp.attrsExpanderTester"
            }
        }
    });

    fluid.defaults("gpii.tests.psp.attrsExpanderTester", {
        gradeNames: ["fluid.test.testCaseHolder"],

        modules: [{
            name: "AttrsExpander tests",
            tests: [{
                expect: 1,
                name: "Test attrs field expansion",
                type: "test",
                funcName: "jqUnit.assertDeepEq",
                args: [
                    {
                        specific: "some specific property",
                        pathMaybe: "some/path"
                    },
                    "{attrsExpanderWrapperMock}.switchWidget.options.attrs"
                ]
            }]
        }]
    });

    fluid.defaults("gpii.tests.psp.attrsExpanderMock", {
        gradeNames: ["fluid.component", "gpii.psp.widgets.attrsExpander"],

        attrs: {
            specific: "some specific property"
        }
    });

    fluid.defaults("gpii.tests.psp.attrsExpanderWrapperMock", {
        gradeNames: ["fluid.modelComponent"],

        mergePolicy: {
            rawAttrsMock: "noexpand"
        },

        attrs: {
            path: "some/path"
        },

        // unexpanded IoC string holder
        widgetOptions: {
            rawAttrs: {
                pathMaybe: "{attrsExpanderWrapperMock}.options.attrs.path"
            }
        },

        components: {
            attrsExpander: {
                type: "gpii.tests.psp.attrsExpanderMock",
                options: "{attrsExpanderWrapperMock}.options.widgetOptions"
            }
        }
    });

    gpii.tests.psp.testRestartWarningVisibility = function (restartWarning, expectedVisibility) {
        jqUnit.assertEquals("Restart warning has correct visibility",
            expectedVisibility,
            $(restartWarning.container).is(":visible"));
    };

    gpii.tests.psp.testRestartWarningText = function (restartWarning, osRestart, solutionNames) {
        var restartText = $(".flc-restartText", restartWarning.container).text().trim();
        if (osRestart) {
            jqUnit.assertEquals("Restart warning has correct OS restart text message",
                restartWarning.model.messages.osRestartText,
                restartText);
        } else {
            var expectedTextSuffix = solutionNames.join(", ");
            jqUnit.assertTrue("Restart warning has correct text message",
                restartText.endsWith(expectedTextSuffix));
        }
    };

    fluid.defaults("gpii.tests.psp.restartWarningTester", {
        gradeNames: ["fluid.test.testCaseHolder"],

        modules: [{
            name: "Restart warning tests",
            tests:[
                {
                    name: "Restart warning text, icon and buttons tests",
                    expect: 6,
                    sequence: [
                        {
                            funcName: "gpii.tests.psp.testRestartWarningVisibility",
                            args: ["{restartWarning}.container", false]
                        }, {
                            funcName: "{restartWarning}.updatePendingChanges",
                            args: [
                                [dropdownSettingFixture, multipickerSettingFixture]
                            ]
                        }, {
                            funcName: "gpii.tests.psp.testRestartWarningText",
                            args: [
                                "{restartWarning}",
                                false,
                                [dropdownSettingFixture.solutionName, multipickerSettingFixture.schema.title]
                            ]
                        }, {
                            funcName: "{restartWarning}.updatePendingChanges",
                            args: [
                                [dropdownSettingFixture, multipickerSettingFixture, stepperSettingFixture]
                            ]
                        }, {
                            funcName: "gpii.tests.psp.testRestartWarningText",
                            args: [
                                "{restartWarning}",
                                true
                            ]
                        },
                        // The buttons in the restart warning simply fire the associated event.
                        // They are not responsible for anything else (including clearing the
                        // pending changes array within the model).
                        {
                            jQueryTrigger: "click",
                            element: "@expand:$(.flc-restartUndo, {restartWarning}.container)"
                        }, {
                            event: "{restartWarning}.events.onUndoChanges",
                            listener: "jqUnit.assert",
                            args: ["Restart warning's undo button fires the correct event"]
                        }, {
                            jQueryTrigger: "click",
                            element: "@expand:$(.flc-restartNow, {restartWarning}.container)"
                        }, {
                            event: "{restartWarning}.events.onRestartNow",
                            listener: "jqUnit.assert",
                            args: ["Restart warning's restart now button fires the correct event"]
                        }, {
                            funcName: "{restartWarning}.updatePendingChanges",
                            args: [
                                []
                            ]
                        }, {
                            funcName: "gpii.tests.psp.testRestartWarningVisibility",
                            args: ["{restartWarning}.container", false]
                        }
                    ]
                }
            ]
        }]
    });

    fluid.defaults("gpii.tests.psp.restartWarningTests", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            restartWarning: {
                type: "gpii.psp.restartWarning",
                container: ".fl-restartWarning",
                options: {
                    model: {
                        messages: {
                            osName: "Windows",
                            osRestartText: "Windows needs to restart to apply your changes.",
                            restartText: "These applications will restart when this GPII Settings panel closes: %solutions",
                            undo: "Undo Changes",
                            applyNow: "Apply changes now",
                            restartNow: "Restart Now"
                        }
                    }
                }
            },
            restartWarningTester: {
                type: "gpii.tests.psp.restartWarningTester"
            }
        }
    });

    $(function () {
        fluid.test.runTests([
            "gpii.tests.psp.attrsExpanderTests",
            "gpii.tests.psp.restartWarningTests",
            "gpii.tests.psp.settingsPanelTestsWrapper"
        ]);
    });
})(fluid, jqUnit);
