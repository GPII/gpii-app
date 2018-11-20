/*
 * GPII App Storage mechanism
 *
 * A component responsible for storing and retrieving data which is essential for the proper
 * operation of the GPII app.
 * Copyright 2018 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    fs = require("fs"),
    gpii = fluid.registerNamespace("gpii");

/**
 * A component for storing and retrieving GPII app data. Everything that needs to be persisted
 * has to be a property in the `model` of the `gpii.app.storage` component.
 *
 * Whenever the component detects a model change, the whole model will be written asynchronously
 * to a JSON file in the `gpiiSettingsDir` whose simple name is given in the `storageFilePath`
 * option.
 *
 * When this component is created, it tries to load from the file system the data that has already
 * been saved. In case no such exists or is in a wrong format, the `storage` component will report
 * an error but the application will continue to function.
 */
fluid.defaults("gpii.app.storage", {
    gradeNames: ["fluid.modelComponent"],

    storageFilePath: "storage.json",

    absoluteStorageFilePath: {
        expander: {
            funcName: "gpii.app.storage.getAbsoluteStorageFileName",
            args: ["{that}.options.storageFilePath"]
        }
    },

    model: {
        // The data to be stored to the file system
    },

    modelListeners: {
        "": {
            func: "{that}.persistData",
            args: ["{change}.value"],
            excludeSource: ["init", "retrieveData"]
        }
    },

    listeners: {
        onCreate: {
            func: "{that}.retrieveData"
        }
    },

    invokers: {
        persistData: {
            funcName: "gpii.app.storage.persistData",
            args: [
                "{that}",
                "{arguments}.0" // data
            ]
        },
        retrieveData: {
            funcName: "gpii.app.storage.retrieveData",
            args: ["{that}"]
        }
    }
});

/**
 * Returns the absolute path in the file system of the file where the `storage` component will
 * save its model and from where the saved data will be fetched.
 * @param {String} storageFilePath - The simple name of the file.
 * @return {String} The absolute path to the storage file.
 */
gpii.app.storage.getAbsoluteStorageFileName = function (storageFilePath) {
    var settingsDirComponent = gpii.settingsDir(),
        gpiiSettingsDir = settingsDirComponent.getGpiiSettingsDir();

    return fluid.stringTemplate("%gpiiSettingsDir/%storageFilePath", {
        gpiiSettingsDir: gpiiSettingsDir,
        storageFilePath: storageFilePath
    });
};

/**
 * Persists asynchronously by writing to a file the provided `data`.
 * @param {Component} that - The `gpii.app.storage` instance.
 * @param {Object} data - The data to be persisted.
 * @return {Promise} A promise which will be resolved when the persistence completes and will
 * be rejected otherwise.
 */
gpii.app.storage.persistData = function (that, data) {
    var togo = fluid.promise(),
        stringifiedData = JSON.stringify(data);

    fs.writeFile(that.options.absoluteStorageFilePath, stringifiedData, function (error) {
        if (error) {
            fluid.log(fluid.logLevel.WARN, "GPII storage: Cannot persist data", error);
            togo.reject(error);
        } else {
            togo.resolve();
        }
    });

    return togo;
};

/**
 * Retrieves asynchronously data to be used as the new model for the `storage` component.
 * @param {Component} that - The `gpii.app.storage` instance.
 * @return {Promise} A promise which will be resolved when the retrieval completes and will
 * be rejected otherwise.
 */
gpii.app.storage.retrieveData = function (that) {
    var togo = fluid.promise();

    fs.readFile(that.options.absoluteStorageFilePath, function (error, data) {
        if (error) {
            fluid.log(fluid.logLevel.WARN, "GPII storage: Cannot retrieve data", error);
            togo.reject(error);
        } else {
            try {
                var parsedData = JSON.parse(data);
                that.applier.change("", parsedData, "ADD", "retrieveData");
                togo.resolve(parsedData);
            } catch (parsingError) {
                fluid.log(fluid.logLevel.WARN, "GPII storage: Cannot parse retrieved data", parsingError);
                togo.reject(parsingError);
            }
        }
    });

    return togo;
};
