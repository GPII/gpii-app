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
     * dynamic flag is shown
     * title is shown
     * on click handler is triggered
     * icon is shown
     * m flag is shown
     */

    var allSettingsFixutre = [ {
        path: "settingOnePath",
        type: "string",
        values: ["a", "b", "c", "d"],
        title: "Setting one title",
        description: "Setting one description",
        // TODO
        icon: "../../../icons/gear-cloud-black.png",
        value: "b"
    }, {
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
        value: ""
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

    /*
     * Pattern followed:
     *  * gpii.tests.pcp
     */



    fluid.defaults("gpii.tests.pcp.settingsPanelTests", {
        gradeNames: ["fluid.test.testEnvironment"],
        components: {
            settingsPanelMock: {
                type: "gpii.tests.pcp.settingsPanelMock",
                container: ".flc-settingsPanel1"
            },
            settingsPanelTester: {
                type: "gpii.tests.pcp.settingsPanelTester",
                priority: "after:settingsPanelMock"
            }
        }
    });

    fluid.registerNamespace("gpii.tests.pcp.utils");

    gpii.tests.pcp.utils.getSubcomponents = function (component) {
        return fluid.values(component)
            .filter(fluid.isComponent);
    };

    gpii.tests.pcp.checkRenderedSettingsCount = function (panel) {
        jqUnit.assertEquals("SettingsPanel should have valid number of subcomponents",
            allSettingsFixutre.length,
            gpii.tests.pcp.utils.getSubcomponents(panel.settingsVisualizer).length
        );
    };

    fluid.defaults("gpii.tests.pcp.settingsPanelTester", {
        gradeNames: "fluid.test.testCaseHolder",
        modules: [{
            name: "Test PCP SettingsPanel",
            tests: [{
                name: "Test elements initialisation",
                expect: 1,
                sequence: [{
                    event: "{settingsPanelMock settingsVisualizer}.events.onCreate",
                    listener: "gpii.tests.pcp.checkRenderedSettingsCount",
                    args: "{settingsPanel}"
                }]
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
            settings: allSettingsFixutre
        }
    });

    $(document).ready(function () {
        var x = gpii.tests.pcp.settingsPanelTests();
        console.log(x, x.settingsPanelMock.resourcesLoader);
    });
})(fluid, jqUnit);
