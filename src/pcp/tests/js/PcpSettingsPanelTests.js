/*

Copyright 2013-2017 OCAD University



Licensed under the Educational Community License (ECL), Version 2.0 or the New

BSD license. You may not use this file except in compliance with one these

Licenses.



You may obtain a copy of the ECL 2.0 License and BSD License at

https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt

*/

/* global fluid, jqUnit */

"use strict";
(function (fluid, jqUnit) {
    var gpii = fluid.registerNamespace("gpii");

    var dropdownSettingFixture = {
        solutionName: "solutions1",
        path: "settingOnePath",
        type: "string",
        values: ["a", "b", "c", "d"],
        title: "Setting one title",
        description: "Setting one description",
        icon: "../../../icons/gear-cloud-black.png",
        value: "b"
    };

    var textfieldSettingFixture = {
        path: "textfieldPath",
        type: "text",
        title: "Text input",
        description: "Text input description",
        icon: "../../../icons/gear-cloud-white.png",
        value: "Someee"
    };

    var switchSettingFixture = {
        path: "invertColorsPath",
        type: "boolean",
        title: "Invert colors",
        description: "Invert colors description",
        icon: "../../../icons/gear-cloud-black.png",
        value: true,
        isPersisted: true
    };

    var stepperSettingFixture = {
        path: "zoomPath",
        type: "number",
        title: "Zoom",
        description: "Zoom description",
        icon: "../../../icons/gear-cloud-black.png",
        value: 1,
        min: 0.5,
        max: 4,
        divisibleBy: 0.1,
        isPersisted: true
    };

    var multipickerSettingFixture = {
        path: "ttsTrackingPath",
        type: "array",
        title: "TTS tracking mode",
        description: "TTS tracking mode description",
        icon: "../../../icons/gear-cloud-white.png",
        values:  ["mouse", "caret", "focus"],
        value: ["mouse", "focus"],
        dynamic: true
    };

    var allSettingTypesFixture = [dropdownSettingFixture, {
        solutionName: "solutions2",
        path: "settingTwoPath",
        type: "string",
        values: ["b", "c", "d", "e"],
        title: "Setting two title",
        description: "Setting two description",
        icon: "../../../icons/gear-cloud-black.png",
        value: "c"
    }, textfieldSettingFixture, switchSettingFixture, stepperSettingFixture, multipickerSettingFixture];

    fluid.registerNamespace("gpii.tests.pcp.utils");

    gpii.tests.pcp.utils.getSubcomponents = function (component) {
        return fluid.values(component)
            .filter(fluid.isComponent);
    };

    gpii.tests.pcp.utils.testContainerEmpty = function (containerClass) {
        jqUnit.assertTrue(
            "DOM container is empty",
            $(containerClass).is(":empty")
        );
    };

    /**
     * A wrapper component that ensures synchronous environment for `gpii.pcp.settingsPanel` related tests.
     * Needed in order to ensure that the underlying `gpii.pcp.settingsPanel`-s will be created with
     * corresponding resources loaded, when tests are run.
     */
    fluid.defaults("gpii.tests.pcp.settingsPanelTestsWrapper", {
        gradeNames: "fluid.component",
        components: {
            settingsPanelMock: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-all",
                options: {
                    model: {
                        settings: allSettingTypesFixture
                    }
                }
            },
            settingsPanelTests: {
                type: "gpii.tests.pcp.settingsPanelTests",
                createOnEvent: "{settingsPanelMock}.resourcesLoader.events.onResourcesLoaded",
                options: {
                    components: {
                        settingsPanelMock: "{settingsPanelMock}"
                    }
                }
            },

            // widget tests
            singleSettingPanelsMock: {
                type: "gpii.tests.pcp.singleSettingPanelsMock"
            },
            widgetsTests: {
                type: "gpii.tests.pcp.widgetsTests",
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
    fluid.defaults("gpii.tests.pcp.widgetsTests", {
        gradeNames: "fluid.test.testEnvironment",
        components: {
            widgetsTester: {
                type: "gpii.tests.pcp.widgetsTester",
                priority: "after:singleSettingPanelsMock"
            }
        }
    });

    /**
     * Generic (end-to-end) tests for the visualization of settings
     */
    fluid.defaults("gpii.tests.pcp.settingsPanelTests", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            settingsPanelTester: {
                type: "gpii.tests.pcp.settingsPanelTester"
            }
        }
    });

    gpii.tests.pcp.testSwitch = function (container, setting) {
        jqUnit.assertEquals(
            "Widgets: Switch - should have proper value rendered",
            setting.value.toString(),
            $(".flc-switchUI-control", container).attr("aria-checked")
        );
    };

    gpii.tests.pcp.testTextfield = function (container, setting) {
        jqUnit.assertEquals(
            "Widgets: Textfield - should have proper value",
            setting.value,
            $(".flc-textfieldInput", container).val()
        );
    };

    gpii.tests.pcp.testMultipicker = function (container, setting) {
        var renderedMultipickerLabels = $(".flc-multipickerLabel", container)
            .map(function (idx, label) {
                return label.innerText;
            })
            .toArray();

        jqUnit.assertDeepEq(
            "Widgets: Multipicker - should have proper list of rendered option labels",
            setting.values,
            renderedMultipickerLabels
        );

        jqUnit.assertEquals(
            "Widgets: Multipicker - should have proper number of checkbox inputs",
            setting.values.length,
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

    gpii.tests.pcp.testStepper = function (container, setting) {
        // Test slider
        var slider = $(".flc-textfieldSlider-slider", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - slider should have proper value",
            setting.value.toString(),
            slider.val()
        );
        jqUnit.assertEquals(
            "Widgets: Stepper - slider min should be proper",
            setting.min.toString(),
            slider.attr("min")
        );
        jqUnit.assertEquals(
            "Widgets: Stepper - slider min should be proper",
            setting.max.toString(),
            slider.attr("max")
        );

        // Test stepper
        var stepper = $(".flc-textfieldStepper-field", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - stepper value should be proper",
            setting.value.toString(),
            stepper.val()
        );

        var stepperButtons = $(".fl-stepperBtn", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - has two buttons to it",
            2,
            stepperButtons.length
        );
    };

    gpii.tests.pcp.testDropdownWidget = function (container, setting) {
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
            setting.values,
            renderedOptions
        );

        jqUnit.assertEquals(
            "Widgets: Dropdown - should have proper select",
            setting.value,
            $(".flc-dropdown-options > option:selected", container).text()
        );
    };

    gpii.tests.pcp.testSettingsRendered = function (containerClass, setting) {
        // Search for such element
        var settingContainers = $(".flc-setting", containerClass); // get the list of all settings

        // Widgets tests
        /*
         * Type - schemaType:checker
         */
        var widgetCheckersMap = {
            "string": gpii.tests.pcp.testDropdownWidget,
            "number": gpii.tests.pcp.testStepper,
            "array": gpii.tests.pcp.testMultipicker,
            "text": gpii.tests.pcp.testTextfield,
            "boolean": gpii.tests.pcp.testSwitch
        };

        settingContainers.each(function (idx, settingContainer) {
            jqUnit.assertEquals(
                "Setting element should have title",
                setting[idx].title,
                $(".flc-title", settingContainer).text().trim()
            );

            var solutionName = setting[idx].solutionName || "";
            jqUnit.assertEquals(
                "Setting element should have solutionName",
                solutionName,
                $(".flc-solutionName", settingContainer).text().trim()
            );

            jqUnit.assertEquals(
                "Setting element should have solutionName",
                setting[idx].icon,
                $(".flc-icon", settingContainer).attr("src")
            );

            widgetCheckersMap[setting[idx].type](
                settingContainers[idx],
                setting[idx]
            );
        });
    };

    gpii.tests.pcp.testSettingPanelConstruction = function (settingsPanel) {
        var widgetsCount = 5;
        jqUnit.assertEquals("SettingsPanel should have proper number of loaded resources",
            widgetsCount + 1,
            fluid.values(settingsPanel.resourcesLoader.resources).length
        );

        var settingComponents = gpii.tests.pcp.utils.getSubcomponents(settingsPanel.settingsVisualizer);
        jqUnit.assertEquals("SettingsPanel should have valid number of subcomponents",
            allSettingTypesFixture.length,
            settingComponents.length
        );

        settingComponents.forEach(function (settingContainer, idx) {
            jqUnit.assertEquals("SettingsPanel setting containers should have proper identifiers",
                "flc-settingListRow-" + idx,
                settingComponents[idx].settingPresenter.container.attr("class")
            );

            jqUnit.assertLeftHand("SettingsPanel subelements should have proper model values",
                allSettingTypesFixture[idx],
                settingComponents[idx].settingPresenter.model
            );
        });
    };

    fluid.defaults("gpii.tests.pcp.settingsPanelTester", {
        gradeNames: "fluid.test.testCaseHolder",
        modules: [{
            name: "Test PCP SettingsPanel",
            tests: [{
                // Test all components construction
                name: "Test components constucted properly",
                expect: 14,
                sequence: [{ // initiate `settingsVisualizer` creation
                    funcName: "{settingsPanelMock}.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.pcp.testSettingPanelConstruction",
                    args: "{settingsPanel}"
                }]
            }, {
                // Test all visible markup
                name: "Test elements rendered properly",
                expect: 33,
                sequence: [{
                    funcName: "gpii.tests.pcp.testSettingsRendered",
                    args: ["{settingsPanelMock}.container", allSettingTypesFixture]
                }, {
                    // NOTE - a destructive step
                    //   this should always be last in the sequence
                    spec: {path: "", priority: "last"},
                    func: "{settingsPanelMock}.destroy"
                }, { // Dom cleared with component destruction
                    event: "{settingsPanelMock}.events.onDestroy",
                    listener: "gpii.tests.pcp.utils.testContainerEmpty",
                    args: "{settingsPanelMock}.container"
                }]
            }]
        }]
    });

    gpii.tests.pcp.testWidgetAccessibility = function (elements, ariaLabelledBy) {
        fluid.each(elements, function (element) {
            jqUnit.assertEquals(
                "Widgets: Widget element has correct aria-labelledby attribute",
                ariaLabelledBy,
                element.attr("aria-labelledby")
            );
        });
    };

    gpii.tests.pcp.testStepperModelInteraction = function (container, expected) {
        var textfield = $(".flc-textfieldStepper-field", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - text input has correct value after model update",
            expected.toString(),
            textfield.val()
        );

        var slider = $(".flc-textfieldSlider-slider", container);
        jqUnit.assertEquals(
            "Widgets: Stepper - slider input has correct value after model update",
            expected.toString(),
            slider.val()
        );
    };

    gpii.tests.pcp.testTextfieldModelInteraction = function (container, expected) {
        var textfield = $(".flc-textfieldInput", container);
        jqUnit.assertEquals(
            "Widgets: Textfield - text input has correct value after model update",
            expected,
            textfield.val()
        );
    };

    gpii.tests.pcp.changeDropdownValue = function (container, value) {
        $(".flc-dropdown-options", container)
            .find("option[value=" + value + "]")
            .prop("selected", true)
            .trigger("change");
    };

    gpii.tests.pcp.testDropdownModelInteraction = function (container, expected) {
        var select = $(".flc-dropdown-options", container);
        jqUnit.assertEquals(
            "Widgets: Dropdown - select input has correct value after model update",
            expected,
            select.val()
        );
    };

    gpii.tests.pcp.testSwitchInteraction = function (container, expected) {
        jqUnit.assertEquals(
            "Widgets: Switch - should have re-rendered switch value after model update",
            expected.toString(),
            $(".flc-switchUI-control", container).attr("aria-checked")
        );
    };

    gpii.tests.pcp.changeMultipickerValues = function (container, values) {
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

    gpii.tests.pcp.testMultipickerModelInteraction = function (container, expected) {
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
    fluid.defaults("gpii.tests.pcp.widgetsTester", {
        gradeNames: "fluid.test.testCaseHolder",

        modules: [{
            name: "PSP widgets interaction tests",
            tests: [{
                name: "Widgets: Switch - interactions test",
                expect: 3,
                sequence: [{ // initiate `settingsVisualizer` creation
                    funcName: "{singleSettingPanelsMock}.switchPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.pcp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-switchUI-control, {singleSettingPanelsMock}.switchPanel.container)"],
                        switchSettingFixture.path
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
                            [switchSettingFixture.path, !switchSettingFixture.value],
                            ["{arguments}.0", "{arguments}.1"]
                        ]
                    }
                ], [ // Test model interaction (settingsVisualizer is already created)
                    { // simulate setting from PCP update
                        funcName: "{singleSettingPanelsMock}.switchPanel.events.onSettingUpdated.fire",
                        args: [switchSettingFixture.path, switchSettingFixture.value]
                    }, { // Test if rendered item updated
                        event: "{singleSettingPanelsMock}.switchPanel.events.onSettingUpdated",
                        listener: "gpii.tests.pcp.testSwitchInteraction",
                        args: ["{singleSettingPanelsMock}.switchPanel.container", true]
                    }]
                ]
            }, {
                name: "Widgets: Stepper - interactions test",
                expect: 6,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.stepperPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.pcp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-textfieldSlider-slider, {singleSettingPanelsMock}.stepperPanel.container)",
                            "@expand:$(.flc-textfieldStepper-field, {singleSettingPanelsMock}.stepperPanel.container)"],
                        stepperSettingFixture.path
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
                            [stepperSettingFixture.path, stepperSettingFixture.value + stepperSettingFixture.divisibleBy],
                            ["{arguments}.0", "{arguments}.1"]
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
                            ["{arguments}.0", "{arguments}.1"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.stepperPanel.events.onSettingUpdated.fire",
                        args: [stepperSettingFixture.path, stepperSettingFixture.value + stepperSettingFixture.divisibleBy]
                    },
                    {
                        event: "{singleSettingPanelsMock}.stepperPanel.events.onSettingUpdated",
                        listener: "gpii.tests.pcp.testStepperModelInteraction",
                        args: ["{singleSettingPanelsMock}.stepperPanel.container", stepperSettingFixture.value + stepperSettingFixture.divisibleBy]
                    }
                ]]
            }, {
                name: "Widgets: Textfield - interactions test",
                expect: 3,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.textfieldPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.pcp.testWidgetAccessibility",
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
                            ["{arguments}.0", "{arguments}.1"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.textfieldPanel.events.onSettingUpdated.fire",
                        args: [textfieldSettingFixture.path, textfieldSettingFixture.value]
                    },
                    {
                        event: "{singleSettingPanelsMock}.textfieldPanel.events.onSettingUpdated",
                        listener: "gpii.tests.pcp.testTextfieldModelInteraction",
                        args: ["{singleSettingPanelsMock}.textfieldPanel.container", textfieldSettingFixture.value]
                    }
                ]]
            }, {
                name: "Widgets: Dropdown - interactions test",
                expect: 3,
                sequence: [{
                    funcName: "{singleSettingPanelsMock}.dropdownPanel.events.onTemplatesLoaded.fire"
                }, {
                    funcName: "gpii.tests.pcp.testWidgetAccessibility",
                    args: [
                        ["@expand:$(.flc-dropdown-options, {singleSettingPanelsMock}.dropdownPanel.container)"],
                        dropdownSettingFixture.path
                    ]
                }, [
                    {
                        funcName: "gpii.tests.pcp.changeDropdownValue",
                        args: ["{singleSettingPanelsMock}.dropdownPanel.container", dropdownSettingFixture.values[2]]
                    }, {
                        event: "{singleSettingPanelsMock}.dropdownPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Dropdown - component notified for the update with proper path/value",
                            [dropdownSettingFixture.path, dropdownSettingFixture.values[2]],
                            ["{arguments}.0", "{arguments}.1"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.dropdownPanel.events.onSettingUpdated.fire",
                        args: [dropdownSettingFixture.path, dropdownSettingFixture.value]
                    },
                    {
                        event: "{singleSettingPanelsMock}.dropdownPanel.events.onSettingUpdated",
                        listener: "gpii.tests.pcp.testDropdownModelInteraction",
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
                        funcName: "gpii.tests.pcp.changeMultipickerValues",
                        args: ["{singleSettingPanelsMock}.multipickerPanel.container", [multipickerSettingFixture.values[1]]]
                    }, {
                        event: "{singleSettingPanelsMock}.multipickerPanel.events.onSettingAltered",
                        listener: "jqUnit.assertDeepEq",
                        args: [
                            "Widgets: Multipicker - component notified for the update with proper path/value",
                            [multipickerSettingFixture.path, [multipickerSettingFixture.values[1]]],
                            ["{arguments}.0", "{arguments}.1"]
                        ]
                    }
                ], [
                    {
                        funcName: "{singleSettingPanelsMock}.multipickerPanel.events.onSettingUpdated.fire",
                        args: [multipickerSettingFixture.path, multipickerSettingFixture.value]
                    },
                    {
                        event: "{singleSettingPanelsMock}.multipickerPanel.events.onSettingUpdated",
                        listener: "gpii.tests.pcp.testMultipickerModelInteraction",
                        args: ["{singleSettingPanelsMock}.multipickerPanel.container", multipickerSettingFixture.value]
                    }
                ]]
            }]
        }]
    });


    fluid.defaults("gpii.tests.pcp.singleSettingPanelsMock", {
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
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-dropdown",
                options: {
                    model: {
                        settings: [dropdownSettingFixture]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onDropdownPanelLoaded"
                    }
                }
            },
            textfieldPanel: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-textfield",
                options: {
                    model: {
                        settings: [textfieldSettingFixture]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onTextfieldPanelLoaded"
                    }
                }
            },
            switchPanel: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-switch",
                options: {
                    model: {
                        settings: [switchSettingFixture]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onSwitchPanelLoaded"
                    }
                }
            },
            stepperPanel: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-stepper",
                options: {
                    model: {
                        settings: [stepperSettingFixture]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onStepperPanelLoaded"
                    }
                }
            },
            multipickerPanel: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-multipicker",
                options: {
                    model: {
                        settings: [multipickerSettingFixture]
                    },
                    listeners: {
                        "{resourcesLoader}.events.onResourcesLoaded": "{singleSettingPanelsMock}.events.onMultipickerPanelLoaded"
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.tests.pcp.settingsPanelMock", {
        gradeNames: "gpii.pcp.settingsPanel",

        // set proper path for the resources
        distributeOptions: {
            record: "../../html",
            target: "{/ exemplar}.options.resourceDir"
        },
        model: {
            settings: null
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

    $(document).ready(function () {
        fluid.test.runTests([
            "gpii.tests.pcp.settingsPanelTestsWrapper"
        ]);
    });
})(fluid, jqUnit);
