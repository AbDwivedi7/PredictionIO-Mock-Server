'use strict';

var ENGINE_SERVER_PORT = 8000;
var EVENT_SERVER_PORT = 7070;
var ACCESS_KEY = '123';
var JSON_CONTENT_TYPE = 'application/json';

var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');

// Engine Server
var engineServer = express();

engineServer.post('/queries.json', function (req, res) {
  if (req.is(JSON_CONTENT_TYPE)) {
    res.status(200).json({items: ['foo', 'bar']});
  } else {
    res.status(400).json({});
  }
});

console.log('Starting the engine server at port ' + ENGINE_SERVER_PORT + '...');
engineServer.listen(ENGINE_SERVER_PORT);

// Event Server
var eventServer = express();
eventServer.use(bodyParser.json());

var REQUIRED_EVENT_FIELDS = ['event', 'entityType', 'entityId'];
var OPTIONAL_EVENT_FIELDS = ['targetEntityType', 'targetEntityId', 'properties',
                             'eventTime'];
var ALL_EVENT_FIELDS = REQUIRED_EVENT_FIELDS.concat(OPTIONAL_EVENT_FIELDS);
var RESERVED_EVENT_NAMES = ['$set', '$unset', '$delete'];

eventServer.post('/events.json', function (req, res) {
  var verifyDateTime = function (dateTime) {
    // NOTE: While PredictionIO event server allows this datetime string
    // `2004-12-13T21:39:45.618+23`, moment cannot parse it so this function
    // will return false.

    var parsedDateTime = moment(dateTime, moment.ISO_8601);

    // While Moment parse accepts strings without time or other format,
    // PredictionIO event server only accepts strings with all date, time and
    // timezone components. For time, milliseconds is optional.
    var isSupportedFormat = parsedDateTime._f === 'YYYY-MM-DDTHH:mm:ssZ'
      || parsedDateTime._f === 'YYYY-MM-DDTHH:mm:ss.SSSSZ';

    var isTimezoneUnder2400 = Math.abs(parsedDateTime._tzm) < 1440;

    if (parsedDateTime.isValid() && isSupportedFormat && isTimezoneUnder2400) {
      return true;
    }
    return false;
  };

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
    var fields = [];
    var field, i;

    for (field in data) {
      if (data.hasOwnProperty(field)) {
        fields.push(field);
      }
    }

    // Check if all the required fields exist.
    for (i = 0; i < REQUIRED_EVENT_FIELDS.length; ++i) {
      if (fields.indexOf(REQUIRED_EVENT_FIELDS[i]) === -1) {
        console.log('Cannot find the required field: ' + REQUIRED_EVENT_FIELDS[i]);
        return false;
      }
    }

    // Check if all the fields are valid.
    for (i = 0; i < fields.length; ++i) {
      if (ALL_EVENT_FIELDS.indexOf(fields[i]) === -1) {
        console.log('Invalid field in the event JSON object: ' + fields[i]);
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

    // Check if the event time conforms to ISO 8601 with all date, time and 
    // timezone components.
    if (data.eventTime !== undefined && !verifyDateTime(data.eventTime)) {
      console.log('Event time must conform to ISO 8601 format: ' + data.eventTime);
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

console.log('Starting the event server at port ' + EVENT_SERVER_PORT + '...');
eventServer.listen(EVENT_SERVER_PORT);
