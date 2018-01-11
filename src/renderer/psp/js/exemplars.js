/**
 * Exemplars for all PSP settings' widgets
 *
 * Contains the definition of a base exemplar component (i.e. a configuration for a
 * widget) and the particular extensions of that component (i.e. the various widgets).
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.psp");


    /**
     * Represents an "exemplar" (configuration) for a somehow dynamic component.
     * A good place to keep a *related template resource* path.
     */
    fluid.defaults("gpii.psp.exemplar", {
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

    fluid.defaults("gpii.psp.exemplar.settingsVisualizer", {
        gradeNames: "gpii.psp.exemplar",

        resourceName: "settingRow.html",
        grade: "gpii.psp.settingsVisualizer"
    });

    fluid.defaults("gpii.psp.exemplar.multipicker", {
        gradeNames: "gpii.psp.exemplar",
        resourceName: "multipicker.html",
        grade: "gpii.psp.widgets.multipicker",
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

    fluid.defaults("gpii.psp.exemplar.switch", {
        gradeNames: "gpii.psp.exemplar",
        resourceName: "switch.html",
        grade: "gpii.psp.widgets.switch",
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

    fluid.defaults("gpii.psp.exemplar.dropdown", {
        gradeNames: "gpii.psp.exemplar",
        resourceName: "dropdown.html",
        grade: "gpii.psp.widgets.dropdown",
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

    fluid.defaults("gpii.psp.exemplar.stepper", {
        gradeNames: "gpii.psp.exemplar",
        resourceName: "stepper.html",
        grade: "gpii.psp.widgets.stepper",
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

    fluid.defaults("gpii.psp.exemplar.textfield", {
        gradeNames: "gpii.psp.exemplar",
        resourceName: "textfield.html",
        grade: "gpii.psp.widgets.textfield",
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
    fluid.defaults("gpii.psp.widgetExemplars", {
        gradeNames: "fluid.component",
        components: {
            multipicker: {
                type: "gpii.psp.exemplar.multipicker"
            },
            switch: {
                type: "gpii.psp.exemplar.switch"
            },
            dropdown: {
                type: "gpii.psp.exemplar.dropdown"
            },
            stepper: {
                type: "gpii.psp.exemplar.stepper"
            },
            textfield: {
                type: "gpii.psp.exemplar.textfield"
            }
        },
        invokers: {
            getExemplarBySchemaType: {
                funcName: "gpii.psp.widgetExemplars.getExemplarBySchemaType",
                args: [
                    "{that}",
                    "{arguments}.0" // schemaType
                ]
            }
        }
    });


    /**
     * Returns `gpii.psp.exemplar` object for given schema (PSP channel type) type
     * @param widgetExemplars {Object} The `gpii.psp.widgetExemplar` object
     * @param schemaType {String}
     * @returns {Object} The matching `gpii.psp.exemplar` object
     */
    gpii.psp.widgetExemplars.getExemplarBySchemaType = function (widgetExemplars, schemaType) {
        return fluid.values(widgetExemplars)
            .filter(fluid.isComponent)
            .find(function matchType(exemplar) { return exemplar.options.schemaType === schemaType; });
    };
})(fluid);
