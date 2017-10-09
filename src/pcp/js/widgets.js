"use strict";
(function () {
    var fluid = window.fluid,
        gpii = fluid.registerNamespace("gpii");

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
        listeners: {
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
        gradeNames: ["fluid.textfield"]
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

    fluid.defaults("gpii.pcp.widgets.slider", {
        gradeNames: ["fluid.textfieldSlider"],
        components: {
            slider: {
                options: {
                    listeners: {
                        // XXX: This is needed in order not to update the model too frequently.
                        // However, the value of the textfield is not updated until the slider
                        // is released which may not be desired. Need to create a wrapper which
                        // will update the textfield as the slider is moved and to propagate
                        // model changes only when the slider is released.
                        "onCreate.bindSlideEvt": {
                            funcName: "gpii.pcp.widgets.noop"
                        }
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.pcp.widgets.stepper", {
        gradeNames: ["fluid.textfieldStepper"],
        scale: 1,
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
})();
