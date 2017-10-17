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

    /* TODO
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
    }, {
        path: "invertColorsPath",
        type: "boolean",
        title: "Invert colors",
        description: "Invert colors description",
        icon: "../../../icons/gear-cloud-black.png",
        value: true,
        isPersisted: true
    }, {
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
            $(containerClass).empty()
        );
    };


    fluid.defaults("gpii.tests.pcp.settingsPanelTests", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            settingsPanelMock: {
                type: "gpii.tests.pcp.settingsPanelMock",
                // TODO find better name
                container: ".flc-settingsPanel1"
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
        // TODO doc
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

            widgetCheckersMap[setting[idx].type](
                settingContainers[idx],
                setting[idx]
            );

        });
    };

    gpii.tests.pcp.testSettingPanelConstruction = function (settingsPanel) {
        // should have all resources loaded - n + 1 (exemplars count)
        //
        // should have n setting components
        // ev. setting -> setting-idx
        // settingVisualizer[i].model === ?
        // settingPresentation[i].model === setting[i]
        //
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
        // TODO use with different fixtures
        // model: { settings },
        gradeNames: "fluid.test.testCaseHolder",
        modules: [{
            name: "Test PCP SettingsPanel",
            //TODO
            tests: [{
                // Test all components construction
                name: "Test components constucted properly",
                expect: 14,
                sequence: [{
                    event: "{settingsPanelMock settingsVisualizer}.events.onCreate",
                    listener: "gpii.tests.pcp.testSettingPanelConstruction",
                    args: "{settingsPanel}"
                    // }, {
                    //     // check if IRC is notified
                }
                ]
            }, {
                // Test all visible markup
                name: "Test elements rendered properly",
                expect: 33,
                sequence: [{
                    event: "{settingsPanelMock settingsVisualizer}.events.onCreate",
                    func: "gpii.tests.pcp.testSettingsRendered",
                    args: [".flc-settingsPanel1", allSettingTypesFixture]
                }, {
                    // XXX separate component
                    func: "{settingsPanelMock}.destroy"
                }, { // Dom cleared with component destruction
                    event: "{settingsPanelMock}.events.onDestroy",
                    listener: "gpii.tests.pcp.utils.testContainerEmpty",
                    args: ".flc-settingsPanel1"
                }]
          //  }, {
          //      name: "Test mixed functionality",
          //      expect: 15,
          //      sequence: [
          //          { // simulate setting from pcp update
          //              event: "{settingsPanelMock}.events.onCreate",
          //              funcName: "{settingsPanelMock}.applier.change",
          //              args: ["{settingsPanelMock}.model.settings.0", "c"]
          //          }, {
          //              // Test some if rendered item updated
          //          }
          //      ]

                //     // Test combined elements
                //     // * update val from dom
                //     //   * button.click
                //     //   * onSettingAltered
                //     // * update val from model
                //     //   * check rendered
            }]
        }]
    });

    fluid.defaults("gpii.tests.pcp.settingsPanelMock", {
        gradeNames: "gpii.pcp.settingsPanel",

        // XXX some dark magic
        distributeOptions: {
            record: "../../html",
            target: "{/ exemplar}.options.resourceDir"
        },

        model: {
            settings: allSettingTypesFixture
        }
    });

    $(document).ready(function () {
        gpii.tests.pcp.settingsPanelTests();
    });
})(fluid, jqUnit);
