var WebSocket = require("ws");

var wss = new WebSocket.Server({ port: 3333 });


wss.on("connection", function connection(ws) {
    function handleTriggersRequest(keyedInData) {
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
                "url": "https://www.example.com/surveyA/?safeid=longcodeA",
                "window": {
                    "height": 600,  //optional
                    "width": 800,   //optional
                    "userResizable": true,
                    "titleBar": {
                        "title": "GPII Auto-Personalization Survey",
                        // "icon": "icon asset", //use gear-cloud icon by default
                        "closeButton": true,     //default
                        "minimizeButton": false, //default
                        "maximizeButton": false  //default
                    }
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
