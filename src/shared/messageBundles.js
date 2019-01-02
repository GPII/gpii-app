/**
 * A component which handles the i18n of the PSP.
 *
 * Introduces a component that distributes messages to components.
 *
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var gpii = fluid.registerNamespace("gpii");

/**
 * Represents messages for a single component.
 * It simply follows the format:
 * ```
 * {
 *     <messageKey>: <message>,
 *     ...
 * }
 * ```
 *
 * For example:
 * ```
 * {
 *     keyOut: "Key out",
 *     ...
 * }
 * ```
 *
 * @typedef {Object.<String, String>} ComponentMessages
 */


/**
 * An object representing messages for all different components.
 * Keys are individual component grade names (which contain
 * _ instead of . as separators) and the values are maps of messages
 * for a component.
 * It follows the format:
 * {
 *     <full_component_name>: <ComponentMessages>,
 *     ...
 * }
 *
 * Example with multiple locales:
 * ```
 * {
 *      gpii_app_menu: {
 *          keyOut: "Key out",
 *          keyedIn: "Keyed in with %snapsetName",
 *          ...
 *      },
 *      gpii_app_psp_header: {
 *          autosaveText": "Auto-save is on",
 *          keyOut": "Key Out",
 *          ...
 *      },
 *      ...
 * }
 * ```
 *
 * @typedef {Object.<String, ComponentMessages>} GroupedMessages
 */


/**
 * Holds all messages for the various components in the application (including
 * the renderer components). The model contains the current locale and the
 * messages applicable to it. The `messageBundles` option is loaded synchronously
 * when this component is instantiated and is a map whose keys represent the
 * supported locales for the application and the values are the messages for these
 * locales. The messages in turn are also maps whose keys start with the gradeName
 * to which the message is relative (but the dots are replaced with underscores) and
 * end with the simple name of the message key which is referenced in the component.
 * For example, here is an entry from the "en" locale:
 *     en: {
 *       "gpii_psp_header_autosaveText": "Auto-save is on",
 *       ...
 *     }
 * It means that the "Auto-save is on" message should be the value of the `autosaveText`
 * property within the model's messages object of the "gpii.psp.header" component.
 *
 * This component has a `messageDistributor` subcomponent which is created
 * programmatically and it takes care of providing the necessary messages to the
 * components which need them via dynamically generated `distributeOptions` blocks.
 * Note that the messages that a component uses must to be located in the "model".
 * This approach makes use of the modelListeners in order for re-rendering to happen
 * when the locale changes.
 */
fluid.defaults("gpii.app.messageBundles", {
    gradeNames: ["fluid.modelComponent", "{that}.options.messageDistributorGrade"],

    model: {
        locale: null, // the defaultLocale will be used initially
        messages: {}
    },

    defaultLocale: "en",

    messageBundlesPath: "build/gpii-app-messageBundles.json",

    messageBundles: "@expand:gpii.app.messageBundles.loadMessageBundles({that}.options.messageBundlesPath)",

    modelListeners: {
        locale: {
            func: "{that}.updateMessages"
        }
    },

    messageDistributorGrade: {
        expander: {
            funcName: "gpii.app.messageBundles.getMessageDistributorGrade",
            args: [
                "{that}.options.messageBundles",
                "{that}.options.defaultLocale"
            ]
        }
    },

    invokers: {
        updateMessages: {
            funcName: "gpii.app.messageBundles.updateMessages",
            args: [
                "{that}",
                "{that}.options.messageBundles",
                "{that}.model.locale",
                "{that}.options.defaultLocale"
            ]
        }
    }
});

/**
 * This function creates a `messageDistributor` grade which has a dynamically generated
 * `distributeOptions` block. The name of the grade is returned as a result of this
 * function and is applied to the `messageBundles` component. By using this raw dynamic grade
 * mechanism this component is constructed before the other components. This is important
 * because distributeOptions will be considered only at creation time. This means that the
 * distributor should be created before any other components to which it distributes
 * messages.
 * @param {Object} messageBundles - An object containing all i18n messages for all supported
 * locales
 * @param {String} defaultLocale - A string representing the default locale.
 * @return {String} The name of the distributor grade.
 */
gpii.app.messageBundles.getMessageDistributorGrade = function (messageBundles, defaultLocale) {
    var defaultMessages = messageBundles[defaultLocale],
        distributions = gpii.app.messageBundles.getMessageDistributions(defaultMessages);

    fluid.defaults("gpii.app.messageDistributor", {
        gradeNames: "fluid.component",
        distributeOptions: distributions
    });

    return "gpii.app.messageDistributor";
};

/**
 * Loads synchronously and parses the messageBundles file.
 * @param {String} messageBundlesPath - The path to the messageBundles file relative
 * to the project directory.
 * @return {Object} The parsed message bundles for the different locales.
 */
