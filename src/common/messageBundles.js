/**
 * A component for the i18n
 *
 * Introduces a component that distributes messages over components.
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
 * components which need them via `distributeOptions` blocks which are generated
 * dynamically. Note that it expects the messages that a component uses to be located
 * under the "model". This approach makes use of the modelListeners in order for
 * re-rendering to happen after locale change.
 */
fluid.defaults("gpii.app.messageBundles", {
    gradeNames: ["fluid.modelComponent", "{that}.options.messageDistributorGrade"],

    model: {
        locale: null, // default will be used

        // keep messages here in order to make use
        // of the model events system
        messages: {}
    },

    defaultLocale: "en",

    messageBundlesPath: "build/gpii-app-messageBundles.json",

    messageBundles: "@expand:gpii.app.messageBundles.loadMessageBundles({that}.options.messageBundlesPath)",

    modelListeners: {
        // Will be called on init
        "locale": {
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
 * `distributeOptions` block. This name of the grade is returned as a result of this
 * function and is applied to the `messageBundles` component. This is the raw dynamic
 * grades mechanism described here: https://docs.fluidproject.org/infusion/development/ComponentGrades.html#raw-dynamic-grades.
 * By using this mechanism this component is constructed before the other components.
 * This is important because distributeOptions will be considered only if they are present
 * when the component to which they have been distributed to inializes later. This means
 * that the distributor should be created first.
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
 * @param messageBundlesPath {String} The path to the messageBundles file relative
 * to the project directory.
 * @return {Object} The parsed message bundles for the different locales.
 */
gpii.app.messageBundles.loadMessageBundles = function (messageBundlesPath) {
    var resolvedPath = require("path").resolve(messageBundlesPath);
    return require(resolvedPath);
};

/**
 * Updates the currently used messages depending on the provided locale. In case
 * there are no messages available for this locale, the default locale messages
 * will be used.
 * @param that {Component} The `gpii.app.messageBundles` instance.
 * @param messageBundles {Object} A map containing the messages for all available
 * locales.
 * @param locale {String} The new locale.
 * @param defaultLocale {String} The default locale.
 */
gpii.app.messageBundles.updateMessages = function (that, messageBundles, locale, defaultLocale) {
    var messages = messageBundles[locale];

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
 * @param messageKey {String} a key from the `messages` object.
 * @return {String} The grade name to which this key is related to (except that it will
 * contain _ insted of . as separators).
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
 * @param messageKey {String} a key from the `messages` object.
 * @return {String} The simple message key referenced within the component.
 */
gpii.app.messageBundles.getSimpleMessageKey = function (messageKey) {
    var keyDelimiterIndex = messageKey.lastIndexOf("_");
    return messageKey.slice(keyDelimiterIndex + 1);
};

/**
 * Given a map which contains all messages for a given locale, groups the messages by
 * component grades.
 * @param {Object} messages A map with all the messages for a given locale.
 * @return {Object} A map whose keys are individual component grade names (which contain
 * _ instead of . as separators) and the values are maps whose keys are the simple
 * message keys and the values are the message strings themselves.
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
 * Constructs an object which can be used as a `distributeOptions` value to distribute IoC
 * message references to the components that need them. Dependent components are extracted
 * from the message keys and in the constructed object, there exist a key for every such
 * component.
 * @param currentMessages {Object} A map of all messages.
 * @return {Object} A map of namespaced distributeOptions blocks.
 */
gpii.app.messageBundles.getMessageDistributions = function (currentMessages) {
    var groupedMessages = gpii.app.messageBundles.groupMessagesByComponent(currentMessages),
        dependentPath = "{/ %componentName}.options.model.messages",
        binding = "{gpii.app.messageBundles}.model.messages.%componentKey";

    return fluid.keys(groupedMessages).reduce(function (distributions, componentKey) {
        var componentName = componentKey.replace(/_/g, ".");

        distributions[componentName] = {
            target: fluid.stringTemplate(dependentPath, {componentName: componentName}),
            record: fluid.stringTemplate(binding, {
                componentKey: componentKey
            })
        };

        return distributions;
    }, {});
};
