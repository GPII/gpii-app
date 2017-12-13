"use strict";
var WebSocket = require("ws");

var wss = new WebSocket.Server({ port: 3333 });

wss.on("connection", function connection(ws) {
    var keyedInUserToken = null;

    function handleTriggersRequest(keyedInData) {
        keyedInUserToken = keyedInData.userId;
        console.log("Survey Triggers Requested: ", keyedInData);

        var triggerFixture = {
            surveyTrigger: {
                conditions: [
                    {
                        "minutesSinceKeyIn": 3
                    }
                ],
                id: "id",
                urlTriggerHandler: "URL of the survey server to handle the surveyTriggerEvent"
            }
        };

        ws.send(JSON.stringify(triggerFixture));
    }

    function handleTriggerOccurrance(trigger) {
        console.log("Survey Trigger Occured: ", trigger);

        var surveyRawPayloadFixture = {
            survey: {
                "url": "https://survey.az1.qualtrics.com/jfe/form/SV_7QWbGd4JuGmSu33?keyedInUserToken=" + keyedInUserToken,
                "window": {
                    "width": 800,   //optional
                    "height": 600,  //optional
                    "resizable": true,

                    "title": "GPII Auto-Personalization Survey",
                    // "icon": "icon asset", //use gear-cloud icon by default
                    "closable": true,     //default
                    "minimizable": false, //default
                    "maximizable": false  //default
                }
            }
        };

        ws.send(JSON.stringify(surveyRawPayloadFixture));
    }


    ws.on("message", function incoming(message) {
        message = JSON.parse(message);
        var payload = message.payload,
            type = message.type;

        switch (type) {
        case "triggersRequest":
            handleTriggersRequest(payload);
            break;
        case "triggerOccurred":
            handleTriggerOccurrance(payload);
            break;
        }
    });

    console.log("Survey Server Connection");
});
