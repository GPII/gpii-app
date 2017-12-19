/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

"use strict";
/**
 * The preload script for the webview which will embed the survey content.
 * As the webview runs in a separate process than the PSP, the
 * communication between the application and the embedded content will
 * be asynchronous.
 * This script will be loaded before other scripts in the guest page. It
 * has access to all Node API (including the `ipcRenderer`). All DOM
 * manipulations (e.g. attaching event listeners, adding new elements, etc.)
 * need to be performed only after the DOM content has loaded.
 */
(function () {
    var ipcRenderer = require("electron").ipcRenderer;

    /**
     * Checks whether a given DOM element is a 'break out' link, i.e.
     * whether it is an anchor tag whose target is blank and which has
     * the `flc-breakOut` class. The `flc-breakOut` class helps the
     * application distinguish between regular links that should open in a
     * new browser window and the 'break out' link which should also
     * close the survey pop-up.
     * @param target {Element} The DOM element to be checked.
     */
    function isBreakOutLink(target) {
        return target && target.nodeName === "A" && target.target === "_blank"
                && target.classList.contains("flc-breakOut");
    }

    /**
     * Checks whether a given DOM element is a close button within the
     * survey's content.
     * @param target {Element} The DOM element to be checked.
     */
    function isCloseButton(target) {
        return target && target.classList.contains("flc-closeBtn");
    }

    /**
     * Sends an IPC message to the hosting `BrowserWindow` indicating that
     * the survey should be closed.
     */
    function closeSurvey() {
        ipcRenderer.sendToHost("onSurveyClose");
    }

    /**
     * Adds a listener which notifies the host `BrowserWindow` that it
     * needs to close as a result of the user clicking on the 'break out'
     * link. The listener is attached to the document instead of to
     * specific anchor tags because the 'break out' link may not be
     * present at the time of loading the document. The latter is due to
     * the fact that Qualtrics surveys are SPA and handle internally
     * navigation to new pages within the survey.
     */
    function addBreakOutLinkListener() {
        document.body.addEventListener("click", function (event) {
            if (isBreakOutLink(event.target) || isCloseButton(event.target)) {
                // The timeout is needed so that the default action of the
                // link can execute before the dialog is closed and destroyed.
                setTimeout(closeSurvey);
            }
        });
    }

    /**
     * Sends an `onSurveyClose` IPC message to the host page automatically
     * when the survey end has been reached. In order to do this, the webview
     * registers a `MutationObserver` which listens for changes in the DOM
     * of the whole page. Whenever such a change occurs, instead of iterating
     * through the changes manually (using the argument passed to the callback
     * function), an attempt to find an element with id `EndOfSurvey` is made.
     * If such an element does exist, this means that the user has reached the
     * end of the survey.
     */
    function addEndOfSurveyListener() {
        new MutationObserver(function () {
            // It is much faster to try to find an element by its id instead of
            // looking though the array of mutations which is passed as an
            // argument to the `MutationObserver` callback.
            var endOfSurveyElement = document.getElementById("EndOfSurvey");
            if (endOfSurveyElement) {
                this.disconnect(); // detach the `MutationObserver`
                closeSurvey();
            }
        }).observe(document, {
            subtree: true,
            childList: true
        });
    }

    /**
     * Contains all the code for initializing the webview (e.g. attaching
     * listeners, handling IPC communication, etc).
     */
    function initWebview() {
        // Wait for the DOM to initialize and then attach necessary listeners.
        document.addEventListener("DOMContentLoaded", function () {
            addBreakOutLinkListener();
        });

        ipcRenderer.on("openSurvey", function (event, closeOnSubmit) {
            if (closeOnSubmit) {
                addEndOfSurveyListener();
            }
        });
    }

    initWebview();
})();
