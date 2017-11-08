/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.pcp");


    /**
     * Represents an "exemplar" (configuration) for a somehow dynamic component.
     * A good place to keep a *related template resource* path.
     */
    fluid.defaults("gpii.pcp.exemplar", {
        gradeNames: "fluid.component",
        /*
         * We want to be able to pass unexpanded IoC expressions, which to be
         * processed by the user of the exemplar
         */
        mergePolicy: {
            widgetOptions: "noexpand"
        },

        grade: null,            // the grade of the dynamic component as string

        resourceDir:  "./html", // a "home" dir for the desired resources
        resourceName: null,     // filename of the resource;
        template: {             // the whole resource path
            expander: {
                funcName: "fluid.stringTemplate",
                args: [
                    "%resourceDir/%resourceName",
                    {
                        resourceDir:  "{that}.options.resourceDir",
                        resourceName: "{that}.options.resourceName"
                    }
                ]
            }
        },
        /*
         * Options regarding Widget Exemplars.
         */
        schemaType: null,       // schema type of the widget;
        widgetOptions: {        // options for the widget
            model: null         // model binding options   (IoC string)
            // rawAttrs: null   // computed widget options (IoC string)
        }
    });

    fluid.defaults("gpii.pcp.exemplar.settingsVisualizer", {
        gradeNames: "gpii.pcp.exemplar",

        resourceName: "settingRow.html",
        grade: "gpii.pcp.settingsVisualizer"
    });

    fluid.defaults("gpii.pcp.exemplar.multipicker", {
        gradeNames: "gpii.pcp.exemplar",
        resourceName: "multipicker.html",
        grade: "gpii.pcp.widgets.multipicker",
        schemaType: "array",
        widgetOptions: {
            model: {
                values: "{settingPresenter}.model.schema.enum",
                names: "{settingPresenter}.model.schema.enum",
                value: "{settingPresenter}.model.value"
            },
            rawAttrs: {
                "aria-labelledby": "{settingPresenter}.model.path",
                name: "{settingPresenter}.model.path"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.switch", {
        gradeNames: "gpii.pcp.exemplar",
        resourceName: "switch.html",
        grade: "gpii.pcp.widgets.switch",
        schemaType: "boolean",
        widgetOptions: {
            model: {
                name: "{settingPresenter}.model.path",
                enabled: "{settingPresenter}.model.value"
            },
            rawAttrs: {
                "aria-labelledby": "{settingPresenter}.model.path"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.dropdown", {
        gradeNames: "gpii.pcp.exemplar",
        resourceName: "dropdown.html",
        grade: "gpii.pcp.widgets.dropdown",
        schemaType: "string",
        widgetOptions: {
            model: {
                optionNames: "{settingPresenter}.model.schema.enum",
                optionList: "{settingPresenter}.model.schema.enum",
                selection: "{settingPresenter}.model.value"
            },
            rawAttrs: {
                "aria-labelledby": "{settingPresenter}.model.path"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.stepper", {
        gradeNames: "gpii.pcp.exemplar",
        resourceName: "stepper.html",
        grade: "gpii.pcp.widgets.stepper",
        schemaType: "number",
        widgetOptions: {
            model: {
                number: "{settingPresenter}.model.value",
                step: "{settingPresenter}.model.schema.divisibleBy",
                range: {
                    min: "{settingPresenter}.model.schema.min",
                    max: "{settingPresenter}.model.schema.max"
                }
            },
            rawAttrs: {
                "aria-labelledby": "{settingPresenter}.model.path"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.textfield", {
        gradeNames: "gpii.pcp.exemplar",
        resourceName: "textfield.html",
        grade: "gpii.pcp.widgets.textfield",
        schemaType: "text",
        widgetOptions: {
            model: {
                value: "{settingPresenter}.model.value"
            },
            rawAttrs: {
                "aria-labelledby": "{settingPresenter}.model.path"
            }
        }
    });

    /**
     * Represents an container for all exemplars for widgets
     * N.B. Sub components should be used as immutable objects!
     */
    fluid.defaults("gpii.pcp.widgetExemplars", {
        gradeNames: "fluid.component",
        components: {
            multipicker: {
                type: "gpii.pcp.exemplar.multipicker"
            },
            switch: {
                type: "gpii.pcp.exemplar.switch"
            },
            dropdown: {
                type: "gpii.pcp.exemplar.dropdown"
            },
            stepper: {
                type: "gpii.pcp.exemplar.stepper"
            },
            textfield: {
                type: "gpii.pcp.exemplar.textfield"
            }
        },
        invokers: {
            getExemplarBySchemaType: {
                funcName: "gpii.pcp.widgetExemplars.getExemplarBySchemaType",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });


    /**
     * Returns `gpii.pcp.exemplar` object for given schema (PCP channel type) type
     * @param widgetExemplars {Object} The `gpii.pcp.widgetExemplar` object
     * @param schemaType {String}
     * @returns {Object} The matching `gpii.pcp.exemplar` object
     */
    gpii.pcp.widgetExemplars.getExemplarBySchemaType = function (widgetExemplars, schemaType) {
        return fluid.values(widgetExemplars)
            .filter(fluid.isComponent)
            .find(function matchType(exemplar) { return exemplar.options.schemaType === schemaType; });
    };
})(fluid);
