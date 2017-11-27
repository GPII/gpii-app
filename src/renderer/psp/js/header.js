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

    /**
     * A component responsible for showing the active preference set name for the
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
            closeBtn: ".flc-closeBtn"
        },
        model: {
            preferences: {
                sets: [],
                activeSet: null
            }
        },
        events: {
            onPreferencesUpdated: null,
            onPSPClose: null,
            onActivePreferenceSetAltered: null
        },
        modelListeners: {
            "preferences.activeSet": [{
                funcName: "{that}.events.onActivePreferenceSetAltered.fire",
                args: ["{change}.value"],
                excludeSource: ["init", "psp.mainWindow"]
            },{
                funcName: "gpii.psp.updateActiveSetElement",
                args: ["{that}.dom.activePreferenceSet", "{that}.model.preferences"]
            }]
        },
        components: {
            preferenceSetPicker: {
                type: "@expand:gpii.psp.getPreferenceSetPickerType({that}.model.preferences.sets)",
                container: "{that}.dom.preferenceSetPicker",
                createOnEvent: "onPreferencesUpdated",
                options: {
                    model: {
                        optionNames: {
                            expander: {
                                func: "fluid.getMembers",
                                args: ["{header}.model.preferences.sets", "name"]
                            }
                        },
                        optionList: {
                            expander: {
                                func: "fluid.getMembers",
                                args: ["{header}.model.preferences.sets", "path"]
                            }
                        },
                        selection: "{header}.model.preferences.activeSet"
                    },
                    listeners: {
                        "onDestroy.removeOptions": {
                            funcName: "gpii.psp.onPreferenceSetPickerDestroy",
                            args: ["{that}.container"]
                        }
                    },
                    attrs: {
                        "aria-label": "Preference set"
                    }
                }
            },
            closeBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.closeBtn",
                options: {
                    attrs: {
                        "aria-label": "Close"
                    },
                    invokers: {
                        "onClick": "{header}.events.onPSPClose.fire"
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
     * Updates the passed DOM element to contain the name of the active preference
     * set. If there is no currently active preference set (e.g. if there is no
     * keyed-in user), nothing should be displayed.
     * @param activeSetElement {jQuery} A jQuery object representing the DOM element
     * whose text is to be updated.
     * @param preferences {Object} An object containing all preference set, as well
     * as information about the currently active preference set.
     */
    gpii.psp.updateActiveSetElement = function (activeSetElement, preferences) {
        var activePreferenceSet = fluid.find_if(preferences.sets,
            function (preferenceSet) {
                return preferenceSet.path === preferences.activeSet;
            }
        );

        if (activePreferenceSet) {
            activeSetElement.text(activePreferenceSet.name);
        } else {
            activeSetElement.empty();
        }
    };

    /**
     * A function which checks if an array object holds more than one element.
     * @param arr {Array} The array to be checked.
     * @return {Boolean} Whether the array has more than one element.
     */
    gpii.psp.hasMultipleItems = function (arr) {
        return arr && arr.length > 1;
    };

    /**
     * Retrieves the type for the preferenceSetPicker subcomponent. In case there
     * is more than one available preference set, the type should be a dropdown.
     * Otherwise, the component should not initialize and ignore all its config
     * properties (and hence must have an emptySubcomponent type).
     * @param preferenceSets {Array} An array of the current preference sets.
     * @return {String} The type of the preferenceSetPicker subcomponent.
     */
    gpii.psp.getPreferenceSetPickerType = function (preferenceSets) {
        return gpii.psp.hasMultipleItems(preferenceSets) ? "gpii.psp.widgets.dropdown" : "fluid.emptySubcomponent";
    };

    /**
     * Updates the DOM elements corresponding to the header component whenever new
     * preferences are received.
     * @param preferenceSets {Array} An array containing the new preferece sets.
     * @param preferenceSetPickerElem {jQuery} A jQuery object corresponding to the
     * preference set dropdown (in case there are multiple preference sets, it should
     * be shown, otherwise it should be hidden).
     * @param activePreferenceSetElem {jQuery} A jQuery object corresponding to the
     * preference set label (in case there is a single preference set it should be
     * show, otherwise it should be hidden).
     */
    gpii.psp.updateHeader = function (preferenceSets, preferenceSetPickerElem, activePreferenceSetElem) {
        if (gpii.psp.hasMultipleItems(preferenceSets)) {
            preferenceSetPickerElem.show();
            activePreferenceSetElem.hide();
        } else {
            preferenceSetPickerElem.hide();
            activePreferenceSetElem.show();
        }
    };

    /**
     * A listener which is invoked whenever the preference set picker component is
     * destroyed. This function simply removes all options for the dropdown (actually
     * represented as a <select> element) from the DOM.
     * @param container {jQuery} A jQuery object representing the parent container
     * of the preference set picker.
     */
    gpii.psp.onPreferenceSetPickerDestroy = function (container) {
        container.find("option").remove();
    };
})(fluid);
