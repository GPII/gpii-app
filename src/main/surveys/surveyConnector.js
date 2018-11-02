/**
 * A connector for survey related operations
 *
 * Responsible for requesting survey triggers, notifying that the desired conditions have
 * been met and instructing the PSP what survey to show.
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
    gpii = fluid.registerNamespace("gpii"),
    request = require("request"),
    URL = require("url").URL,
    URLSearchParams = require("url").URLSearchParams;

/**
 * A component which is responsible for:
 * 1. Requesting the survey triggers when a user keys in (see the `requestTriggers` invoker).
 * 2. Firing an event (`onTriggerDataReceived`) when the triggers are sent to it.
 * 3. Informing the interested parties that a survey trigger has been fulfilled (see the
 * `notifyTriggerOccurred` invoker).
 * 4. Firing an event (`onSurveyRequired`) if and when a survey needs to be shown by the PSP.
 *
 * This component does not provide an implementation for its invokers, nor does it fire the
 * events mentioned above on its own. This is left to the implementors. The
 * `gpii.app.staticSurveyConnector` simply serves static payloads which reside in the GPII app
 * whenever its invokers are called. The `gpii.app.dynamicSurveyConnector` serves payloads which
 * are fetched from a remote location.
 *
 * In the future, when a user keyes in, the `surveyConnector` would request the survey triggers
 * by issuing a request to the corresponding server route with the following JSON parameter:
 *     {
 *         keyedInUserToken: <keyedInUserToken>, // the token of the currently keyed in user
 *         machineId: <machineId> // the installation id of the OS
 *     }
 *
 * The response of the server would be an array of trigger objects in the following format:
 *     {
 *         id: <trigger_id>, // mandatory, used to distinguish the triggers
 *         surveyUrl: <surveyUrl>, // optional - the URL of the survey if it is in a remote location
 *         conditions: {
 *             // lists all conditions that need to be satisfied for this trigger
 *         }
 *     }
 *
 * When the conditions for a survey trigger have been satisfied, the `surveyConnector`
 * would issue a request to the corresponding server route with the following JSON parameter:
 *     {
 *         trigger: <triggerObject> // the trigger which has occurred
 *     }
 *
 * Finally, the message that the survey server will send in order for the PSP to show a survey would
 * look like this:
 *    {
 *        url: <the Qualtrics survey's URL>,
 *        closeOnSubmit: <true | false> // whether the survey should close automatically when completed
 *        window: { // parameters for the `BrowserWindow` in which the survey would open
 *            // Below are given some configuration parameters with their default values
 *            width: 800,
 *            height: 600,
 *            resizable: true,
 *            title: "Morphic Survey",
 *            closable: true, // whether the survey can be closed via a button in the titlebar
 *            minimizable: false, // whether the survey can be minimized via a button in the titlebar
 *            maximizable: false // whether the survey can be maximied via a button in the titlebar
 *        }
 *    }
 * Any valid configuration option for the `BrowserWindow` can also be specified in the `window`
 * object of the payload above without the need for any further actions on the PSP's side.
 */
fluid.defaults("gpii.app.surveyConnector", {
    gradeNames: ["fluid.modelComponent"],
    qssSettingPrefix: "http://registry\\.gpii\\.net/common/",

    model: {
        machineId: null,
        keyedInUserToken: null,
        qssSettings: []
    },

    events: {
        onSurveyRequired: null,
        onTriggerDataReceived: null
    },

    invokers: {
        requestTriggers: {
            funcName: "fluid.identity",
            args: ["{that}", "{that}.model"]
        },
        notifyTriggerOccurred: {
            funcName: "fluid.identity",
            args: [
                "{that}",
                "{arguments}.0" // trigger
            ]
        }
    }
});

/**
 * This function produces the URL of the survey which is to be displayed by adding
 * any additional information that is necessary. The URL is created as follows:
 * 1. The URL from the survey fixture is used at first.
 * 2. The "keyedInUserToken" and the "machineId" are added to the search portion
 * of the URL.
 * 3. All QSS settings whose values have been modified by the user are also added
 * to the search part of the URL.
 * @param {Component} that - The `gpii.app.staticSurveyConnector` instance.
 * @param {Object} fixture - An object describing the survey which is to be shown.
 * @param {String} fixture.url - The URL of the survey to be loaded.
 * @return {String} The URL with all additional information of the survey to be shown.
 */
