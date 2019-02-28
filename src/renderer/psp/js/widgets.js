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

    fluid.defaults("gpii.psp.widgets.imageDropdownPresenter", {
        gradeNames: "fluid.viewComponent",

        selectors: {
            itemImage: ".flc-imageDropdown-itemImage",
            itemText: ".flc-imageDropdown-itemText"
        },

        styles: {
            active: "active"
        },

        model: {
            item: {}
        },

        listeners: {
            "onCreate.addClickHandler": {
                this: "{that}.container",
                method: "click",
                args: "{that}.updateSelection"
            }
        },

        modelListeners: {
            "item.name": {
                this: "{that}.dom.itemText",
                method: "text",
                args: ["{change}.value"]
            },
            "item.imageSrc": {
                this: "{that}.dom.itemImage",
                method: "attr",
                args: ["src", "{change}.value"]
            },
            "{imageDropdown}.model.selection": {
                funcName: "gpii.psp.widgets.imageDropdownPresenter.applyStyles",
                args: ["{change}.value", "{that}.model.item", "{that}.container", "{that}.options.styles"]
            }
        },

        invokers: {
            updateSelection: {
                this: "{dropdownItems}",
                method: "updateSelection",
                args: ["{that}.model.item"]
            }
        }
    });

    /**
     * Applies the appropriate styles depending on whether the item is
     * the selected item for the dropdown.
     * @param {String} selection - The path of the selected item.
     * @param {Object} item - The current image dropdown item.
     * @param {jQuery} container - The DOM element representing the item.
     * @param {Object} styles - A hash containing mapping between CSS class
     * keys and class names.
     */
    gpii.psp.widgets.imageDropdownPresenter.applyStyles = function (selection, item, container, styles) {
        container.toggleClass(styles.active, item.path === selection);
    };

    /**
     * A component which represents a dropdown whose elements have both an
     * image (not mandatory) and text. As the `options` elements within a
     * `select` tag does not support images, this component uses the custom
     * dropdown mechanism provided by bootstrap. The component expects to
     * be provided with an `items` array whose elements will be visually
     * represented in the dropdown. Each item must have a `path` property
     * which should uniquely identify the item and a `name` property which
     * is the text to be displayed to the user. As already mentioned, the
     * `imageSrc` property which is the URL of the image to be used in not
     * obligatory. The `selection` model property is the path of the
     * currently selected item in the image dropdown. It will be updated
     * based on the user input (and of course based on the data with which
     * the component is initialized).
     */
    fluid.defaults("gpii.psp.widgets.imageDropdown", {
        gradeNames: ["gpii.psp.widgets.attrsExpander", "fluid.viewComponent"],

        model: {
            items: [],
            selection: null,
            selectedItem: {}
        },

        modelListeners: {
            selectedItem: {
                funcName: "gpii.psp.widgets.imageDropdown.updateDropdownHeader",
                args: [
                    "{that}.dom.selectedItemImage",
                    "{that}.dom.selectedItemText",
                    "{change}.value"
                ]
            },
            items: {
                this: "{that}.events.onItemsChanged",
                method: "fire"
            }
        },

        modelRelay: {
            "selectedItem": {
                target: "selectedItem",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.widgets.imageDropdown.getSelectedItem",
                    args: ["{that}.model.items", "{that}.model.selection"]
                }
            }
        },

        selectors: {
            selectedItemImage: ".flc-imageDropdown-selectedItemImage",
            selectedItemText: ".flc-imageDropdown-selectedItemText",
            dropdownMenu: ".flc-imageDropdown-menu"
        },

        events: {
            onItemsChanged: null
        },

        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },
            // Needed because the `dropdownItems` subcomponent will not be created
            // if the `imageDropdown` component has `items` provided initially.
            "onCreate.notifyItemsChanged": {
                func: "{that}.events.onItemsChanged.fire"
            }
        },

        components: {
            dropdownItems: {
                type: "gpii.psp.repeater",
                createOnEvent: "onItemsChanged",
                container: "{that}.dom.dropdownMenu",
                options: {
                    model: {
                        items: "{imageDropdown}.model.items",
                        selection: "{imageDropdown}.model.selection"
                    },
                    dynamicContainerMarkup: {
                        container: "<li class=\"%containerClass\"></li>",
                        containerClassPrefix: "flc-imageDropdown-item"
                    },
                    handlerType: "gpii.psp.widgets.imageDropdownPresenter",
                    markup: {
                        dropdownItem:
                            "<a href=\"#\">" +
                                "<img class=\"flc-imageDropdown-itemImage\">" +
                                "<span class=\"flc-imageDropdown-itemText\"></span>" +
                            "</a>"
                    },
                    invokers: {
                        getMarkup: {
                            funcName: "fluid.identity",
                            args: ["{that}.options.markup.dropdownItem"]
                        },
                        updateSelection: {
                            changePath: "selection",
                            value: "{arguments}.0.path"
                        }
                    }
                }
            }
        }
    });

    /**
     * Given the array of available items and the `path` of the currently selected
     * item, returns the object representing the selected item.
     * @param {Array} items - The array of items which are visualized in the image
     * dropdown.
     * @param {String} selection - The `path` of the currently selected item.
     * @return {Object} The currently selected item object.
     */
    gpii.psp.widgets.imageDropdown.getSelectedItem = function (items, selection) {
        return fluid.find_if(items, function (item) {
            return item.path === selection;
        });
    };

    /**
     * Updates the header of the image dropdown based on the selected item by
     * setting the appropriate image source and text.
     * @param {jQuery} selectedItemImage - A jQuery object representing the image of
     * the selected dropdown item.
     * @param {jQuery} selectedItemText - A jQuery object representing the text of
     * the selected dropdown item.
     * @param {Object} selectedItem - The currently selected item object.
     */
    gpii.psp.widgets.imageDropdown.updateDropdownHeader = function (selectedItemImage, selectedItemText, selectedItem) {
        var itemImageSrc = fluid.get(selectedItem, "imageSrc") || "",
            itemText = fluid.get(selectedItem, "name") || "";

        selectedItemImage.attr("src", itemImageSrc);
        selectedItemText.text(itemText);
    };

    fluid.defaults("gpii.psp.widgets.button", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            label: null // Expected from implementor
        },

        selectors: {
            label: ".flc-btnLabel"
        },
        attrs: {
            "aria-label": "{button}.model.decButtonLabel"
            // user provided attributes
        },
        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },
            "onCreate.addClickHandler": {
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
                funcName: "fluid.identity"
            }
        }
    });

    fluid.defaults("gpii.psp.widgets.alert", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            label: null // Expected from implementor
        },
        selectors: {
            label: ".flc-alertLabel"
        },
        attrs: { },
        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            }
        },
        modelListeners: {
            label: {
                "this": "{that}.dom.label",
                method: "text",
                args: ["{that}.model.label"]
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
        gradeNames: ["fluid.switchUI", "gpii.psp.widgets.attrsExpander", "gpii.psp.selectorsTextRenderer"],
        attrs: {
            // "aria-labelledby": null
        },
        model: {
            messages: {
                on: null,
                off: null
            }
        },
        listeners: {
            // Override the mechanism of switchUI for setting the On/Off labels
            "onCreate.addOnText": {
                funcName: "fluid.identity"
            },
            "onCreate.addOffText": {
                funcName: "fluid.identity"
            },
            // Remove the handlers which detect activation of the component using Spacebar and Enter.
            // Useful when the same DOM element will be used again (e.g. in the QSS toggle menu).
            "onDestroy.removeElementListeners": {
                this: "{that}.dom.control",
                method: "off",
                args: ["fluid-activate"]
            }
        }
    });

    /**
     * A function which is executed while the user is dragging the
     * thumb of a slider.
     * @param {Component} that - An instance of a slider component.
     * @param {jQuery} container - The jQuery object representing the
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
