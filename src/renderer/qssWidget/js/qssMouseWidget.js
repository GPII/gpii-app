/**
 * The QSS Mouse widget
 *
 * Represents the QSS menu widget which is used for adjust mouse settings that have a list
 * of predefined values.
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
     * Represents the QSS mouse widget.
     */
    fluid.defaults("gpii.qssWidget.mouse", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            mouseSpeed: ".flc-qssMouseWidget-mouseSpeed",
            indicators: ".flc-qssMouseSpeedStepperWidget-indicators",
            swapMouseButtons: ".flc-qssMouseWidget-swapMouseButtons",
            easierDoubleClick: ".flc-qssMouseWidget-easierDoubleClick",
            largerMousePointer: ".flc-qssMouseWidget-largerMousePointer"
        },

        events: {
            onQssWidgetNotificationRequired: null,
            onQssWidgetSettingAltered: null
        },

        enableRichText: true,

        model: {
            setting: {
                settings: {
                    mouseSpeed: {
                        value: 0,
                        schema: {
                            title: null
                        }
                    },
                    swapMouseButtons: {
                        value: false,
                        schema: {
                            title: null
                        }
                    },
                    easierDoubleClick: {
                        value: false,
                        schema: {
                            title: null
                        }
                    },
                    largerMousePointer: {
                        value: false,
                        schema: {
                            title: null
                        }
                    }
                }
            },
            messages: {
                // something i18n
            }
        },

        sounds: {},

        components: {
            mouseSpeed: {
                type: "gpii.qssWidget.baseStepper",
                container: "{that}.dom.mouseSpeed",
                options: {
                    sounds: "{mouse}.options.sounds",
                    model: {
                        messages: "{mouse}.model.messages",
                        setting: "{mouse}.model.setting.settings.mouseSpeed",
                        value: "{mouse}.model.setting.settings.mouseSpeed.value"
                    },
                    events: {
                        onNotificationRequired: "{mouse}.events.onQssWidgetNotificationRequired"
                    },
                    components: {
                        indicators: {
                            type: "gpii.qssWidget.baseStepper.indicators",
                            container: "{mouse}.dom.indicators",
                            options: {
                                model: {
                                    setting: "{mouseSpeed}.model.setting"
                                }
                            }
                        }
                    }
                }
            },
            swapMouseButtons: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.swapMouseButtons",
                options: {
                    model: {
                        setting: "{mouse}.model.setting.settings.swapMouseButtons"
                    }
                }
            },
            easierDoubleClick: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.easierDoubleClick",
                options: {
                    model: {
                        setting: "{mouse}.model.setting.settings.easierDoubleClick"
                    }
                }
            },
            largerMousePointer: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.largerMousePointer",
                options: {
                    model: {
                        setting: "{mouse}.model.setting.settings.largerMousePointer"
                    }
                }
            //},
            //channelNotifier: {
            //    type: "gpii.psp.channelNotifier",
            //    options: {
            //        events: {
            //            // Add events the main process to be notified for
            //            onQssWidgetSettingAltered:       "{mouse}.events.onQssWidgetSettingAltered",
            //            onQssWidgetNotificationRequired: "{mouse}.events.onQssWidgetNotificationRequired"
            //        }
            //    }
            }
        }
    });

    /**
     * Represents the QSS mouse toggle widget.
     */
    fluid.defaults("gpii.qssWidget.mouseWidgetToggle", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            toggleButton: ".flc-toggleButton",
            settingTitle: ".flc-qssMouseWidgetToggle-settingTitle"
        },

        enableRichText: true,

        model: {
            setting: {},
            value: "{that}.model.setting.value",
            messages: {
                settingTitle: "{that}.model.setting.schema.title"
            }
        },

        components: {
            toggleButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.toggleButton",
                options: {
                    model: {},
                    modelRelay: {
                        "enabled": {
                            target: "enabled",
                            singleTransform: {
                                type: "fluid.transforms.valueMapper",
                                defaultInput: "{mouseWidgetToggle}.model.value",
                                match: [{
                                    inputValue: "{mouseWidgetToggle}.model.setting.schema.mapOff",
                                    outputValue: false
                                }, {
                                    inputValue: "{mouseWidgetToggle}.model.setting.schema.mapOn",
                                    outputValue: true
                                }]
                            }
                        }
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.mouseWidgetToggle.toggleModel",
                            args: ["{that}", "{mouseWidgetToggle}", "{channelNotifier}.events.onQssWidgetSettingAltered"]
                        }
                    }
                }
            }
        }
    });

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to update model value and update settings.
     * @param {Component} that - The `gpii.psp.widgets.switch` instance.
     * @param {Component} toggleWidget - The `gpii.qssWidget.mouseWidgetToggle` instance.
     * @param {fluid.event} event - onQssWidgetSettingAltered event
     */
    gpii.qssWidget.mouseWidgetToggle.toggleModel = function (that, toggleWidget, event) {
        if (toggleWidget.model.setting.schema.mapOff || toggleWidget.model.setting.schema.mapOn) {
            if (that.model.enabled) {
                toggleWidget.applier.change("value", toggleWidget.model.setting.schema.mapOff, null, "fromWidget");
            } else {
                toggleWidget.applier.change("value", toggleWidget.model.setting.schema.mapOn, null, "fromWidget");
            }
        } else {
            toggleWidget.applier.change("value", !that.model.enabled, null, "fromWidget");
        }

        event.fire(toggleWidget.model.setting);
    };

})(fluid);
