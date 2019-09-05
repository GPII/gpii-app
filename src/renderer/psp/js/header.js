/**
 * The header component of the PSP window
 *
 * Defines the elements in the header of the PSP (the active preference set name or
 * picker if there is more than one set available), the close and key out buttons.
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

    /**
     * A component responsible for showing the active preference set name and image for the
     * currently keyed in user or a dropdown in case there are two or more available
     * preference sets. When a dropdown is shown, the selected value by default is
     * the name of the active set. If a new value is selected from the dropdown, the
     * component fires an event which notifies that an update has occurred. The
     * component also provides means for closing the PSP window.
     */
    fluid.defaults("gpii.psp.header", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            preferenceSetPicker: ".flc-prefSetPicker",
            activePreferenceSet: ".flc-activePreferenceSet",
            activePreferenceSetImage: ".flc-activePreferenceSetImage",
            activePreferenceSetName: ".flc-activePreferenceSetName",
            autosaveText: ".flc-autosaveText",
            keyOutBtn: ".flc-keyOutBtn"
        },
        model: {
            preferences: {
                sets: [],
                activeSet: null
            },
            activePreferenceSet: {},
            messages: {
                autosaveText: null,
                keyOut: null
            }
        },
        events: {
            onPreferencesUpdated: null,
            onActivePreferenceSetAltered: null,
            onKeyOut: null
        },
        modelRelay: {
            "activePreferenceSet": {
                target: "activePreferenceSet",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.header.getActivePreferenceSet",
                    args: ["{that}.model.preferences"]
                }
            }
        },
        modelListeners: {
            "preferences.activeSet": {
                funcName: "{that}.events.onActivePreferenceSetAltered.fire",
                args: ["{change}.value"],
                excludeSource: ["init", "psp.mainWindow"]
            },
            "activePreferenceSet": {
                funcName: "gpii.psp.updateActiveSetElements",
                args: ["{that}.dom.activePreferenceSetImage", "{that}.dom.activePreferenceSetName", "{change}.value"]
            },
            "messages.autosaveText": {
                this: "{that}.dom.autosaveText",
                method: "text",
                args: ["{change}.value"]
            }
        },
        components: {
            preferenceSetPicker: {
                type: "@expand:gpii.psp.getPreferenceSetPickerType({that}.model.preferences.sets)",
                container: "{that}.dom.preferenceSetPicker",
                createOnEvent: "onPreferencesUpdated",
                options: {
                    model: {
                        items: "{header}.model.preferences.sets",
                        selection: "{header}.model.preferences.activeSet"
                    },
                    attrs: {
                        "aria-label": "Preference set"
                    }
                }
            },
            keyOutBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.keyOutBtn",
                options: {
                    model: {
                        label: "{header}.model.messages.keyOut"
                    },
                    listeners: {
                        "onClick": "{header}.events.onKeyOut.fire"
                    }
                }
            }
        },
        listeners: {
            onPreferencesUpdated: {
                funcName: "gpii.psp.updateHeader",
                args: ["{that}.model.preferences.sets", "{that}.dom.preferenceSetPicker", "{that}.dom.activePreferenceSet"]
            }
        }
    });

    /**
     * Given all preference sets and the name of the active preference set, returns an
     * object representing the active preference set.
     * @param {Object} preferences - An object containing all preference set, as well as
     * information about the currently active preference set.
     * @return {Object} An object which contains the name, path, imageMap and the sound
     * for the active preference set.
     */
    gpii.psp.header.getActivePreferenceSet = function (preferences) {
        return fluid.find_if(preferences.sets, function (preferenceSet) {
            return preferenceSet.path === preferences.activeSet;
        });
    };

    /**
     * Updates the passed DOM elements which display the active preference set image and
     * name. If currently there is no active preference set (e.g. if there is no keyed-in
     * user), nothing should be displayed.
     * @param {jQuery} activeSetImageElement - A jQuery object representing the image for the
     * active preference set.
     * @param {jQuery} activeSetTextElement - A jQuery object representing the text for the
     * active preference set.
     * @param {Object} activePreferenceSet - An object representing the active preference set.
     */
    gpii.psp.updateActiveSetElements = function (activeSetImageElement, activeSetTextElement, activePreferenceSet) {
        if (activePreferenceSet) {
            activeSetImageElement.attr("src", activePreferenceSet.imageSrc || "");
            activeSetTextElement.text(activePreferenceSet.name);
        } else {
            activeSetImageElement.attr("src", "");
            activeSetTextElement.empty();
        }
    };

    /**
     * Retrieves the type for the preferenceSetPicker subcomponent. In case there
     * is more than one available preference set, the type should be a dropdown.
     * Otherwise, the component should not initialize and ignore all its config
     * properties (and hence must have an emptySubcomponent type).
     * @param {Array} preferenceSets - An array of the current preference sets.
     * @return {String} The type of the preferenceSetPicker subcomponent.
     */
    gpii.psp.getPreferenceSetPickerType = function (preferenceSets) {
        return preferenceSets.length > 1 ? "gpii.psp.widgets.imageDropdown" : "fluid.emptySubcomponent";
    };

    /**
     * Updates the DOM elements corresponding to the header component whenever new
     * preferences are received.
     * @param {Array} preferenceSets - An array containing the new preferece sets.
     * @param {jQuery} preferenceSetPickerElem - A jQuery object corresponding to the
     * preference set dropdown (in case there are multiple preference sets, it should
     * be shown, otherwise it should be hidden).
     * @param {jQuery} activePreferenceSetElem - A jQuery object corresponding to the
     * parent element which holds the preference set image and the preference set name
     * (in case there is a single preference set it should be shown, otherwise it
     * should be hidden).
     */
    gpii.psp.updateHeader = function (preferenceSets, preferenceSetPickerElem, activePreferenceSetElem) {
        if (preferenceSets.length > 1) {
            preferenceSetPickerElem.show();
            activePreferenceSetElem.hide();
        } else {
            preferenceSetPickerElem.hide();
            activePreferenceSetElem.show();
        }
    };
})(fluid);
