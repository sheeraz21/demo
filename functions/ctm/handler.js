// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
exports.handler = function (event, context) {
    try {

        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        console.log(event.request.type);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }


        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        }
        else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};
/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback,session);
}
var CARD_TITLE = "Med";
function getWelcomeResponse(callback,session) {
    var sessionAttributes = {},
        speechOutput = "Hi user one, did you had your med",
        shouldEndSession = false,
    sessionAttributes = {
        "userPromptedToContinue":true
    };
    console.log("heresss")
    console.log(Object.keys(dynamodb));

    dynamodb.putItem({
        TableName: 'med_record',
        Item: {
            sessionId: {
                S: session.sessionId
            },
            userId: {
                S: session.user.userId
            }
        }
    }, function (err, data) {

        if (err) {
            console.log(err, err.stack);
        }
    });
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, '', shouldEndSession));
}
function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}
/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // handle yes/no intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        }
    }
    if ("NotWellIntent" === intentName) {
     handleNotWell(intent, session, callback);
   } else if ("AMAZON.StartOverIntent" === intentName) {
       getWelcomeResponse(callback,session);
   }
}
function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    var msg='';
    if(intent.name==="AMAZON.NoIntent") {
      msg="please take your med"
    } else {
      msg="Thanks for reply"
    }
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(msg, "", true));
}
function handleNotWell(intent, session, callback) {

    callback(session.attributes,
        buildSpeechletResponseWithoutCard("don't worry you will be fine, drink two glass of water", "", true));
}
function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}
