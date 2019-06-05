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
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
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
            }
        },
        events: {
            onNotificationRequired: null
        },
        listeners: {
            "onCreate": {
                this: "{that}.dom.helpImage",
                method: "attr",
                args: ["src", "{that}.model.setting.schema.helpImage"]
            }
        },
        modelListeners: {
            value: {
                funcName: "gpii.qssWidget.volume.updateSwitchState",
                args: ["{switchButton}", "{stepper}", "{change}.value"]
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
     * Invoked whenever the volume value is changed and updating the state of the
     * volume switch button.
     * @param {Component} switchButton - The `gpii.psp.widgets.volume.switchButton` instance.
     * @param {Component} stepper - The `gpii.psp.widgets.volumeStepper instance.
     * @param {Number} value - The value of the setting.
     */
    gpii.qssWidget.volume.updateSwitchState = function (switchButton, stepper, value) {
        if (value === 0 && !switchButton.model.enabled) {
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
        var boolValue = !value ? true : false;
        return boolValue;
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
            volumeWidget.model.setting.value = volumeWidget.model.previousValue;
            volumeWidget.model.value = volumeWidget.model.previousValue;
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
                funcName: "gpii.qssWidget.volumeStepper.activateIncButton",
                args: [
                    "{that}",
                    "{that}.dom.incButton",
                    "{that}.model.setting.schema" // only restrictions will be used
                ]
            },
            activateDecBtn: {
                funcName: "gpii.qssWidget.volumeStepper.activateDecButton",
                args: [
                    "{that}",
                    "{that}.dom.decButton",
                    "{that}.model.setting.schema"
                ]
            },
            increment: {
                funcName: "gpii.qssWidget.volumeStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema"
                ]
            },
            decrement: {
                funcName: "gpii.qssWidget.volumeStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    true
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
     * Invoked whenever the increment button is activated. Takes care of
     * increasing the setting's value with the amount specified in the setting's
     * schema, animating the button appropriately and/or firing an event if
     * an attempt is made to increase value above the maximum allowed value.
     * @param {Component} that - The `gpii.qssWidget.volumeStepper` instance.
     * @param {jQuery} button - The jQuery object repesenting the increment button
     * in the QSS stepper widget.
     */
    gpii.qssWidget.volumeStepper.activateIncButton = function (that, button) {
        var boundReached = that.increment();
        that.animateButton(button, boundReached);
        if (boundReached) {
            // register bound hit
            that.boundReachedHits += 1;

            that.events.onUpperBoundReached.fire();
        } else {
            that.boundReachedHits = 0;
        }
    };

    /**
     * Invoked whenever the decrement button is activated. Takes care of
     * decreasing the setting's value with the amount specified in the setting's
     * schema, animating the button appropriately and/or firing an event if
     * an attempt is made to decrease value below the minimum allowed value.
     * @param {Component} that - The `gpii.qssWidget.volumeStepper` instance.
     * @param {jQuery} button - The jQuery object repesenting the decrement button
     * in the QSS stepper widget.
     */
    gpii.qssWidget.volumeStepper.activateDecButton = function (that, button) {
        var boundReached = that.decrement();
        that.animateButton(button, boundReached);
        if (boundReached) {
            // register bound hit
            that.boundReachedHits += 1;

            that.events.onLowerBoundReached.fire();
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
     * @param {Component} that - The `gpii.qssWidget.volumeStepper` instance.
     * @param {Number} value - The initial value of the setting before the operation.
     * @param {Object} schema - Describes the schema of the setting.
     * @param {Number} schema.min - The minimum possible value for the setting.
     * @param {Number} schema.max - The maximum possible value for the setting.
     * @param {Number} schema.divisibleBy - The amount which is added or subtracted
     * from the setting's value every time this function is invoked.
     * @param {Boolean} shouldSubtract - Whether the `divisibleBy` amount should be
     * subtracted from or added to the setting's value.
     * @return {Boolean} Whether there was a change in the setting's value.
     */
    gpii.qssWidget.volumeStepper.makeRestrictedStep = function (that, value, schema, shouldSubtract) {
        var step = (shouldSubtract ? -schema.divisibleBy : schema.divisibleBy);

        value = parseFloat( (value + step).toPrecision(2) );
        // Handle not given min and max
        var restrcitedValue = value;

        if (fluid.isValue(schema.max)) {
            restrcitedValue = Math.min(restrcitedValue, schema.max);
        }

        if (fluid.isValue(schema.min)) {
            restrcitedValue = Math.max(restrcitedValue, schema.min);
        }

        that.applier.change("value", restrcitedValue, null, "settingAlter");

        // Whether a bound was hit
        return value !== restrcitedValue;
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
