/**
 * Defines a `focusManager` component for the QSS
 *
 * A focus manager which enables navigation between the various focusable elements
 * using (Shift +) Tab and all arrow keys.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid jQuery */

"use strict";
(function (fluid, jQuery) {
    var gpii = fluid.registerNamespace("gpii");

    /**
     * A special type of focusManager which enables navigation between the focusable
     * elements using Tab, Shift + Tab, Arrow Up, Arrow Down, Arrow Left and the
     * Arrow Right key. The navigation focus basically moves in the visual direction.
     */
    fluid.defaults("gpii.qss.qssFocusManager", {
        gradeNames: ["gpii.qss.horizontalFocusManager", "gpii.qss.verticalFocusManager"],
        listeners: {
            "onArrowUpPressed.impl": {
                func: "fluid.identity"
            },
            "onArrowDownPressed.impl": {
                func: "fluid.identity"
            },
            "onArrowLeftPressed.impl": {
                func: "fluid.identity"
            },
            "onArrowRightPressed.impl": {
                func: "fluid.identity"
            }
        },
        invokers: {
            getFocusInfo: {
                funcName: "gpii.qss.qssFocusManager.getFocusInfo",
                args: ["{that}.container", "{that}.options.styles"]
            }
        }
    });

    /**
     * Retrieves the tab index of a given DOM or jQuery element as a number.
     * @param {DOMElement | jQuery} element - A simple DOM element or wrapped in a jQuery
     * object.
     * @return {Number} The tab index of the given element or `undefined` if this property
     * is not specified.
     */
    gpii.qss.qssFocusManager.getTabIndex = function (element) {
        var tabIndex = jQuery(element).attr("tabindex");
        if (tabIndex) {
            return parseInt(tabIndex, 10);
        }
    };

    /**
     * Returns information about the focusable elements in the QSS as well as the index of
     * the currently focused element. "Focusable element" in terms of the QSS means an element
     * with a "fl-focusable" class which has a specified `tabindex` greater than or equal to 0.
     * The focusable elements are returned sorted ascendingly by their tab index.
     * @param {jQuery} container - The jQuery element representing the container in which this
     * focus manager handles focus.
     * @param {Object} styles - A styles object containing various classes related to focusing
     * of elements
     * @return {Object} Information about the focusable elements.
     */
    gpii.qss.qssFocusManager.getFocusInfo = function (container, styles) {
        var focusableElements =
            container
                .find("." + styles.focusable + ":visible")
                .filter(function () {
                    var tabindex = gpii.qss.qssFocusManager.getTabIndex(this);
                    return tabindex >= 0;
                })
                .sort(function (left, right) {
                    var leftTabIndex = gpii.qss.qssFocusManager.getTabIndex(left),
                        rightTabIndex = gpii.qss.qssFocusManager.getTabIndex(right);
                    return leftTabIndex - rightTabIndex;
                }),
            focusedElement = container.find("." + styles.focused)[0],
            focusIndex = -1;

        if (focusedElement) {
            focusIndex = jQuery.inArray(focusedElement, focusableElements);
        }

        return {
            focusableElements: focusableElements,
            focusIndex: focusIndex
        };
    };
})(fluid, jQuery);
