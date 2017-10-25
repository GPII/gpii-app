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

    /* TODO Remove when dev finished
     *
     * FOR EACH
     * (2)dynamic flag is shown
     * (2)m flag is shown
     * (3) on click handler is triggered
     * (3) rendered on update
     *
     * async update of solutionName
     *
     * WIDGETS
     *  * simulate value change by user
     *  * simulate API change (model)
     *  * doc tests
     *
     * DIFFERENT FIXTURES
     *  * same type widget >1
     *  * less settings
     *  * `undefined` options?
     *
     * MainWindow
     *   On pref set changed
     *    * remove drawn elements
     *    * draw new elements
     */

    var switchSettingFixture = {
        path: "invertColorsPath",
        type: "boolean",
        title: "Invert colors",
        description: "Invert colors description",
        icon: "../../../icons/gear-cloud-black.png",
        value: true,
        isPersisted: true
    };

    var allSettingTypesFixture = [ {
        solutionName: "solutions1",
        path: "settingOnePath",
        type: "string",
        values: ["a", "b", "c", "d"],
        title: "Setting one title",
        description: "Setting one description",
        icon: "../../../icons/gear-cloud-black.png",
        value: "b"
    }, {
        solutionName: "solutions2",
        path: "settingTwoPath",
        type: "string",
        values: ["b", "c", "d", "e"],
        title: "Setting two title",
        description: "Setting two description",
        icon: "../../../icons/gear-cloud-black.png",
        value: "c"
    }, {
        path: "textfieldPath",
        type: "text",
        title: "Text input",
        description: "Text input description",
        icon: "../../../icons/gear-cloud-white.png",
        value: "Someee"
    }, switchSettingFixture, {
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
    }, {
        path: "ttsTrackingPath",
        type: "array",
        title: "TTS tracking mode",
        description: "TTS tracking mode description",
        icon: "../../../icons/gear-cloud-white.png",
        values:  ["mouse", "caret", "focus"],
        value: ["mouse", "focus"],
        dynamic: true
    }];

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
     * More or less isolated tests for the different widgets
     */
    fluid.defaults("gpii.tests.pcp.widgetsTests", {
        gradeNames: "fluid.test.testEnvironment",
        components: {
            // widget tests
            singleSettingPanelsMock: {
                type: "gpii.tests.pcp.singleSettingPanelsMock"
            },
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
            settingsPanelMock: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-all",
                options: {
                    model: {
                        settings: allSettingTypesFixture
                    }
                }
            },
            settingsPanelTester: {
                type: "gpii.tests.pcp.settingsPanelTester",
                priority: "after:settingsPanelMock"
            }
        }
    });

    gpii.tests.pcp.testSwitch = function (container, setting) {
        jqUnit.assertEquals(
            "Widgets: Switch - should have proper value rendered",
            setting.value.toString(),
            $(".flc-switchUI-control", container).attr("aria-pressed")
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


    /*
     * More isolated tests for the widgets
     */
    fluid.defaults("gpii.tests.pcp.widgetsTester", {
        gradeNames: "fluid.test.testCaseHolder",

        modules: [{
            name: "PSP widgets interaction tests",
            tests: [{
                name: "Widgets: Switch - interactions test",
                expect: 2,
                sequence: [{ // initiate `settingsVisualizer` creation
                    funcName: "{singleSettingPanelsMock}.switchPanel.events.onTemplatesLoaded.fire"
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
                ], [ // Test model interaction
                    { // simulate setting from pcp update
                        funcName: "{singleSettingPanelsMock}.switchPanel.applier.change",
                        args: ["{singleSettingPanelsMock}.switchPanel.model.settings.0.value", "false"]
                    }, { // Test if rendered item updated
                        spec: {path: "", priority: "last"},
                        changeEvent: "{singleSettingPanelsMock}.switchPanel.applier.modelChanged",
                        listener: "jqUnit.isVisible",
                        args: [
                            "Widgets: Switch - should have re-rendered switch value after model update",
                            "@expand:$(.flc-switchUI-off, {singleSettingPanelsMock}.switchPanel.container)"
                        ]
                    }]
                ]
            }]
        }]
    });


    fluid.defaults("gpii.tests.pcp.singleSettingPanelsMock", {
        gradeNames: "fluid.component",

        components: {
            switchPanel: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel-widgets-switch",
                options: {
                    model: {
                        settings: [switchSettingFixture]
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.tests.pcp.settingsPanelMock", {
        gradeNames: "gpii.pcp.settingsPanel",

        // XXX some dark magic
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
        gpii.tests.pcp.settingsPanelTests();
        gpii.tests.pcp.widgetsTests();
    });
})(fluid, jqUnit);
