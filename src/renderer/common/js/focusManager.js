/**
 * Different types of focus managers
 *
 * Responsible for managing the focused element within a container.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid, jQuery */

"use strict";
(function (fluid, jQuery) {
    var gpii = fluid.registerNamespace("gpii");

    /**
     * A component responsible for managing focus within a container. All elements in the
     * container that can gain focus must have the class "fl-focusable". The currently
     * focused element (can be only one at any given time) will have the "fl-focused" class which
     * is simply a marker class used when computing which should be the next or previous element
     * to focus. The "fl-highlighted" class is added to a focused element if the element has gained
     * focus via keyboard interaction. This allows different CSS styles depending on whether the
     * element has been focused using the keyboard or via click/touch.
     *
     * This is the base grade for a focus manager which enables focusing of elements using the
     * Tab / Shift + Tab keys.
     */
    fluid.defaults("gpii.qss.focusManager", {
        gradeNames: ["fluid.viewComponent"],
        styles: {
            focusable: "fl-focusable",
            focused: "fl-focused",
            highlighted: "fl-highlighted"
        },

        components: {
            windowKeyListener: {
                type: "fluid.component",
                options: {
                    gradeNames: "gpii.app.keyListener",
                    target: {
                        expander: {
                            funcName: "jQuery",
                            args: [window]
                        }
                    },
                    events: {
                        onTabPressed: null
                    }
                }
            }
        },
        events: {
            onTabPressed: "{windowKeyListener}.events.onTabPressed",
            onElementFocused: null,
            onFocusLost: null
        },
        listeners: {
            "onTabPressed.impl": {
                func: "{that}.onTabPressed"
            },
            "onCreate.addListeners": {
                funcName: "gpii.qss.focusManager.addListeners",
                args: ["{that}"]
            },
            "onDestroy.removeListeners": {
                funcName: "gpii.qss.focusManager.removeListeners"
            }
        },
        invokers: {
            getFocusInfo: {
                funcName: "gpii.qss.focusManager.getFocusInfo",
                args: ["{that}.container", "{that}.options.styles"]
            },
            removeHighlight: {
                funcName: "gpii.qss.focusManager.removeHighlight",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0" // clearFocus
                ]
            },
            focus: {
                funcName: "gpii.qss.focusManager.focus",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0", // index
                    "{arguments}.1" // applyHighlight
                ]
            },
            focusElement: {
                funcName: "gpii.qss.focusManager.focusElement",
                args: [
                    "{that}",
                    "{arguments}.0", // element
                    "{arguments}.1", // applyHighlight
                    "{arguments}.2"  // silentFocus
                ]
            },
            focusNext: {
                funcName: "gpii.qss.focusManager.focusNext",
                args: ["{that}", "{that}.container"]
            },
            focusPrevious: {
                funcName: "gpii.qss.focusManager.focusPrevious",
                args: ["{that}", "{that}.container"]
            },
            onTabPressed: {
                funcName: "gpii.qss.focusManager.onTabPressed",
                args: [
                    "{that}",
                    "{arguments}.0" // KeyboardEvent
                ]
            },
            isHighlighted: {
                funcName: "gpii.qss.focusManager.isHighlighted",
                args: [
                    "{that}",
                    "{arguments}.0" // element
                ]
            }
        }
    });

    /**
     * Adds the necessary listeners so that the default Tab key behavior is overridden and
     * also in order to detect clicks in the document. All listeners have the jQuery namespace
     * "focusManager" so that they can be easily deregistered.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     */
    gpii.qss.focusManager.addListeners = function (that) {
        $(document).on("keydown.focusManager", function (KeyboardEvent) {
            if (KeyboardEvent.key === "Tab") {
                KeyboardEvent.preventDefault();
            }
        });

        $(document).on("click.focusManager", function () {
            that.removeHighlight(false);
        });
    };

    /**
     * Deregisters the listeners related to the focus manager (i.e. listeners with the namespace
     * "focusManager") when the component is destroyed.
     */
    gpii.qss.focusManager.removeListeners = function () {
        $(document).off(".focusManager");
    };

    /**
     * Returns information about the focusable elements in the page as well as the index of
     * the currently focused element.
     * @param {jQuery} container - The jQuery element representing the container in which this
     * focus manager handles focus.
     * @param {Object} styles - A styles object containing various classes related to focusing
     * of elements
     * @return {Object} Information about the focusable elements.
     */
    gpii.qss.focusManager.getFocusInfo = function (container, styles) {
        var focusableElements = container.find("." + styles.focusable + ":visible"),
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
     * Removes the keyboard navigation highlight (i.e. the "fl-highlighted" class) from all
     * focusable elements within the container of the focus manager and optionally clears
     * the marker "fl-focused" class.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     * @param {jQuery} container - The jQuery element representing the container in which this
     * focus manager handles focus.
     * @param {Boolean} clearFocus - Whether the marker "fl-focused" class should be removed
     * as well.
     */
    gpii.qss.focusManager.removeHighlight = function (that, container, clearFocus) {
        var styles = that.options.styles,
            focusableElements = container.find("." + styles.focusable);
        focusableElements.removeClass(styles.highlighted);

        if (clearFocus) {
            focusableElements.removeClass(styles.focused);
            that.events.onFocusLost.fire();
        }
    };

    /**
     * Focuses a focusable and visible element with a given index in the container and optionally applies
     * the keyboard navigation highlight (the "fl-highlighted" class).
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     * @param {jQuery} container - The jQuery element representing the container in which this
     * focus manager handles focus.
     * @param {Number} index - The index of the focusable element to be focused.
     * @param {Boolean} applyHighlight - Whether the keyboard navigation highlight should be
     * applied to the element which is to be focused.
     */
    gpii.qss.focusManager.focus = function (that, container, index, applyHighlight) {
        var selector = fluid.stringTemplate(".%focusable:eq(%index)", {
            focusable: that.options.styles.focusable + ":visible",
            index: index
        });

        var elementToFocus = container.find(selector);
        that.focusElement(elementToFocus, applyHighlight);
    };

    /**
     * Focuses the given focusable element and optionally applies the keyboard navigation
     * highlight (the "fl-highlighted" class). Depending on the value of the `silentFocus`
     * argument, the `onElementFocused` event can be fired when the focusing process completes.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     * @param {jQuery} element - A jQuery object representing the element to be focused.
     * @param {Boolean} applyHighlight - Whether the keyboard navigation highlight should be
     * applied to the element which is to be focused.
     * @param {Boolean} silentFocus - If `true` no event will be fired after the necessary UI
     * changes are made.
     */
    gpii.qss.focusManager.focusElement = function (that, element, applyHighlight, silentFocus) {
        var styles = that.options.styles;
        if (!element.hasClass(styles.focusable)) {
            return;
        }

        that.removeHighlight(true);

        element
            .addClass(styles.focused)
            .toggleClass(styles.highlighted, applyHighlight)
            .focus();

        if (!silentFocus) {
            that.events.onElementFocused.fire(element);
        }
    };

    /**
     * Focuses the next available visible focusable element. If the last focusable element has
     * been reached, the first element will be focused, then the second and so on. Note
     * that the keyboard navigation highlight will be applied in this case.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     */
    gpii.qss.focusManager.focusNext = function (that) {
        var focusInfo = that.getFocusInfo(),
            focusableElements = focusInfo.focusableElements,
            focusIndex = focusInfo.focusIndex,
            nextIndex;

        if (focusIndex < 0) {
            nextIndex = 0;
        } else {
            nextIndex = gpii.psp.modulo(focusIndex + 1, focusableElements.length);
        }

        that.focus(nextIndex, true);
    };

    /**
     * Focuses the previous available focusable element. If the first focusable element has
     * been reached, the last element will be focused, then the last but one and so on. Note
     * that the keyboard navigation highlight will be applied in this case.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     */
    gpii.qss.focusManager.focusPrevious = function (that) {
        var focusInfo = that.getFocusInfo(),
            focusableElements = focusInfo.focusableElements,
            focusIndex = focusInfo.focusIndex,
            previousIndex;

        if (focusIndex < 0) {
            previousIndex = focusableElements.length - 1;
        } else {
            previousIndex = gpii.psp.modulo(focusIndex - 1, focusableElements.length);
        }

        that.focus(previousIndex, true);
    };

    /**
     * Focuses the next available focusable element when the Tab key is pressed. If the Tab
     * key is pressed in conjunction with the Shift key, the previous focusable element will
     * receive the focus.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     * @param {KeyboardEvent} KeyboardEvent - The event which triggered the invocation of this
     * function.
     */
    gpii.qss.focusManager.onTabPressed = function (that, KeyboardEvent) {
        if (KeyboardEvent.shiftKey) {
            that.focusPrevious();
        } else {
            that.focusNext();
        }
    };

    /**
     * Returns whether the given element has a keyboard navigation highlight.
     * @param {Component} that - The `gpii.qss.focusManager` instance.
     * @param {jQuery} element - A jQuery object representing the element to be checked.
     * @return {Boolean} `true` if the element has a keyboard navigation highlight and `false`
     * otherwise.
     */
    gpii.qss.focusManager.isHighlighted = function (that, element) {
        var styles = that.options.styles;
        return element.hasClass(styles.focusable) &&
                element.hasClass(styles.focused) &&
                element.hasClass(styles.highlighted);
    };

    /**
     * An instance of a focus manager which enables focusing of elements both by using the Tab /
     * Shift + Tab keys and by using the Arrow Up and Arrow Down keys. Note that the keyboard
     * navigation highlight will be applied in this case.
     */
    fluid.defaults("gpii.qss.verticalFocusManager", {
        gradeNames: ["gpii.qss.focusManager"],
        components: {
            windowKeyListener: {
                options: {
                    events: {
                        onArrowDownPressed: null,
                        onArrowUpPressed: null
                    }
                }
            }
        },
        events: {
            onArrowUpPressed: "{windowKeyListener}.events.onArrowUpPressed",
            onArrowDownPressed: "{windowKeyListener}.events.onArrowDownPressed"
        },
        listeners: {
            "onArrowUpPressed.impl": {
                func: "{that}.focusPrevious"
            },
            "onArrowDownPressed.impl": {
                func: "{that}.focusNext"
            }
        }
    });

    /**
     * An instance of a focus manager which enables focusing of elements both by using the Tab /
     * Shift + Tab keys and by using the Arrow Left and Arrow Right keys.
     */
    fluid.defaults("gpii.qss.horizontalFocusManager", {
        gradeNames: ["gpii.qss.focusManager"],
        components: {
            windowKeyListener: {
                options: {
                    events: {
                        onArrowLeftPressed: null,
                        onArrowRightPressed: null
                    }
                }
            }
        },
        events: {
            onArrowLeftPressed: "{windowKeyListener}.events.onArrowLeftPressed",
            onArrowRightPressed: "{windowKeyListener}.events.onArrowRightPressed"
        },
        listeners: {
            "onArrowLeftPressed.impl": {
                func: "{that}.focusPrevious"
            },
            "onArrowRightPressed.impl": {
                func: "{that}.focusNext"
            }
        }
    });
})(fluid, jQuery);