gpii.app.surveyConnector.getSurveyUrl = function (that, fixture) {
    var url = new URL(fixture.url),
        searchParams = new URLSearchParams(),
        qssSettingPrefix = that.options.qssSettingPrefix;

    searchParams.set("keyedInUserToken", that.model.keyedInUserToken);
    searchParams.set("machineId", that.model.machineId);

    fluid.each(that.model.qssSettings, function (setting) {
        var path = setting.path,
            value = setting.value,
            defaultValue = setting.schema["default"];

        // in case a setting is disabled its path would be null
        if (path && path.startsWith(qssSettingPrefix) && !fluid.model.diff(value, defaultValue)) {
            var settingKey = path.slice(qssSettingPrefix.length);
            searchParams.set(settingKey, value);
        }
    });

    url.search = searchParams;

    return url.toString();
};

/**
 * Serves static payloads which reside in the GPII app itself.
 */
fluid.defaults("gpii.app.staticSurveyConnector", {
    gradeNames: ["gpii.app.surveyConnector"],
    config: {
        triggersFixture: "@expand:fluid.require({that}.options.paths.triggersFixture)",
        surveysFixture: "@expand:fluid.require({that}.options.paths.surveysFixture)"
    },
    invokers: {
        requestTriggers: {
            funcName: "gpii.app.staticSurveyConnector.requestTriggers",
            args: [
                "{that}",
                "{that}.options.config.triggersFixture"
            ]
        },
        notifyTriggerOccurred: {
            funcName: "gpii.app.staticSurveyConnector.notifyTriggerOccurred",
            args: [
                "{that}",
                "{that}.options.config.surveysFixture",
                "{arguments}.0" // triggerPayload
            ]
        }
    },
    paths: {
        triggersFixture: "%gpii-app/testData/survey/triggers.json5",
        surveysFixture: "%gpii-app/testData/survey/surveys.json5"
    }
});

/**
 * Used to retrieve the survey triggers. For this implementation a static
 * payload will always be served.
 * @param {Component} that - The `gpii.app.staticSurveyConnector` instance.
 * @param {Object[]} triggersFixture - The list of triggers
 */
gpii.app.staticSurveyConnector.requestTriggers = function (that, triggersFixture) {
    that.events.onTriggerDataReceived.fire(triggersFixture);
};

/**
 * Should be called when a trigger's conditions are met. As a result, a static
 * payload (with keyedInUserToken and machineId added as query paramenters) for
 * the survey to be displayed will be sent via the `onSurveyRequired` event.
 * @param {Component} that - The `gpii.app.staticSurveyConnector` instance.
 * @param {Object[]} surveysFixture - The list of surveys
 * @param {Object} triggerPayload - An object describing the trigger whose
 * conditions have been met.
 */
gpii.app.staticSurveyConnector.notifyTriggerOccurred = function (that, surveysFixture, triggerPayload) {
    var surveyFixture = fluid.copy(surveysFixture)[triggerPayload.id];

    fluid.log("StaticSurveyConnector: Trigger occurred - " + triggerPayload);

    if (surveyFixture) {
        surveyFixture.url = gpii.app.surveyConnector.getSurveyUrl(that, surveyFixture);

        that.events.onSurveyRequired.fire(surveyFixture);
    } else {
        fluid.fail("StaticSurveyConnector: Missing survey for trigger: " + triggerPayload.id);
    }
};

/**
 * Serves triggers and survey payloads from a remote location using the `request`
 * module.
 */
fluid.defaults("gpii.app.dynamicSurveyConnector", {
    gradeNames: ["gpii.app.surveyConnector"],

    // Contains pending requests for fetching trigger and survey data. In case the user
    // keys out, these requests should be aborted.
    members: {
        triggersRequest: null,
        surveyRequests: null
    },

    config: {
        triggersUrl: null // will be distributed from the siteConfig.json5
    },

    modelListeners: {
        "{app}.model.keyedInUserToken": {
            funcName: "gpii.app.dynamicSurveyConnector.abortPendingRequests",
            args: ["{that}"]
        }
    },

    invokers: {
        requestTriggers: {
            funcName: "gpii.app.dynamicSurveyConnector.requestTriggers",
            args: [
                "{that}",
                "{that}.options.config.triggersUrl"
            ]
        },
        notifyTriggerOccurred: {
            funcName: "gpii.app.dynamicSurveyConnector.requestSurvey",
            args: [
                "{that}",
                "{arguments}.0" // triggerPayload
            ]
        }
    }
});


