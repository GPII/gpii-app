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
            focused: "fl-focused", // a marker class for the element focused via click or keyboard
            highlighted: "fl-highlighted" // applies hightlight only when interacted via keyboard
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
                    "{that}.container",
                    "{arguments}.0", // element
                    "{arguments}.1" // applyHighlight
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

    gpii.qss.focusManager.removeListeners = function () {
        $(document).off(".focusManager");
    };

    gpii.qss.focusManager.getFocusInfo = function (container, styles) {
        var focusableElements = container.find("." + styles.focusable),
            focusedElement = container.find("." + styles.focused),
            focusIndex = -1;

        if (focusedElement.length > 0) {
            focusIndex = jQuery.inArray(focusedElement[0], focusableElements);
        }

        return {
            focusableElements: focusableElements,
            focusIndex: focusIndex
        };
    };

    gpii.qss.focusManager.removeHighlight = function (that, container, clearFocus) {
        var styles = that.options.styles,
            focusableElements = container.find("." + styles.focusable);
        focusableElements.removeClass(styles.highlighted);

        if (clearFocus) {
            focusableElements.removeClass(styles.focused);
        }
    };

    gpii.qss.focusManager.focus = function (that, container, index, applyHighlight) {
        var selector = fluid.stringTemplate(".%focusable:eq(%index)", {
            focusable: that.options.styles.focusable,
            index: index
        });

        var elementToFocus = container.find(selector);
        that.focusElement(elementToFocus, applyHighlight);
    };

    gpii.qss.focusManager.focusElement = function (that, container, element, applyHighlight) {
        var styles = that.options.styles;
        if (!element.hasClass(styles.focusable)) {
            return;
        }

        that.removeHighlight(true);

        element
            .addClass(styles.focused)
            .toggleClass(styles.highlighted, applyHighlight)
            .focus();
    };

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
            "onArrowLeftPressed.impl": {
                func: "{that}.focusPrevious"
            },
            "onArrowRightPressed.impl": {
                func: "{that}.focusNext"
            }
        }
    });
})(fluid, jQuery);
