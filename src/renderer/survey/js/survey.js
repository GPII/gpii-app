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
(function () {
    var shell = require("electron").shell,
        ipcRenderer = require("electron").ipcRenderer;

    $(function () {
        var webview = $("webview")[0];

        webview.getWebContents().on("new-window", function (event, url) {
            shell.openExternal(url);
        });

        webview.addEventListener("ipc-message", function (event) {
            ipcRenderer.send(event.channel, event.args);
        });

        ipcRenderer.on("openSurvey", function (event, surveyParams) {
            webview.src = surveyParams.url;
        });
    });
})();
