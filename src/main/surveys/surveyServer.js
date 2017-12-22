"use strict";
var WebSocket = require("ws");

var wss = new WebSocket.Server({ port: 3334 });

wss.on("connection", function connection(ws) {
    var keyedInUserToken = null,
        machineId = null;

    function handleTriggersRequest(keyedInData) {
        keyedInUserToken = keyedInData.userId;
        machineId = keyedInData.machineId;
        console.log("Survey Triggers Requested: ", keyedInData);

        var triggerFixture = {
            type: "surveyTrigger",
            value: {
                conditions: {
                    all: [{
                        fact: "keyedInBefore",
                        operator: "greaterThanInclusive",
                        value: 1000 * 5 // 5 secs
                    }]
                },
                id: "id",
                urlTriggerHandler: "URL of the survey server to handle the surveyTriggerEvent"
            }
        };

        ws.send(JSON.stringify(triggerFixture));
    }

    function handleTriggerOccurrance(trigger) {
        console.log("Survey Trigger Occured: ", trigger);

        var surveyRawPayloadFixture = {
            type: "survey",
            value: {
                "url": "https://umdsurvey.umd.edu/jfe/form/SV_8cX5wEIuJsGjuux?keyedInUserToken=" + keyedInUserToken + "&machineId=" + machineId,
                "closeOnSubmit": false,
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
        var value = message.value,
            type = message.type;

        switch (type) {
        case "triggersRequest":
            handleTriggersRequest(value);
            break;
        case "triggerOccurred":
            handleTriggerOccurrance(value);
            break;
        }
    });

    console.log("Survey Server Connection");
});
