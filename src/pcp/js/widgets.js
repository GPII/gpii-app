/*

Copyright 2013-2017 OCAD University



Licensed under the Educational Community License (ECL), Version 2.0 or the New

BSD license. You may not use this file except in compliance with one these

Licenses.



You may obtain a copy of the ECL 2.0 License and BSD License at

https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt

*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.pcp.widgets");

    gpii.pcp.widgets.noop = function () {
        // A function that does nothing.
    };

    // TODO handle empty array (add expander)
    fluid.defaults("gpii.pcp.widgets.dropdown", {
        gradeNames: "fluid.rendererComponent",
        model: {
            optionNames: [],
            optionList: [],
            selection: null
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
        renderOnInit: true
    });

    fluid.defaults("gpii.pcp.widgets.button", {
        gradeNames: ["fluid.viewComponent"],
        label: null,
        selectors: {
            label: ".fl-btnLabel"
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
            },
            "onCreate.initText": {
                "this": "{that}.dom.label",
                method: "text",
                args: ["{that}.options.label"]
            }
        },
        invokers: {
            onClick: {
                funcName: "gpii.pcp.noop"
            }
        }
    });

    fluid.defaults("gpii.pcp.widgets.textfield", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            input: ".flc-textfieldInput"
        },
        components: {
            textfield: {
                type: "fluid.textfield",
                container: "{that}.dom.input",
                options: {
                    model: "{gpii.pcp.widgets.textfield}.model"
                }
            }
        }
    });

    fluid.defaults("gpii.pcp.widgets.switch", {
        gradeNames: ["fluid.switchUI"],
        mergePolicy: {
            "modelListeners.enabled": "replace"
        },
        strings: {
            on: "On",
            off: "Off"
        },
        attrs: {
            role: "button"
        },
        modelListeners: {
            enabled: {
                funcName: "gpii.pcp.widgets.onSwitchChange",
                args: [
                    "{change}.value",
                    "{that}.dom.control",
                    "{that}.dom.on",
                    "{that}.dom.off"
                ]
            }
        }
    });

    /**
     * A listener which is called whenever the model related to a switch UI component
     * changes. It takes case of setting the "aria-pressed" attibute of the element,
     * as well as of showing/hiding the appropriate "On" or "Off" label.
     * @param enabled {Boolean} Whether the switch is in an enabled state or not.
     * @param control {Object} A jQuery object representing the control element of the
     * switch component
     * @param onLabel {Object} A jQuery object representing the associated "On" label.
     * @param offLabel {Object} A jQuery object representing the associated "Off" label.
     */
    gpii.pcp.widgets.onSwitchChange = function (enabled, control, onLabel, offLabel) {
        control.attr("aria-pressed", enabled);

        if (enabled) {
            onLabel.show();
            offLabel.hide();
        } else {
            onLabel.hide();
            offLabel.show();
        }
    };

    /**
     * A function which is executed while the user is dragging the
     * thumb of a slider.
     * @param that {Component} An instance of a slider component.
     * @param container {Object} The jQuery object representing the
     * slider input.
     */
    gpii.pcp.widgets.onSlide = function (that, container) {
        var value = container.val();
        that.applier.change("stringValue", value, null, "slide");
    };

    fluid.defaults("gpii.pcp.widgets.slider", {
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
                            funcName: "gpii.pcp.widgets.onSlide",
                            args: ["{that}", "{that}.container"]
                        },
                        onSlideEnd: {
                            changePath: "number",
                            value: "{that}.model.value"
                        }
                    }
                }
            }
        }
    });

    /**
     * The `stepper` has two important model properties: `number` and
     * `value`. `number` is the actual value that this input represents.
     * `value` represents a temporary state which may not always be the
     * same as `number` (e.g. while the user is dragging the thumb of the
     * slider, `value` changes continuously while `number` changes only
     * when the user releases the thumb). This means that `number` should
     * be used if changes to the actual model value should be observed from
     * outer components.
     */
    fluid.defaults("gpii.pcp.widgets.stepper", {
        gradeNames: ["fluid.textfieldStepper"],
        scale: 1,
        modelRelay: {
            "value": {
                target: "value",
                singleTransform: {
                    type: "fluid.transforms.identity",
                    input: "{that}.model.number"
                }
            }
        },
        modelListeners: {
            "value": {
                changePath: "number",
                value: "{change}.value",
                excludeSource: ["init", "slide"]
            }
        },
        components: {
            slider: {
                type: "gpii.pcp.widgets.slider",
                container: "{that}.container",
                options: {
                    model: "{stepper}.model",
                    scale: "{stepper}.options.scale",
                    selectors: {
                        textfield: ".flc-textfieldStepper-field"
                    }
                }
            },
            textfield: {
                options: {
                    model: "{stepper}.model"
                }
            }
        }
    });

    fluid.defaults("gpii.pcp.widgets.multipicker", {
        gradeNames: ["fluid.rendererComponent"],
        model: {
            values: [],
            names: [],
            value: null
        },
        attrs: {
            // it is mandatory to specify "name" here!
        },
        selectors: {
            item: ".flc-multipickerItem",
            input: ".flc-multipickerInput",
            label: ".flc-multipickerLabel"
        },
        repeatingSelectors: ["item"],
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
        renderOnInit: true
    });
})(fluid);
