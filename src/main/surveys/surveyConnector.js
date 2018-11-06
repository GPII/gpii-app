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
 * events mentioned above on its own. The `gpii.app.dynamicSurveyConnector` is currently the only
 * implementation - survey and trigger payloads are fetched from a remote location.
 *
 * When a user keyes in (including the "noUser"), the `surveyConnector` will request the survey
 * triggers by issuing an HTTP request to the URL specified in the `siteConfig.json5` file. The
 * `keyedInUserToken` and the `machineId` will be appended to the query string in the URL.
 *
 * The survey server will return an array of trigger objects in the following format:
 *     {
 *         id: <trigger_id>, // mandatory, used to distinguish the triggers
 *         surveyUrl: <surveyUrl>, // optional - the URL of the survey if it is in a remote location
 *         conditions: {
 *             // lists all conditions that need to be satisfied for this trigger
 *         }
 *     }
 *
 * When the conditions for a survey trigger have been satisfied, the `surveyConnector` will make an
 * HTTP request to the `surveyUrl` specified in the trigger payload. Again, the "keyedInUserToken"
 * and "machineId" will be appended as query string parameters to this URL.
 *
 * The survey payload will have the following format:
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
 * Transforms a URL by appending the key-value pairs in the passed `params` object
 * to the search string portion of the URL.
 * @param {String} sourceUrl - the URL which is to be modified.
 * @param {Object} params - an object containing additional parameters to be added
 * to the search string of the URL.
 * @return {String} The modified URL.
 */
gpii.app.surveyConnector.transformUrl = function (sourceUrl, params) {
    var url = new URL(sourceUrl),
        searchParams = new URLSearchParams(url.searchParams);

    fluid.each(params, function (value, key) {
        searchParams.set(key, value);
    });

    url.search = searchParams;

    return url.toString();
};

/**
 * This function produces the URL of the survey triggers payload and the surveys
 * payload which are to be loaded whenever a new user keys in. The URL is created
 * by adding the "keyedInUserToken" and the "machineId" to the search part of the URL.
 * @param {Component} that - The `gpii.app.staticSurveyConnector` instance.
 * @param {String} dataUrl - The URL of the resource which is to be loaded.
 * @return {String} The modified URL of the resource to be loaded.
 */
gpii.app.surveyConnector.transformDataUrl = function (that, dataUrl) {
    var params = fluid.filterKeys(that.model, ["keyedInUserToken", "machineId"]);
    return gpii.app.surveyConnector.transformUrl(dataUrl, params);
};

/**
 * This function produces the URL of the survey which is to be displayed by adding
 * any additional information that is necessary. The URL is created as follows:
 * 1. The URL from the survey fixture is used at first.
 * 2. The "keyedInUserToken" and the "machineId" are added to the search portion
 * of the URL.
 * 3. All QSS settings whose values have been modified by the user are also added
 * to the search part of the URL.
 * @param {Component} that - The `gpii.app.staticSurveyConnector` instance.
 * @param {String} surveyUrl - The URL of the survey to be loaded.
 * @return {String} The URL with all additional information of the survey to be shown.
 */
