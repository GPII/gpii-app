/**
 * A manager of application's facts
 *
 * An Infusion component which manages facts related to the application (e.g. how long
 * the user has been keyed in). Relies on fact providers to function properly.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

/**
 * This component is responsible for retrieving, storing and updating (when applicable)
 * application facts. A fact is a piece of application information which may be of interest
 * to the survey trigger manager. Definitions of survey trigger conditions will typically
 * include a fact and the value which this fact must have in order to consider the condition
 * satisfied.
 *
 * There will be two types of facts in the PSP: static and dynamic. A static fact does not
 * change once it is retrieved (e.g. keyedInTimestamp) whereas a dynamic fact’s state will
 * change over time. In the future, once a user has keyed in, static facts will be obtained
 * from the GPII or will be calculated by the PSP itself (depending on the nature of the
 * fact) and (model) listeners will be registered for the dynamic facts.
 */
fluid.defaults("gpii.app.factsManager", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        // Number of interactions with the GPII app. Incremented whenever the PSP or QSS is
        // opened, as well as when an actual user (i.e. different from `noUser`) keys in.
        interactionsCount: 0
    },
    modelListeners: {
        interactionsCount: {
            func: "console.log",
            args: [
                "=======interactionsCount",
                "{change}.value"
            ]
        }
    },
    listeners: {
        "{qssWrapper}.qss.events.onDialogShown": {
            funcName: "{that}.increaseInteractionsCount"
        },
        "{psp}.events.onDialogShown": {
            funcName: "{that}.increaseInteractionsCount"
        }
    },
    invokers: {
        increaseInteractionsCount: {
            funcName: "gpii.app.factsManager.increaseInteractionsCount",
            args: ["{that}"]
        }
    }
});

/**
 * Increases the `interactionsCount` fact by 1.
 * @param {Component} that - The `gpii.app.factsManager` instance.
 */
gpii.app.factsManager.increaseInteractionsCount = function (that) {
    var interactionsCount = that.model.interactionsCount;
    that.applier.change("interactionsCount", interactionsCount + 1);
};
