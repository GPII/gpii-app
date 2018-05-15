/**
 * The quick set strip
 *
 * Represents the quick set strip with which the user can update his settings.
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
     * Register keyup events on a DOM element. Once a key is pressed a
     * corresponding component's event is fired, if event by a special name
     * is supplied for it.
     * Every special component event follow the format: `on<KeyName>Clicked`
     * where the available <KeyName>s can be view here:
     * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
     *
     * N.B.! The <KeyName> for the space bar is "Spacebar", which differs from the name
     * in the specification which is simply " "
     */
    fluid.defaults("gpii.qss.elementRepeater.keyListener", {
        events: {}, // given by implementor

        listeners: {
            "onCreate.addKeyPressHandler": {
                this: "{that}.container",
                method: "keyup",
                args: "{that}.registerKeyPress"
            }
        },

        invokers: {
            registerKeyPress: {
                funcName: "gpii.qss.elementRepeater.keyListener.registerKeyPress",
                args: ["{that}.events", "{arguments}.0"]
            }
        }
    });

    /**
     * TODO
     */
    gpii.qss.elementRepeater.keyListener.registerKeyPress = function (events, KeyboardEvent) {
        // Make use of a relatively new feature https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
        var keyName;

        // rename Space key in order to achieve proper generic method for key presses
        // The full list of key names can be view here: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        if (KeyboardEvent.key === " ") {
            keyName = "Spacebar";
        } else { // e.g. ArrowDown, Enter
            keyName = KeyboardEvent.key;
        }

        var eventName = "on" + keyName + "Clicked";

        // Check whether such key press is observed
        if (events[eventName]) {
            events[eventName].fire();
        }
    };


    fluid.defaults("gpii.qss.elementRepeater.qssKeyListener", {
        gradeNames: "gpii.qss.elementRepeater.keyListener",

        events: {
            onArrowDownClicked: null,
            onArrowUpClicked: null,
            onArrowLeftClicked: null,
            onArrowRightClicked: null,
            onEnterClicked: null,
            onSpacebarClicked: null
        }
    });


    fluid.defaults("gpii.qss.elementRepeater.clickable", {
        events: {
            onClicked: null
        },

        listeners: {
            "onCreate.addClickHandler": {
                this: "{that}.container",
                method: "click",
                args: "{that}.events.onClicked.fire"
            }
        }
    });

    /**
     * TODO
     * add timeout?
     */
    fluid.defaults("gpii.qss.elementRepeater.hoverable", {
        events: {
            onMouseEnter: null,
            onMouseLeave: null
        },

        listeners: {
            "onCreate.addHoverHandler": {
                this: "{that}.container",
                method: "hover",
                args: [
                    "{that}.events.onMouseEnter.fire",
                    "{that}.events.onMouseLeave.fire"
                ]
            }
        }
    });

    /**
     * TODO
     */
    fluid.defaults("gpii.qss.buttonPresenter", {
        gradeNames: [
            "gpii.qss.elementRepeater.qssKeyListener",
            "gpii.qss.elementRepeater.hoverable",
            "gpii.qss.elementRepeater.clickable",
            "fluid.viewComponent"
        ],

        model: {
            item: {}
        },

        // pass hover item as it is in order to use its position
        // TODO probably use something like https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
        events: {
            onMouseEnter: "{list}.events.onButtonMouseEnter",
            onMouseLeave: "{list}.events.onButtonMouseLeave"
        },

        listeners: {
            "onCreate.renderLabel": {
                this: "{that}.container",
                method: "text",
                args: ["{that}.model.item.label"]
            },

            // Element interaction events

            onClicked: {
                funcName: "{list}.events.onButtonClicked.fire",
                args: ["{that}.model.item"]
            },

            onArrowUpClicked: {
                funcName: "console.log",
                args: ["{that}.model.item"]
            },
            onArrowDownClicked: {
                funcName: "console.log",
                args: ["{that}.model.item"]
            },

            onArrowLeftClicked: {
                funcName: "console.log",
                args: ["{that}.model.item"]
            },
            onArrowRightClicked: {
                funcName: "console.log",
                args: ["{that}.model.item"]
            },
            onSpacebarClicked: {
                funcName: "console.log",
                args: ["{that}.model.item"]
            }
        }
    });

    fluid.defaults("gpii.qss.toggleButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        listeners: {
            onCreate: {
                this: "console",
                method: "log",
                args: ["toggleButtonPresenter"]
            }
        }
    });

    /**
     * Represents the list of qss settings. It renders the settings and listens
     * for events on them.
     */
    fluid.defaults("gpii.qss.list", {
        gradeNames: ["gpii.psp.repeater"],

        dynamicContainerMarkup: {
            container: "<button class=\"%containerClass\" tabindex=0></button>",
            containerClassPrefix: "fl-quickSetStrip-button"
        },
        // TODO get handler based on setting type
        handlerType: "gpii.qss.buttonPresenter",
        markup: null,

        events: {
            onButtonClicked: null,
            onButtonMouseEnter: null,
            onButtonMouseLeave: null
        },

        invokers: {
            getHandlerType: {
                funcName: "gpii.qss.list.getHandlerType",
                args: ["{arguments}.0"] // item
            }
        }
    });

    gpii.qss.list.getHandlerType = function (item) {
        if (item.type === "toggle") {
            return "gpii.qss.toggleButtonPresenter";
        }

        return "gpii.qss.buttonPresenter";
    };

    /**
     * Represents the QSS as a whole.
     */
    fluid.defaults("gpii.qss", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            settings: []
        },

        components: {
            quickSetStripList: {
                type: "gpii.qss.list",
                container: "{that}.container",
                options: {
                    model: {
                        items: "{quickSetStrip}.model.settings"
                    }
                }
            },
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        // Add events from the main process to be listened for
                        onSettingUpdated: null
                    },
                    // XXX dev
                    listeners: {
                        onSettingUpdated: {
                            funcName: "console.log",
                            args: ["Settings updated: ", "{arguments}.0"]
                        }
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        // Add events the main process to be notified for
                        onQssButtonClicked:    "{quickSetStripList}.events.onButtonClicked",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave"
                    }
                }
            }
        }
    });
})(fluid);