/**
 * Handle the triggers response.
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance
 * @param {Object} error - Request error
 * @param {Object} response - The response metadata itself
 * @param {Object} body - The body of the response
 */
gpii.app.dynamicSurveyConnector.handleTriggersResponse = function (that, error, response, body) {
    that.triggersRequest = null;

    if (error || response.statusCode !== 200) {
        fluid.fail("Survey connector: Cannot get trigger data ", response.statusCode, error);
    } else {
        try {
            var triggers = JSON.parse(body);
            console.log("Survey connector: Triggers payload recieved - ", triggers);
            that.events.onTriggerDataReceived.fire(triggers);
        } catch (parsingError) {
            fluid.fail("Survey connector: Error parsing trigger data", parsingError, body);
        }
    }
};


/**
 * Used to retrieve the survey triggers from a remote location. Note that survey triggers
 * will always be fetched when a new user keys in (including the "noUser"). This means that
 * if the payload residing in the remote location changes between two key-ins, then the
 * surveys will also be different (i.e. survey triggers are not cached).
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance.
 * @param {String} surveyTriggersUrl - The URL that leads to the survey triggers data
 */
gpii.app.dynamicSurveyConnector.requestTriggers = function (that, surveyTriggersUrl) {
    if (surveyTriggersUrl) {
        that.triggersRequest = request(surveyTriggersUrl, gpii.app.dynamicSurveyConnector.handleTriggersResponse.bind(null, that));
    } else {
        fluid.log(fluid.logLevel.WARN, "Survey connector: Missing survey triggers URL");
    }
};


/**
 * Handle the survey response
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance
 * @param {String} triggerId - The id of the completed trigger
 * @param {Object} error - Request error
 * @param {Object} response - The response metadata itself
 * @param {Object} body - The body of the response
 */
gpii.app.dynamicSurveyConnector.handleSurveyResponse = function (that, triggerId, error, response, body) {
    delete that.surveyRequests[triggerId];

    if (error || response.statusCode !== 200) {
        fluid.fail("Survey connector: Cannot get survey data ", response.statusCode, error);
    } else {
        try {
            var surveyPayload = JSON.parse(body);
            console.log("Survey connector: Survey payload recieved - ", surveyPayload, surveyPayload.url);
            surveyPayload.url = gpii.app.surveyConnector.getSurveyUrl(that, surveyPayload);
            that.events.onSurveyRequired.fire(surveyPayload);
        } catch (parsingError) {
            fluid.fail("Survey connector: Error parsing survey data ", parsingError, body);
        }
    }
};

/**
 * Should be called when a trigger's conditions are met. As a result, the payload for the
 * corresponding survey will be fetched from a remote location (specified in the `surveyUrl`
 * property of the `triggerPayload`) and afterwards will be sent via the `onSurveyRequired` event.
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance.
 * @param {Object} triggerPayload - An object describing the trigger whose
 * conditions have been met.
 */
gpii.app.dynamicSurveyConnector.requestSurvey = function (that, triggerPayload) {
    that.surveyRequests = that.surveyRequests || {};

    if (triggerPayload.surveyUrl) {
        that.surveyRequests[triggerPayload.id] = request(
            triggerPayload.surveyUrl,
            gpii.app.dynamicSurveyConnector.handleSurveyResponse.bind(null, that, triggerPayload.id)
        );
    } else {
        fluid.log(fluid.logLevel.WARN, "Survey connector: Missing survey URL for trigger - ", triggerPayload);
    }
};

/**
 * Whenever a user keys out, this function takes care of aborting any pending requests for
 * fetching triggers and/or survey payloads data.
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance.
 */
gpii.app.dynamicSurveyConnector.abortPendingRequests = function (that) {
    // Abort the request for fetching triggers (if any)
    if (that.triggersRequest) {
        that.triggersRequest.abort();
        that.triggersRequest = null;
    }

    // Abort the request for fetching surveys (if any)
    if (that.surveyRequests) {
        var surveyRequests = fluid.values(that.surveyRequests);

        fluid.each(surveyRequests, function (surveyRequest) {
            surveyRequest.abort();
        });

        that.surveyRequests = null;
    }
};