gpii.app.surveyConnector.transformSurveyUrl = function (that, surveyUrl) {
    var params = fluid.filterKeys(that.model, ["keyedInUserToken", "machineId"]),
        qssSettingPrefix = that.options.qssSettingPrefix;

    fluid.each(that.model.qssSettings, function (setting) {
        var path = setting.path,
            value = setting.value,
            defaultValue = setting.schema["default"];

        // in case a setting is disabled its path would be null
        if (path && path.startsWith(qssSettingPrefix) && !fluid.model.diff(value, defaultValue)) {
            var settingKey = path.slice(qssSettingPrefix.length);
            params[settingKey] = value;
        }
    });

    return gpii.app.surveyConnector.transformUrl(surveyUrl, params);
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
        pendingRequests: []
    },

    config: {
        surveyTriggersUrl: null // will be distributed from the siteConfig.json5
    },

    modelListeners: {
        "{app}.model.keyedInUserToken": {
            func: "{that}.abortPendingRequests"
        }
    },

    invokers: {
        requestTriggers: {
            funcName: "gpii.app.dynamicSurveyConnector.requestTriggers",
            args: [
                "{that}",
                "{that}.options.config.surveyTriggersUrl"
            ]
        },
        notifyTriggerOccurred: {
            funcName: "gpii.app.dynamicSurveyConnector.requestSurvey",
            args: [
                "{that}",
                "{arguments}.0" // triggerPayload
            ]
        },
        abortPendingRequests: {
            funcName: "gpii.app.dynamicSurveyConnector.abortPendingRequests",
            args: ["{that}"]
        },
        requestData: {
            funcName: "gpii.app.dynamicSurveyConnector.requestData",
            args: [
                "{that}",
                "{arguments}.0" // url
            ]
        }
    }
});

/**
 * Removes a pending request from the array of pending request for the
 * survey connector.
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance.
 * @param {Object} requestToRemove - The HTTP request object to be removed.
 */
gpii.app.dynamicSurveyConnector.removePendingRequest = function (that, requestToRemove) {
    fluid.remove_if(that.pendingRequests, function (pendingRequest) {
        return pendingRequest === requestToRemove;
    });
};

/**
 * Retrieves data from a remote location. Information about the "keyedInUserToken"
 * and the "machineId" will be appended to the URL as query string parameters.
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance.
 * @param {String} url - The URL of the data to be retrieved.
 * @return {Promise} - A promise which will be resolved (with the data) or
 * rejected depending on the outcome of the operation.
 */
gpii.app.dynamicSurveyConnector.requestData = function (that, url) {
    var togo = fluid.promise(),
        transformedUrl = gpii.app.surveyConnector.transformDataUrl(that, url),
        pendingRequest = request(transformedUrl, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                fluid.log(fluid.logLevel.WARN, "Survey connector: Cannot get data", url, response.statusCode, error);
                togo.reject("Survey connector: Cannot get data");
            } else {
                try {
                    var parsedResponse = JSON.parse(body);
                    togo.resolve(parsedResponse);
                } catch (parsingError) {
                    fluid.log(fluid.logLevel.WARN, "Survey connector: Error parsing data", url, parsingError, body);
                    togo.reject("Survey connector: Error parsing data");
                }
            }
        }),
        onComplete = gpii.app.dynamicSurveyConnector.removePendingRequest.bind(null, that, pendingRequest);

    that.pendingRequests.push(pendingRequest);

    // Remove the pending request regardless of whether the promise is resolved or rejected
    togo.then(onComplete, onComplete);

    return togo;
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
        that.requestData(surveyTriggersUrl).then(function (triggers) {
            that.events.onTriggerDataReceived.fire(triggers);
        });
    } else {
        fluid.log(fluid.logLevel.WARN, "Survey connector: Missing survey triggers URL");
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
    if (triggerPayload.surveyUrl) {
        that.requestData(triggerPayload.surveyUrl).then(function (surveyPayload) {
            surveyPayload.url = gpii.app.surveyConnector.transformSurveyUrl(that, surveyPayload.url);
            that.events.onSurveyRequired.fire(surveyPayload);
        });
    } else {
        fluid.log(fluid.logLevel.WARN, "Survey connector: Missing survey URL for trigger - ", triggerPayload);
    }
};

/**
 * Whenever a user keys out, this function takes care of aborting any pending requests
 * for fetching triggers and/or survey payloads data.
 * @param {Component} that - The `gpii.app.dynamicSurveyConnector` instance.
 */
gpii.app.dynamicSurveyConnector.abortPendingRequests = function (that) {
    fluid.each(that.pendingRequests, function (pendingRequest) {
        pendingRequest.abort();
    });

    that.pendingRequests = [];
};
