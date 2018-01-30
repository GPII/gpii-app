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

var fluid = require("infusion");

fluid.defaults("gpii.app.factsManager", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        keyedInTimestamp: null
    },
    listeners: {
        "{app}.events.onKeyedIn": {
            func: "{that}.updateKeyedInTimestamp"
        },
        "{app}.events.onKeyedOut": {
            func: "{that}.reset"
        }
    },
    invokers: {
        updateKeyedInTimestamp: {
            changePath: "keyedInTimestamp",
            value: "@expand:Date.now()"
        },
        reset: {
            changePath: "keyedInTimestamp",
            value: null
        }
    }
});