gpii.app.messageBundles.loadMessageBundles = function (messageBundlesPath) {
    var messageBundles;

    if (fluid.require) {
        // Approach for loading messages in the main process
        messageBundles = fluid.require("%gpii-app/" + messageBundlesPath);
    } else {
        // Approach for loading messages in the renderer process
        var resolvedPath = require("path").join(__dirname, "../../..", messageBundlesPath);
        messageBundles = require(resolvedPath);
    }

    return messageBundles;
};

/**
 * Updates the currently used messages depending on the provided locale. In case
 * there are no messages available for this locale, the default locale messages
 * will be used.
 * @param {Component} that - The `gpii.app.messageBundles` instance.
 * @param {Object} messageBundles - A map containing the messages for all available
 * locales.
 * @param {String} locale - The new locale.
 * @param {String} defaultLocale - The default locale.
 */
gpii.app.messageBundles.updateMessages = function (that, messageBundles, locale, defaultLocale) {
    // make sure the locale is in proper state
    locale = locale || "";

    var genericLocale = locale.split("-")[0];
    var messages = messageBundles[locale.toLowerCase()] || messageBundles[genericLocale];

    if (!messages) {
        fluid.log(fluid.logLevel.WARN, "Bundles for locale - " + locale + " - are missing. Using default locale of: " + defaultLocale);
        messages = messageBundles[defaultLocale];
    }

    var groupedMessages = gpii.app.messageBundles.groupMessagesByComponent(messages);
    that.applier.change("messages", groupedMessages);
};

/**
 * Given a message key from the `messages` model object, this function returns the
 * portion of the key which pertains to the name of the component. For example, for
 * the "gpii_psp_header_autosaveText" key, this function would return "gpii_psp_header".
 * @param {String} messageKey - a key from the `messages` object.
 * @return {String} The grade name to which this key is related to (except that it will
 * contain _ insteаd of . as separators).
 */
gpii.app.messageBundles.getComponentKey = function (messageKey) {
    var keyDelimiterIndex = messageKey.lastIndexOf("_");
    return messageKey.slice(0, keyDelimiterIndex);
};

/**
 * Given a message key from the `messages` model object, this function returns the
 * portion of the key which is the simple message key referenced within the corresponding
 * component. For example, for the "gpii_psp_header_autosaveText" key, this function would
 * return "autosaveText".
 * @param {String} messageKey - a key from the `messages` object.
 * @return {String} The simple message key referenced within the component.
 */
gpii.app.messageBundles.getSimpleMessageKey = function (messageKey) {
    var keyDelimiterIndex = messageKey.lastIndexOf("_");
    return messageKey.slice(keyDelimiterIndex + 1);
};

/**
 * Given a map which contains all messages for a given locale, this function groups the
 * messages by component grades.
 * @param {Object} messages - A map with all the messages for a given locale.
 * @return {GroupedMessages} An object representing the messages grouped by component.
 */
gpii.app.messageBundles.groupMessagesByComponent = function (messages) {
    var groupedMessages = {};

    fluid.each(messages, function (message, key) {
        var componentKey = gpii.app.messageBundles.getComponentKey(key),
            simpleMessageKey = gpii.app.messageBundles.getSimpleMessageKey(key);

        var messageObj = {};
        messageObj[simpleMessageKey] = message;

        groupedMessages[componentKey] = fluid.extend(true, {}, groupedMessages[componentKey], messageObj);
    });
    return groupedMessages;
};

/**
 * Constructs an object which can be used as a `distributeOptions` value to distribute model
 * listeners for updating the messages of i18n components in the application. The keys of the
 * returned object are the names of the components to which the model listeners need to be
 * distributed.
 * @param {Object} currentMessages - A map of all messages for a given locale.
 * @return {Object} A map of namespaced distributeOptions blocks.
 */
gpii.app.messageBundles.getMessageDistributions = function (currentMessages) {
    var groupedMessages = gpii.app.messageBundles.groupMessagesByComponent(currentMessages),
        dependentPath = "{/ %componentName}.options.modelListeners";

    return fluid.keys(groupedMessages).reduce(function (distributions, componentKey) {
        var componentName = componentKey.replace(/_/g, ".");

        distributions[componentName] = {
            target: fluid.stringTemplate(dependentPath, {componentName: componentName}),
            record: {
                "{gpii.app.messageBundles}.model.messages": {
                    funcName: "gpii.app.messageBundles.setComponentMessages",
                    args: ["{that}", "{change}.value"]
                }
            }
        };

        return distributions;
    }, {});
};

/**
 * Compiles and sets the messages for a given component. This is done by examining all grade
 * names for the component and adding their messages to the resulting set of messages. In
 * case there are messages with the same key for different grade names, the rightmost grade
 * name's messages will have priority.
 * @param {Component} that - The component whose messages need to be compiled and set.
 * @param {Object} messageBundles - A hash containing the messages for the various grade names.
 */
gpii.app.messageBundles.setComponentMessages = function (that, messageBundles) {
    var gradeNames = that.options.gradeNames;

    var newMessages = gradeNames.reduce(function (messages, grade) {
        var messageKey = grade.replace(/\./g, "_");
        return Object.assign(messages, messageBundles[messageKey]);
    }, {});

    that.applier.change("messages", newMessages);
};
