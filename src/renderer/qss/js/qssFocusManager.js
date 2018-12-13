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
            button: "fl-qss-button",
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
     * @param {HTMLElement | jQuery} element - A simple DOM element or wrapped in a jQuery
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
     * Represents a group of QSS buttons some (or all) of which can gain focus. The number of
     * QSS elements in a group cannot exceed `maxElementsPerFocusGroup`. A group can have
     * multiple buttons if and only if they are "small" QSS buttons, i.e. a large button always
     * appears in its own group.
     * @typedef {HTMLElement[]} FocusGroup
     */

    /**
     * An object containing useful information about the QSS buttons and the currently focused
     * QSS button if any.
     * @typedef {Object} FocusGroupsInfo
     * @property {FocusGroup[]} focusGroups - An array of `FocusGroup`s which together contain
     * all QSS buttons.
     * @property {Number} focusGroupIndex - The index of the focus group in which the currently
     * focused element resides, or -1 if currently there is no focused element
     * @property {Number} focusIndex - the index of the focused element within its own group, or
     * -1 if currently there is no focused element. If the `focusGroupIndex` is -1, this implies
     * that the `focusIndex` will also be -1.
     */

    /**
     * Returns an array of `FocusGroup`s each of which can contain a different number of QSS
     * buttons. Grouping is performed by examining the buttons in the order in which they appear
     * in the DOM.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     * @param {jQuery} container - The jQuery element representing the container of the component.
     * @return {FocusGroup[]} An array of `FocusGroup`s which together contain all QSS buttons.
     */
    gpii.qss.qssFocusManager.getFocusGroups = function (that, container) {
        var focusGroups = [],
            styles = that.options.styles,
            qssButtons = container.find("." + styles.button + ":visible"),
            currentFocusGroup = [];

        fluid.each(qssButtons, function (qssButton) {
            if (jQuery(qssButton).hasClass(styles.smallButton)) {
                currentFocusGroup.push(qssButton);
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
                focusGroups.push([qssButton]);
            }
        });

        return focusGroups;
    };

    /**
     * Retrieves information about the focusable elements in the QSS.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     * @param {jQuery} container - The jQuery element representing the container of the component.
     * @return {FocusGroupsInfo} - A `FocusGroupsInfo` object with the requested information.
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
            }, -1);

        return {
            focusGroups: focusGroups,
            focusGroupIndex: focusGroupIndex,
            focusIndex: focusIndex
        };
    };

    /**
     * Focuses the first available button which conforms to all of the following conditions:
     * 1. The button is focusable.
     * 2. The button is in the same focus group as the currently focused button.
     * 3. The button is the first button before or after the currently focused button (depending
     * on the `direction` argument) which conforms to the two conditions above.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     * @param {Boolean} direction - If `true` the scanning direction will be from top to bottom.
     * Otherwise, it will be from bottom to top.
     */
    gpii.qss.qssFocusManager.focusNearestVertically = function (that, direction) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroups = focusGroupInfo.focusGroups,
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            focusGroup = focusGroups[focusGroupIndex],
            delta = direction ? 1 : -1,
            nextElementIndex = focusGroupInfo.focusIndex + delta;

        if (focusGroupIndex > -1) {
            while (0 <= nextElementIndex && nextElementIndex < focusGroup.length) {
                var elementToFocus = focusGroup[nextElementIndex];
                if (that.isFocusable(elementToFocus)) {
                    that.focusElement(elementToFocus, true);
                    break;
                } else {
                    nextElementIndex += delta;
                }
            }
        }
    };

    /**
     * Focuses the first focusable button which comes before the currently focused button (if any)
     * in the same focus group. If there is no focused group initially, this function does nothing.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     */
    gpii.qss.qssFocusManager.onArrowUpPressed = function (that) {
        gpii.qss.qssFocusManager.focusNearestVertically(that, false);
    };

    /**
     * Focuses the first focusable button which comes after the currently focused button (if any)
     * in the same focus group. If there is no focused group initially, this function does nothing.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     */
    gpii.qss.qssFocusManager.onArrowDownPressed = function (that) {
        gpii.qss.qssFocusManager.focusNearestVertically(that, true);
    };

    /**
     * Focuses the first available button which conforms to all of the following conditions:
     * 1. The button is focusable.
     * 2. The button is in the first focusable group which comes to the left or to the right
     * (depending on the value of the `direction` flag) of the current focus group. If there
     * is no such button in any of the groups to the left or to the right, the groups to the right
     * or to the left of the current focus group respectively are also examined starting from the
     * farthest.
     * 3. The button has the same index in its focus group as the index of the currently focused
     * button in its group. If the new group has fewer buttons, its last button will be focused.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     * @param {FocusGroupsInfo} focusGroupInfo - An object holding information about the focusable
     * elements in the QSS.
     * @param {Number} initialGroupIndex - the index of the focus group from which the examination
     * should commence
     * @param {Boolean} direction - If `true` the scanning direction will be from left to right.
     * Otherwise, it will be from right to left.
     */
    gpii.qss.qssFocusManager.focusNearestHorizontally = function (that, focusGroupInfo, initialGroupIndex, direction) {
        var focusGroups = focusGroupInfo.focusGroups,
            focusIndex = focusGroupInfo.focusIndex,
            delta = direction ? 1 : -1,
            nextGroupIndex = initialGroupIndex;

        do {
            var nextFocusGroup = focusGroups[nextGroupIndex],
                elementIndex = Math.max(0, Math.min(focusIndex, nextFocusGroup.length - 1)),
                elementToFocus = nextFocusGroup[elementIndex];

            if (that.isFocusable(elementToFocus)) {
                that.focusElement(elementToFocus, true);
                break;
            } else {
                nextGroupIndex = gpii.psp.modulo(nextGroupIndex + delta, focusGroups.length);
            }
        } while (nextGroupIndex !== initialGroupIndex);
    };

    /**
     * Focuses the first available button which conforms to all of the following conditions:
     * 1. The button is focusable.
     * 2. The button is in a focus group which is visually to the left of the current focus group.
     * If there is no such button in any of the groups to the left, the groups to the right of the
     * current focus group are also examined starting from the farthest.
     * 3. The button has the same index in its focus group as the index of the currently focused
     * button in its group. If the new group has fewer buttons, its last button will be focused.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     */
    gpii.qss.qssFocusManager.onArrowLeftPressed = function (that) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            focusGroups = focusGroupInfo.focusGroups,
            previousGroupIndex;

        if (focusGroupIndex < 0) {
            previousGroupIndex = focusGroups.length - 1;
        } else {
            previousGroupIndex = gpii.psp.modulo(focusGroupIndex - 1, focusGroups.length);
        }

        gpii.qss.qssFocusManager.focusNearestHorizontally(that, focusGroupInfo, previousGroupIndex, false);
    };

    /**
     * Focuses the first available button which conforms to all of the following conditions:
     * 1. The button is focusable.
     * 2. The button is in a focus group which is visually to the right of the current focus group.
     * If there is no such button in any of the groups to the right, the groups to the left of the
     * current focus group are also examined starting from the farthest.
     * 3. The button has the same index in its focus group as the index of the currently focused
     * button in its group. If the new group has fewer buttons, its last button will be focused.
     * @param {Component} that - The `gpii.qss.qssFocusManager` instance.
     */
    gpii.qss.qssFocusManager.onArrowRightPressed = function (that) {
        var focusGroupInfo = that.getFocusGroupsInfo(),
            focusGroupIndex = focusGroupInfo.focusGroupIndex,
            focusGroups = focusGroupInfo.focusGroups,
            nextGroupIndex = gpii.psp.modulo(focusGroupIndex + 1, focusGroups.length);

        gpii.qss.qssFocusManager.focusNearestHorizontally(that, focusGroupInfo, nextGroupIndex, true);
    };
})(fluid, jQuery);
