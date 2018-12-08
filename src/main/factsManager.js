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
        keyedInTimestamp: null,
        // Number of interactions with the GPII app. Incremented whenever the PSP or QSS is
        // opened, as well as when an actual user (i.e. different from `noUser`) keys in.
        interactionsCount: null,

        /* Whether the default preference set has no setting groups when the user keys in.
         * Note that this value will NOT change if settings are added to the preference set
         * subsequently in the same user session. The value of `isEmptyKey` for the "noUser"
         * will always be `false`.
         */
        isEmptyKey: null
    },
    modelListeners: {
        interactionsCount: {
            func: "console.log",
            args: [
                "FactsManager: Changed interactionsCount: ",
                "{change}.value"
            ]
        },
        /* Ensure that the `isEmptyKey` is calculated only when the user has keyed in AND
         * his preferences are delivered to the GPII app.
         */
        "{app}.model.preferences.gpiiKey": {
            changePath: "isEmptyKey",
            value: {
                expander: {
                    funcName: "gpii.app.factsManager.getIsEmptyKey",
                    args: [
                        "{that}",
                        "{app}.model.isKeyedIn",
                        "{app}.model.preferences.settingGroups"
                    ]
                }
            },
            excludeSource: "init"
        }
    },
    listeners: {
        "{app}.events.onKeyedOut": {
            changePath: "keyedInTimestamp",
            value: null
        },
        "{app}.events.onKeyedIn": [{
            changePath: "keyedInTimestamp",
            value: "@expand:Date.now()"
        }, {
            func: "{that}.increaseInteractionsCount"
        }],
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
    var interactionsCount = that.model.interactionsCount || 0;
    that.applier.change("interactionsCount", interactionsCount + 1);
};

/**
 * Returns whether the currently used key is empty, i.e. has no setting groups
 * in its default preference set when the user keys in.
 * @param {Component} that - The `gpii.app.factsManager` instance.
 * @param {Boolean} isKeyedIn - Whether there is an actual keyed in user or not.
 * @param {module:gpiiConnector.SettingGroup[]} settingGroups - An array with
 * setting group items as per the parsed message in the `gpiiConnector`
 * @return {Boolean} `true` if the current key has no setting groups or `false`
 * otherwise.
 */
gpii.app.factsManager.getIsEmptyKey = function (that, isKeyedIn, settingGroups) {
    return isKeyedIn && !gpii.app.settingGroups.hasSettings(settingGroups);
};
