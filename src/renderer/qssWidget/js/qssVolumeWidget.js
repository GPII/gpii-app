/**
 * The QSS Volume adjust widget
 *
 * Represents the QSS menu widget which is used for adjust volune settings
 *
 * Copyright 2019 Raising the Floor - International
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
     * QSS Volume widget
     */
    fluid.defaults("gpii.qssWidget.volume", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            heightListenerContainer: ".flc-qssVolumeWidget-controls",
            controlsWrapper: ".flc-qssVolumeWidget-wrapper",
            stepper: ".flc-volumeStepper",
            switch: ".flc-volumeSwitch",
            switchTitle: ".flc-volumeWidget-switchTitle",
            helpImage: ".flc-qssVolumeWidget-helpImage",
            extendedTip: ".flc-qssVolumeWidget-extendedTip"
        },

        enableRichText: true,
        sounds: {},

        model: {
            setting: {},
            value: "{that}.model.setting.value",
            previousValue: "{that}.model.setting.schema.previousValue",
            messages: {
                switchTitle: "{that}.model.setting.widget.switchTitle",
                extendedTip: "{that}.model.setting.widget.extendedTip"
            },
            messageChannel: "volumeMessageChannel" // Channel listening for messages related volume/mute functionality
        },
        events: {
            onNotificationRequired: null,
            onHeightChanged: null
        },
        listeners: {
            "onCreate": {
                this: "{that}.dom.helpImage",
                method: "attr",
                args: ["src", "{that}.model.setting.schema.helpImage"]
            },
            "onCreate.registerIpcListener": {
                funcName: "gpii.psp.registerIpcListener",
                args: ["{that}.model.messageChannel", "{volume}.loadActualValue"]
            },
            "onCreate.sendGetVolumeRequest": {
                funcName: "{channelNotifier}.events.onQssGetVolumeRequested.fire",
                args: ["{that}.model.messageChannel"]
            }
        },
        modelListeners: {
            value: {
                funcName: "gpii.qssWidget.volume.updateSwitchState",
                args: ["{switchButton}", "{stepper}", "{change}.value"]
            }
        },
        invokers: {
            loadActualValue: {
                funcName: "gpii.qssWidget.volume.loadActualValue",
                args: ["{volume}", "{arguments}.0"]
            },
            calculateHeight: {
                funcName: "gpii.qssWidget.calculateHeight",
                args: [
                    "{qssWidget}.container",
                    "{that}.dom.controlsWrapper",
                    "{that}.dom.heightListenerContainer"
                ]
            }
        },
        components: {
            stepper: {
                type: "gpii.qssWidget.volumeStepper",
                container: "{that}.dom.stepper",
                options: {
                    model: {
                        setting: "{volume}.model.setting",
                        value: "{volume}.model.value",
                        messages: {
                            on: null,
                            off: null
                        }
                    },
                    sounds: "{volume}.options.sounds",
                    events: {
                        onNotificationRequired: "{volume}.events.onNotificationRequired"
                    }
                }
            },
            switchButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.switch",
                options: {
                    model: {
                        enabled: {
                            expander: {
                                funcName: "gpii.qssWidget.volume.transformValue",
                                args: ["{volume}.model.setting.value"]
                            }
                        },
                        messages: {
                            on: "{volume}.model.messages.on",
                            off: "{volume}.model.messages.off"
                        }
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.volume.toggleModel",
                            args: ["{that}", "{volume}", "{stepper}", "{channelNotifier}.events.onQssWidgetSettingAltered"]
                        }
                    }
                }
            }
        }
    });

    /**
     * Set the actual volume value in the case the volume is changed through the Windows itself
     * @param {Component} that - The `gpii.psp.widgets.volume` instance.
     * @param {Number} value - The value of the setting.
     */
    gpii.qssWidget.volume.loadActualValue = function (that, value) {
        that.applier.change("value", value, null, "settingAlter");
    };

    /**
     * Invoked whenever the volume value is changed and updating the state of the
     * volume switch button.
     * @param {Component} switchButton - The `gpii.psp.widgets.volume.switchButton` instance.
     * @param {Component} stepper - The `gpii.psp.widgets.volumeStepper instance.
     * @param {Number} value - The value of the setting.
     */
    gpii.qssWidget.volume.updateSwitchState = function (switchButton, stepper, value) {
        if (!value !== switchButton.model.enabled) {
            switchButton.applier.change("enabled", !switchButton.model.enabled, null, "settingAlter");
        } else if (value !== 0 && switchButton.model.enabled) {
            switchButton.applier.change("enabled", !switchButton.model.enabled, null, "settingAlter");
        }
    };

    /**
     * Transforms a number value to boolean.
     * @param {Number} value - The value of the setting
     * @return {Boolean} The modified value.
     */
    gpii.qssWidget.volume.transformValue = function (value) {
        return !value;
    };

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to change the `enabled` model property to its opposite value and update settings.
     * @param {Component} that - The `gpii.psp.widgets.volume.switchButton` instance.
     * @param {Component} volumeWidget - The `gpii.psp.widgets.volume` instance.
     * @param {Component} stepper - The `gpii.psp.widgets.volumeStepper instance.
     * @param {EventListener} event - onQssWidgetSettingAltered event
     */
    gpii.qssWidget.volume.toggleModel = function (that, volumeWidget, stepper, event) {
        if (!volumeWidget.model.setting.value && !that.model.enabled) {
            return;
        }

        if (volumeWidget.model.setting.value !== 0) {
            volumeWidget.model.setting.previousValue = volumeWidget.model.setting.value;
            that.applier.change("previousValue", volumeWidget.model.setting.value, null, "settingAlter");
        }

        if (!that.model.enabled && volumeWidget.model.setting.value !== 0) {
            volumeWidget.model.setting.value = 0;
            volumeWidget.model.value = 0;
        } else {
            volumeWidget.model.setting.value = volumeWidget.model.setting.previousValue;
            volumeWidget.model.value = volumeWidget.model.setting.previousValue;
        }

        // update the volume setting
        event.fire(volumeWidget.model.setting);

        that.applier.change("enabled", !that.model.enabled, null, "settingAlter");
        volumeWidget.applier.change("value", volumeWidget.model.value, null, "settingAlter");
        stepper.applier.change("value", volumeWidget.model.value, null, "settingAlter");
    };


    /**
     * The QSS stepper widget for Volume button
     *
     * Represents the quick set strip stepper widget. It is used for
     * incrementing/decrementing a setting.
    */
    fluid.defaults("gpii.qssWidget.volumeStepper", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        members: {
            boundReachedHits: 0
        },

        specialErrorBoundHitTries: 2,
        enableRichText: true,

        model: {
            messages: {
                incrementButton: "Louder",
                decrementButton: "Quieter",

                upperBoundError: "This is highest setting",
                lowerBoundError: "This is lowest setting"
            },
            setting: {},

            value: null
        },

        styles: {
            errorAnimation: "fl-qssStepperWidgetBtn-stepperErrorActivation",
            warningAnimation: "fl-qssStepperWidgetBtn-stepperActivation"
        },

        selectors: {
            stepperButton: ".flc-qssVolumeStepperWidget-btn",
            incButton: ".flc-qssVolumeStepperWidget-incBtn",
            decButton: ".flc-qssVolumeStepperWidget-decBtn"
        },

        modelListeners: {
            value: {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{volume}.model.setting"],
                includeSource: "settingAlter"
            }
        },

        events: {
            onLowerBoundReached: null,
            onUpperBoundReached: null
        },

        listeners: {
            onLowerBoundReached: {
                funcName: "gpii.qssWidget.volumeStepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.lowerBoundError"
                ]
            },
            onUpperBoundReached: {
                funcName: "gpii.qssWidget.volumeStepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.upperBoundError"
                ]
            },
            "onCreate.attachAnimationClearer": {
                funcName: "gpii.qssWidget.volumeStepper.clearElementsAnimation",
                args: [
                    "{that}.dom.stepperButton",
                    "{that}.options.styles"
                ]
            }
        },

        invokers: {
            activateIncBtn: {
                funcName: "gpii.qssWidget.volumeStepper.activateButton",
                args: [
                    "{that}",
                    "{that}.dom.incButton",
                    "{that}.increment", // the proper function to be executed
                    "{that}.events.onUpperBoundReached" // the proper event to be fired
                ]
            },
            activateDecBtn: {
                funcName: "gpii.qssWidget.volumeStepper.activateButton",
                args: [
                    "{that}",
                    "{that}.dom.decButton",
                    "{that}.decrement", // the proper function to be executed
                    "{that}.events.onLowerBoundReached" // the proper event to be fired
                ]
            },
            increment: {
                funcName: "gpii.qssWidget.volumeStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    1, // step multiplier, no effect of the step itself
                    "{volume}.model.setting.previousValue"
                ]
            },
            decrement: {
                funcName: "gpii.qssWidget.volumeStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    -1, // step multiplier to reverse the step
                    "{volume}.model.setting.previousValue"
                ]
            },
            animateButton: {
                funcName: "gpii.qssWidget.volumeStepper.animateButton",
                args: [
                    "{that}.options.styles",
                    "{arguments}.0",
                    "{arguments}.1"
                ]
            }
        },

        components: {
            incButton: {
                type: "gpii.qssWidget.button",
                container: "{that}.dom.incButton",
                options: {
                    model: {
                        label: "{volumeStepper}.model.messages.incrementButton"
                    },
                    invokers: {
                        activate: "{volumeStepper}.activateIncBtn"
                    }
                }
            },
            decButton: {
                type: "gpii.qssWidget.button",
                container: "{that}.dom.decButton",
                options: {
                    model: {
                        label: "{volumeStepper}.model.messages.decrementButton"
                    },
                    invokers: {
                        activate: "{volumeStepper}.activateDecBtn"
                    }
                }
            },
            // similar to qssWidget component
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
                        onSubtractPressed: null,
                        onEqualsPressed:   null,
                        onAddPressed:      null
                    },
                    listeners: {
                        onAddPressed:      "{volumeStepper}.activateIncBtn",
                        onEqualsPressed:   "{volumeStepper}.activateIncBtn",
                        onSubtractPressed: "{volumeStepper}.activateDecBtn"
                    }
                }
            }
        }
    });

    /**
     * Invoked whenever the value of the setting has reached its upper or lower
     * bound and an attempt is made to go beyond that bound. In that case an
     * error tone is played. If at least `specialErrorBoundHitTries` number of
     * times this has happened, in addition to the error tone, a notification
     * is shown to the user.
     * @param {Component} that - The `gpii.qssWidget.volumeStepper` instance.
     * @param {String} errorMessage - The message to be displayed in the QSS
     * notification.
     */
    gpii.qssWidget.volumeStepper.handleBoundReached = function (that, errorMessage) {
        gpii.psp.playSound(that.options.sounds.boundReached);

        if (that.boundReachedHits >= that.options.specialErrorBoundHitTries) {
            that.events.onNotificationRequired.fire({
                description: errorMessage,
                closeOnBlur: true
            });
        }
    };

    /**
     * Invoked whenever the either button is activated. Takes care of
     * changing the setting's value with the amount specified in the setting's
     * schema, animating the button appropriately and/or firing an event if
     * an attempt is made to increase/decrease value above or below the
     * maximum or minimum allowed value.
     * @param {Component} that - The `gpii.qssWidget.volumeStepper` instance.
     * @param {jQuery} button - The jQuery object representing the inc/dev buttons
     * @param {Function} actionFunc - Uses the provided function to change the value
     * button is pressed in the QSS stepper widget.
     * @param {fluid.event} boundEvent - a handle to the event to be fired when
     * bound is reached
     */
    gpii.qssWidget.volumeStepper.activateButton = function (that, button, actionFunc, boundEvent) {
        var boundReached = actionFunc();

        that.animateButton(button, boundReached);
        if (boundReached) {
            // register bound hit
            that.boundReachedHits += 1;
            // fire the event
            boundEvent.fire();
        } else {
            that.boundReachedHits = 0;
        }
    };

    /**
     * Either increases or decreases the current setting's value (depending on the
     * `shouldSubtract` parameter) with the `divisibleBy` amount specified in the
     * setting's schema. It also takes care that the new value of the setting does
     * not become bigger/smaller than the maximum/minimum allowed value for the
     * setting.
     * @param {Component} that - The `gpii.qssWidget.stepperBrightness` instance.
     * @param {Number} value - The initial value of the setting before the operation.
     * @param {Object} schema - Describes the schema of the setting.
     * @param {Number} schema.min - The minimum possible value for the setting.
     * @param {Number} schema.max - The maximum possible value for the setting.
     * @param {Number} schema.divisibleBy - The amount which is added or subtracted
     * from the setting's value every time this function is invoked.
     * @param {Number} stepMultiplier - a basic numeric step multiplier, if its 1 there
     * will be no change in the step size, -1 will reverse it, and everything else
     * will act as a real multiplier (2 for 2x as an example)
     * subtracted from or added to the setting's value.
     * @return {Boolean} Whether there was a change in the setting's value.
     */
    gpii.qssWidget.volumeStepper.makeRestrictedStep = function (that, value, schema, stepMultiplier, previousValue) {
        var restrictedValue;
        if (value === 0 && previousValue) {
            restrictedValue = previousValue;
        } else {
            var step = schema.divisibleBy * stepMultiplier;

            value = parseFloat( (value + step).toPrecision(3) );
            // Handle not given min and max
            restrictedValue = value;

            if (fluid.isValue(schema.max)) {
                restrictedValue = Math.min(restrictedValue, schema.max);
            }

            if (fluid.isValue(schema.min)) {
                restrictedValue = Math.max(restrictedValue, schema.min);
            }
        }

        that.applier.change("value", restrictedValue, null, "settingAlter");

        // Whether a bound was hit
        return value !== restrictedValue;
    };

    /**
     * A utility function for triggering a CSS animation by adding the CSS class
     * containing the animation description and removing any previously added CSS
     * classes that may contain animations.
     * @param {jQuery} element - The jQuery object representing the DOM element that
     * is to be animated.
     * @param {String} animationClass - The CSS class of the animation to be triggered.
     * @param {String[]} animationClasses - An array of CSS animation classes that are
     * to be removed before the new animation is applied.
     */
    gpii.qssWidget.volumeStepper.triggerCssAnimation = function (element, animationClass, animationClasses) {
        // ensure animations are cleared (button may be activated before animation's end)
        element.removeClass(animationClasses.join(" "));
        // Avoid browser optimization
        // inspired by https://stackoverflow.com/a/30072037/2276288
        element[0].offsetWidth;

        element.addClass(animationClass);
    };

    /**
     * Removes any CSS classes associated with an animation from the `animatedElements`.
     * @param {jQuery} animatedElements - A jQuery object representing the items from
     * which the animation classes have to be removed.
     * @param {Object} styles - An object whose values are the CSS classes to be removed.
     */
    gpii.qssWidget.volumeStepper.clearElementsAnimation = function (animatedElements, styles) {
        var animationClasses = fluid.values(styles);
        animatedElements.removeClass(animationClasses.join(" "));
    };

    /**
     * Applies an animation to an increase/decrease button. The type of animation depends
     * on whether the value was increased properly or a lower/upper bound has been reached.
     * @param {Object} styles - An object whose values are the CSS animation classes.
     * @param {jQuery} button - A jQuery object representing the items to be animated.
     * @param {Boolean} isError - Whether the upper/lower bound has been reached or not.
     */
    gpii.qssWidget.volumeStepper.animateButton = function (styles, button, isError) {
        var triggerClass = isError ? styles.errorAnimation : styles.warningAnimation;

        gpii.qssWidget.volumeStepper.triggerCssAnimation(
            button,
            triggerClass,
            [ styles.errorAnimation, styles.warningAnimation ]);
    };

})(fluid);
