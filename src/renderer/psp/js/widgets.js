/**
 * Widgets for visualizing user settings
 *
 * Contains components representing the available widgets in the PSP.
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

    fluid.registerNamespace("gpii.psp.widgets");

    /**
     * XXX currently, we abuse a misbehavior of expanding the `model` options, even if there's been expansion
     * Manual expansion of the attrs is needed, as this "misbehaviour" only applies for the `model`
     */
    fluid.defaults("gpii.psp.widgets.attrsExpander", {
        gradeName: "fluid.component",

        // in case property is not passed, ensure
        // it has won't affect the merged `attrs` property
        rawAttrs: {},

        // Currently if the used IoC expression string is passed directly to the `attrs`
        // (see `gpii.psp.settingsPresenter` under the `widget` subcomponent), the expression
        // is left unexpanded, thus resulting in improper `attrs` state.
        // Ensure `attrs` receives expanded options properly through the `rawAttrs` property
        // before merging takes place (FLUID-6219)
        distributeOptions: {
            target: "{that}.options.attrs",
            record: "@expand:fluid.expandOptions({that}.options.rawAttrs, {that})"
        }
    });

    fluid.defaults("gpii.psp.widgets.dropdown", {
        gradeNames: ["gpii.psp.widgets.attrsExpander", "fluid.rendererComponent"],
        model: {
            optionNames: [],
            optionList: [],
            selection: null
        },
        modelListeners: {
            "": {
                this: "{that}",
                method: "refreshView",
                excludeSource: "init"
            }
        },
        attrs: {
            //"aria-labelledby": null
        },
        selectors: {
            options: ".flc-dropdown-options"
        },
        protoTree: {
            options: {
                optionnames: "${optionNames}",
                optionlist: "${optionList}",
                selection: "${selection}"
            }
        },
        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.dom.options",
                method: "attr",
                args: ["{that}.options.attrs"]
            }
        },
        renderOnInit: true
    });

    fluid.defaults("gpii.psp.widgets.button", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            label: null // Expected from implementor
        },

        selectors: {
            label: ".flc-btnLabel"
        },
        attrs: {
            // user provided attributes
        },
        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },
            "onCreate.bindClickEvt": {
                "this": "{that}.container",
                method: "click",
                args: ["{that}.onClick"]
            }
        },
        modelListeners: {
            label: {
                "this": "{that}.dom.label",
                method: "text",
                args: ["{that}.model.label"]
            }
        },
        invokers: {
            onClick: {
                funcName: "fluid.notImplemented"
            }
        }
    });

    fluid.defaults("gpii.psp.widgets.textfield", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.widgets.attrsExpander"],
        selectors: {
            input: ".flc-textfieldInput"
        },
        attrs: {
            "aria-labelledby": "{that}.model.path"
        },
        components: {
            textfield: {
                type: "fluid.textfield",
                container: "{that}.dom.input",
                options: {
                    model: "{gpii.psp.widgets.textfield}.model",
                    attrs: "{gpii.psp.widgets.textfield}.options.attrs"
                }
            }
        }
    });

    fluid.defaults("gpii.psp.widgets.switch", {
        gradeNames: ["fluid.switchUI", "gpii.psp.widgets.attrsExpander"],
        attrs: {
            // "aria-labelledby": null
        },
        strings: {
            on: "On",
            off: "Off"
        }
    });

    /**
     * A function which is executed while the user is dragging the
     * thumb of a slider.
     * @param that {Component} An instance of a slider component.
     * @param container {jQuery} The jQuery object representing the
     * slider input.
     */
    gpii.psp.widgets.onSlide = function (that, container) {
        var value = container.val();
        that.applier.change("stringValue", value, null, "slide");
    };

    // Not used currently. Remove it if it won't be used in the future.
    fluid.defaults("gpii.psp.widgets.slider", {
        gradeNames: ["fluid.textfieldSlider"],
        components: {
            slider: {
                options: {
                    listeners: {
                        "onCreate.bindSlideEvt": {
                            "this": "{that}.container",
                            "method": "on",
                            "args": ["input", "{that}.onSlide"]
                        },
                        "onCreate.bindRangeChangeEvt": {
                            "this": "{that}.container",
                            "method": "on",
                            "args": ["change", "{that}.onSlideEnd"]
                        }
                    },
                    invokers: {
                        onSlide: {
                            funcName: "gpii.psp.widgets.onSlide",
                            args: ["{that}", "{that}.container"]
                        },
                        onSlideEnd: {
                            changePath: "value",
                            value: "{that}.model.value"
                        }
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.psp.widgets.stepper", {
        gradeNames: ["gpii.psp.widgets.attrsExpander", "fluid.textfieldStepper"],
        scale: 2,
        attrs: {
            // "aria-labelledby": null
        },
        components: {
            textfield: {
                options: {
                    model: "{stepper}.model"
                }
            }
        }
    });

    fluid.defaults("gpii.psp.widgets.multipicker", {
        gradeNames: ["fluid.rendererComponent", "gpii.psp.widgets.attrsExpander"],
        model: {
            values: [],
            names: [],
            value: null
        },
        modelListeners: {
            "": {
                this: "{that}",
                method: "refreshView",
                excludeSource: "init"
            }
        },
        attrs: {
            // "aria-labelledby": null
            // name: null
        },
        selectors: {
            inputGroup: ".flc-multipicker",
            item: ".flc-multipickerItem",
            input: ".flc-multipickerInput",
            label: ".flc-multipickerLabel"
        },
        repeatingSelectors: ["item"],
        selectorsToIgnore: ["inputGroup"],
        protoTree: {
            expander: {
                type: "fluid.renderer.selection.inputs",
                rowID: "item",
                inputID: "input",
                labelID: "label",
                selectID: "{that}.options.attrs.name",
                tree: {
                    optionnames: "${names}",
                    optionlist: "${values}",
                    selection: "${value}"
                }
            }
        },
        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.dom.inputGroup",
                method: "attr",
                // may apply additional unused attributes
                args: ["{that}.options.attrs"]
            }
        },
        renderOnInit: true
    });
})(fluid);
