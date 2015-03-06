'use strict';

var ENGINE_SERVER_PORT = 8000;
var EVENT_SERVER_PORT = 7070;
var ACCESS_KEY = '123';
var JSON_CONTENT_TYPE = 'application/json';

var express = require('express');
var bodyParser = require('body-parser');

// Engine Server
var engineServer = express();

engineServer.post('/queries.json', function (req, res) {
  if (req.is(JSON_CONTENT_TYPE)) {
    res.status(200).json({items: ['foo', 'bar']});
  } else {
    res.status(400).json({});
  }
});

console.log('Starting the engine server...');
engineServer.listen(ENGINE_SERVER_PORT);

// Event Server
var eventServer = express();
eventServer.use(bodyParser.json());

var EVENT_KEYS = ['event', 'entityType', 'entityId', 'targetEntityType',
                  'targetEntityId', 'properties', 'eventTime'];
var RESERVED_EVENT_NAMES = ['$set', '$unset', '$delete'];

eventServer.post('/events.json', function (req, res) {
  var verifyRequest = function (req) {
    // Check if the request is json.
    if (!req.is(JSON_CONTENT_TYPE)) {
      console.log('Event request is not of JSON type');
      return false;
    }

    // Check the access key.
    if (req.query.accessKey !== ACCESS_KEY) {
      console.log('Access key does not match');
      return false;
    }

    var data = req.body;
    var key;

    // Check if all the dictionary keys are valid.
    for (key in data) {
      if (data.hasOwnProperty(key) && EVENT_KEYS.indexOf(key) === -1) {
        console.log('Invalid key in event JSON object: ' + key);
        return false;
      }
    }

    // Check that the event names starting $ are supported events.
    if (data.event[0] === '$' && RESERVED_EVENT_NAMES.indexOf(data.event) === -1) {
      console.log('Event name, ' + data.event + ', shouldn\'t start with $');
      return false;
    }

    // Check if the event is $unset, the properties dictionary is not empty
    if (data.event === '$unset' && Object.keys(data.properties).length === 0) {
      console.log('Unset event\'s properties cannot be empty');
      return false;
    }

    return true;
  };

  if (verifyRequest(req)) {
    res.status(201).json({
      'eventId': 'DzyxzpzxAlRNdiDxyChMHgAAAUvpc5HbsI8ZBhEjsvw'
    });
  } else {
    res.status(400).json({});
  }
});

console.log('Starting the event server...');
eventServer.listen(EVENT_SERVER_PORT);
