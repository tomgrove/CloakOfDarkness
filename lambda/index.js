/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */

const Alexa = require('ask-sdk');
const i18n = require('i18next');
const AWS = require('aws-sdk');

const cloak = require('./cloak.js');

const intentToVerb =
{
    "PlayerTakeIntent"      : { verb: "take", slot: "item" },
    "PlayerDropIntent"      : { verb: "drop", slot: "item" },
    "PlayerExamineIntent"   : { verb: "examine", slot: "item" },
    "PlayerReadIntent"      : { verb: "read", slot: "item" },
    "PlayerLookIntent"      : { verb: "look" },
    "PlayerInventoryIntent" : { verb: "inventory"},
    "PlayerHangIntent"      : { verb: "hang", slot: "item" },
    "PlayerWearingIntent"   : { verb: "wearing" } 
};

const LaunchRequest = {
  canHandle(handlerInput) {
    return Alexa.isNewSession(handlerInput.requestEnvelope) 
      || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
      
    const { attributesManager } = handlerInput;

    var gamestate = cloak.newGameState();
    attributesManager.setSessionAttributes( gamestate);
    
    const title = 'welcome to cloak of darkness! <break time="500ms"/>';
    const speechOutput = title + cloak.doAction( gamestate, "look" )  + '<break time="250ms"/>' + cloak.messages.WHATDOYOUWANTTODO; 

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(cloak.messages.WHATDOYOUWANTTODO)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak('thanks for playing!')
      .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' 
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
 
    return handlerInput.responseBuilder
      .speak('tell me what you would like to do. For example: "go north"<break time="250ms"/> or<break time="250ms"/> "take ticket"')
      .reprompt(cloak.messages.WANTDOYOUWANTTODO)
      .getResponse();
  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak(cloak.messages.IDONTUNDERSTAND)
      .reprompt(cloak.messages.WHATDOYOUWANTTODO)
      .getResponse();
  },
};

const PlayerMoveIntent = {
  canHandle(handlerInput) {
  return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayerMoveIntent';
  },
  handle(handlerInput) {
    var direction = Alexa.getSlotValue(handlerInput.requestEnvelope, 'direction');
    const { attributesManager } = handlerInput;
    const gamestate = attributesManager.getSessionAttributes();
        
   var response =  cloak.doAction( gamestate, direction );
    
    return handlerInput.responseBuilder
      .speak(response)
      .reprompt(cloak.messages.WHATDOYOUWANTTODO)
      .getResponse();
  },
};

const PlayerActionIntent = {
  canHandle(handlerInput) {
  return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && intentToVerb[ Alexa.getIntentName(handlerInput.requestEnvelope) ] 
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const gamestate = attributesManager.getSessionAttributes();
    
    var response ="";
    var verb =  intentToVerb[ Alexa.getIntentName(handlerInput.requestEnvelope) ] ;
    if ( verb.slot ) {
        var item = Alexa.getSlotValue(handlerInput.requestEnvelope, verb.slot);
        response =  cloak.doAction( gamestate, verb.verb, item);
    } else
    {
         response =  cloak.doAction( gamestate, verb.verb );
    }
    
    if( !gamestate.completed ) {
        return handlerInput.responseBuilder
            .speak(response)
            .reprompt(cloak.messages.WHATDOYOUWANTTODO)
            .getResponse();
    } else {
         return handlerInput.responseBuilder
            .speak(response)
            .getResponse();
        }
    },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
      .speak("an error has occurred")
      .reprompt("an error has occurred")
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    ExitHandler,
    SessionEndedRequest,
    HelpIntent,
    PlayerMoveIntent,
    PlayerActionIntent,
    UnhandledIntent
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
