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

        maxElementsPerFocusGroup: 2,

        styles: {
            smallButton: "fl-qss-smallButton"
        },

        listeners: {
            "onArrowUpPressed.impl": {
                funcName: "gpii.qss.qssFocusManager.onArrowUpPressed",
                args: ["{that}"]
            },
            "onArrowDownPressed.impl": {
                funcName: "gpii.qss.qssFocusManager.onArrowDownPressed",
                args: ["{that}"]
            },
            "onArrowLeftPressed.impl": {
                funcName: "gpii.qss.qssFocusManager.onArrowLeftPressed",
                args: ["{that}"]
            },
            "onArrowRightPressed.impl": {
                funcName: "gpii.qss.qssFocusManager.onArrowRightPressed",
                args: ["{that}"]
            }
        },

        invokers: {
            getFocusInfo: {
                funcName: "gpii.qss.qssFocusManager.getFocusInfo",
                args: ["{that}.container", "{that}.options.styles"]
            },
            getFocusGroupsInfo: {
                funcName: "gpii.qss.qssFocusManager.getFocusGroupsInfo",
                args: ["{that}", "{that}.container"]
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

    /**
     * Returns an array of focus groups each of which can contain a different number of QSS
     * buttons (DOM elements). The rules for grouping QSS buttons is as follows:
     * 1. The buttons are examined in the order in which they appear in the DOM.
     * 2. Each group can have no more than `maxElementsPerFocusGroup` elements.
     * 3. A group can have multiple buttons if and only if they are "small" QSS buttons.
     * 4. A group can contain only focusable elements.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     * @param {jQuery} container - The jQuery element representing the container of the component.
     * @param {Object[]} An array of arrays the latter of which contain DOM elements representing
     * the QSS buttons.
     */
    gpii.qss.qssFocusManager.getFocusGroups = function (that, container) {
        var focusGroups = [],
            styles = that.options.styles,
            focusableElements = container.find("." + styles.focusable + ":visible"),
            currentFocusGroup = [];

        fluid.each(focusableElements, function (focusableElement) {
            if (jQuery(focusableElement).hasClass(styles.smallButton)) {
                currentFocusGroup.push(focusableElement);
                // Mark the group as complete if the max number of elements has been reached.
                if (currentFocusGroup.length >= that.options.maxElementsPerFocusGroup) {
                    focusGroups.push(currentFocusGroup);
                    currentFocusGroup = [];
                }
            } else {
                // A "big" button can only be added to a group where it is the only element.
                // So complete any partial group that may exist before that.
                if (currentFocusGroup.length > 0) {
                    focusGroups.push(currentFocusGroup);
                    currentFocusGroup = [];
                }
                focusGroups.push([focusableElement]);
            }
        });

        return focusGroups;
    };

    /**
     * Returns information about the available focusable elements in the QSS, the index of the
     * focus group in which the currently focused element resides and the index of the focused
     * element within its own group.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     * @param {jQuery} container - The jQuery element representing the container of the component.
     * @return {Object} - An object containing information about the focusable elements in the QSS.
     */
    gpii.qss.qssFocusManager.getFocusGroupsInfo = function (that, container) {
        var focusGroups = gpii.qss.qssFocusManager.getFocusGroups(that, container),
            focusedElement = container.find("." + that.options.styles.focused)[0];

        var focusIndex = -1,
            focusGroupIndex = fluid.find(focusGroups, function (focusGroup, index) {
                focusIndex = jQuery.inArray(focusedElement, focusGroup);
                if (focusIndex > -1) {
                    return index;
                }
            });

        return {
            focusGroups: focusGroups,
            focusGroupIndex: focusGroupIndex,
            focusIndex: focusIndex
        };
    };

    gpii.qss.qssFocusManager.onArrowUpPressed = function (that) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            previousElementIndex = focusGroupInfo.focusIndex - 1,
            focusGroups = focusGroupInfo.focusGroups,
            focusGroup = focusGroups[focusGroupIndex];

        // If there is a focused group at all and the currently focused element is not
        // the first one in the focus group
        if (focusGroupIndex > -1 && previousElementIndex >= 0) {
            var elementToFocus = focusGroup[previousElementIndex];
            that.focusElement(jQuery(elementToFocus), true);
        }
    };

    gpii.qss.qssFocusManager.onArrowDownPressed = function (that) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            nextElementIndex = focusGroupInfo.focusIndex + 1,
            focusGroups = focusGroupInfo.focusGroups,
            focusGroup = focusGroups[focusGroupIndex];

        // If there is a focused group at all and the currently focused element is not
        // the first one in the focus group
        if (focusGroupIndex > -1 && nextElementIndex < focusGroup.length) {
            var elementToFocus = focusGroup[nextElementIndex];
            that.focusElement(jQuery(elementToFocus), true);
        }
    };

    gpii.qss.qssFocusManager.onArrowLeftPressed = function (that) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            focusGroups = focusGroupInfo.focusGroups,
            focusIndex = focusGroupInfo.focusIndex,
            previousGroupIndex;

        if (focusGroupIndex < 0) {
            previousGroupIndex = focusGroups.length - 1;
        } else {
            previousGroupIndex = gpii.psp.modulo(focusGroupIndex - 1, focusGroups.length);
        }

        var previousFocusGroup = focusGroups[previousGroupIndex],
            elementIndex = Math.min(focusIndex, previousFocusGroup.length - 1),
            elementToFocus = previousFocusGroup[elementIndex];
        that.focusElement(jQuery(elementToFocus), true);
    };

    gpii.qss.qssFocusManager.onArrowRightPressed = function (that) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            focusGroups = focusGroupInfo.focusGroups,
            focusIndex = focusGroupInfo.focusIndex,
            nextGroupIndex;

        if (focusGroupIndex < 0) {
            nextGroupIndex = 0;
        } else {
            nextGroupIndex = gpii.psp.modulo(focusGroupIndex + 1, focusGroups.length);
        }

        var previousFocusGroup = focusGroups[nextGroupIndex],
            elementIndex = Math.min(focusIndex, previousFocusGroup.length - 1),
            elementToFocus = previousFocusGroup[elementIndex];
        that.focusElement(jQuery(elementToFocus), true);
    };
})(fluid, jQuery);
