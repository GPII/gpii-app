/**
 * Generic utilities for the renderer
 *
 * Contains utility functions and components shared between different BrowserWindows.
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

    fluid.defaults("gpii.qss.focusManager", {
        gradeNames: ["fluid.viewComponent"],
        styles: {
            focusable: "fl-focusable",
            focused: "fl-focused"
        },

        components: {
            windowKeyListener: {
                type: "fluid.component",
                options: {
                    gradeNames: "gpii.qss.elementRepeater.keyListener",
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
            onTabPressed: "{windowKeyListener}.events.onTabPressed"
        },
        listeners: {
            "onTabPressed.impl": {
                func: "{that}.onTabPressed"
            }
        },
        invokers: {
            getFocusIndex: {
                funcName: "gpii.qss.focusManager.getFocusIndex",
                args: ["{that}.container", "{that}.options.styles"]
            },
            focus: {
                funcName: "gpii.qss.focusManager.focus",
                args: [
                    "{that}.container",
                    "{that}.options.styles",
                    "{arguments}.0" // index
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
            }
        }
    });

    gpii.qss.focusManager.getFocusIndex = function (container, styles) {
        var focusableElements = container.find("." + styles.focusable),
            focusedElement = container.find("." + styles.focused);

        if (focusedElement.length > 0) {
            return jQuery.inArray(focusedElement[0], focusableElements);
        }

        return -1;
    };

    gpii.qss.focusManager.changeFocus = function (that, items, index, backwards) {
        var increment = backwards ? -1 : 1,
            nextIndex = (index + increment) % items.length;

        if (nextIndex < 0) {
            nextIndex += items.length;
        }

        that.events.onButtonFocus.fire(nextIndex);
    };

    gpii.qss.focusManager.focus = function (container, styles, index) {
        var focusableElements = container.find("." + styles.focusable);
        if (!focusableElements[index]) {
            return;
        }

        focusableElements.removeClass(styles.focused);
        jQuery(focusableElements[index])
            .addClass(styles.focused)
            .focus();
    };

    gpii.qss.focusManager.focusNext = function (that, container) {
        var focusIndex = that.getFocusIndex(),
            nextIndex;

        if (focusIndex < 0) {
            nextIndex = 0;
        } else {
            var focusableElements = container.find("." + that.options.styles.focusable);
            nextIndex = (focusIndex + 1) % focusableElements.length;
        }

        that.focus(nextIndex);
    };

    gpii.qss.focusManager.focusPrevious = function (that, container) {
        var focusIndex = that.getFocusIndex(),
            focusableElements = container.find("." + that.options.styles.focusable),
            previousIndex;

        if (focusIndex < 0) {
            previousIndex = focusableElements.length - 1;
        } else {
            previousIndex = focusIndex - 1;
            if (previousIndex < 0) {
                previousIndex += focusableElements.length;
            }
        }

        that.focus(previousIndex);
    };

    gpii.qss.focusManager.onTabPressed = function (that, KeyboardEvent) {
        if (KeyboardEvent.shiftKey) {
            that.focusPrevious();
        } else {
            that.focusNext();
        }
    };

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
            "onArrowRightPressed.impl": {
                func: "{that}.focusPrevious"
            },
            "onArrowLeftPressed.impl": {
                func: "{that}.focusNext"
            }
        }
    });
})(fluid, jQuery);
