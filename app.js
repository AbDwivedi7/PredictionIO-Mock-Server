'use strict';

const ENGINE_SERVER_PORT = 8000;
const EVENT_SERVER_PORT = 7070;
const ACCESS_KEY = '123';
const JSON_CONTENT_TYPE = 'application/json';

const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');

// Engine Server
const engineServer = express();

engineServer.post('/queries.json', (req, res) => {
  if (req.is(JSON_CONTENT_TYPE)) {
    res.status(200).json({items: ['foo', 'bar']});
  } else {
    res.status(400).json({});
  }
});

console.log('Starting the engine server at port ' + ENGINE_SERVER_PORT + '...');
engineServer.listen(ENGINE_SERVER_PORT);

// Event Server
const eventServer = express();
eventServer.use(bodyParser.json());

const REQUIRED_EVENT_FIELDS = ['event', 'entityType', 'entityId'];
const OPTIONAL_EVENT_FIELDS = ['targetEntityType', 'targetEntityId', 'properties', 'eventTime'];
const ALL_EVENT_FIELDS = REQUIRED_EVENT_FIELDS.concat(OPTIONAL_EVENT_FIELDS);
const RESERVED_EVENT_NAMES = ['$set', '$unset', '$delete'];

// Creating event endpoint
eventServer.post('/events.json', (req, res) => {
  if (verifyRequest(req) && verifyEvent(req.body)) {
    res.status(201).json({
      eventId: 'DzyxzpzxAlRNdiDxyChMHgAAAUvpc5HbsI8ZBhEjsvw'
    });
  } else {
    res.status(400).json({});
  }
});

// Creating batch events endpoint
eventServer.post('/batch/events.json', (req, res) => {
  if (verifyRequest(req)) {
    const responses = [];
    for (const event of req.body) {
      if (verifyEvent(event)) {
        responses.push({
          'status': 201,
          'eventId': 'fakeID'
        });
      } else {
        responses.push({
          'status': 400,
          'message': 'Invalid event'
        });
      }
    }
    res.status(200).json(responses);
  } else {
    res.status(400).json({});
  }
});


// Getting an event endpoint
eventServer.get('/events/:eventID.json', (req, res) => {
  const event = {
    event: 'register',
    entityType: 'user',
    entityId: 'foo',
    eventId: 'fake1',
    eventTime: '2004-12-13T21:39:45.618Z'
  }
  res.status(200).json(event);
});

// Getting events endpoint
eventServer.get('/events.json', (req, res) => {
  const events = [
    {
      event: 'id1',
      entityType: 'random',
      entityId: 'random1',
      eventId: 'fake1',
      eventTime: '2004-12-13T21:39:45.618Z'
    },
    {
      event: 'id2',
      entityType: 'random',
      entityId: 'random2',
      eventId: 'fake2',
      eventTime: '2004-12-13T21:39:45.618Z'
    }
  ]
  res.status(201).json(events);
});

// Deleting an event endpoint
eventServer.delete('/events/:eventID.json', (req, res) => {
  res.status(200).json({});
});

console.log('Starting the event server at port ' + EVENT_SERVER_PORT + '...');
eventServer.listen(EVENT_SERVER_PORT);

// Helper methods

function verifyRequest(req) {
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

  return true;
}

function verifyDateTime(dateTime) {
  // NOTE: While PredictionIO event server allows this datetime string
  // `2004-12-13T21:39:45.618+23`, moment cannot parse it so this function
  // will return false.

  const parsedDateTime = moment(dateTime, moment.ISO_8601);

  // While Moment parse accepts strings without time or other format,
  // PredictionIO event server only accepts strings with all date, time and
  // timezone components. For time, milliseconds is optional.
  const isSupportedFormat = parsedDateTime._f === 'YYYY-MM-DDTHH:mm:ssZ'
    || parsedDateTime._f === 'YYYY-MM-DDTHH:mm:ss.SSSSZ';

  const isTimezoneUnder2400 = Math.abs(parsedDateTime._tzm) < 1440;

  if (parsedDateTime.isValid() && isSupportedFormat && isTimezoneUnder2400) {
    return true;
  }
  return false;
}

function verifyEvent(event) { 
  let fields = [];

  for (const field in event) {
    if (event.hasOwnProperty(field)) {
      fields.push(field);
    }
  }

  // Check if all the required fields exist.
  for (const requiredField of REQUIRED_EVENT_FIELDS) {
    if (fields.indexOf(requiredField) === -1) {
      console.log('Cannot find the required field: ' + requiredField);
      return false;
    }
  }

  // Check if all the fields are valid.
  for (const field of fields) {
    if (ALL_EVENT_FIELDS.indexOf(field) === -1) {
      console.log('Invalid field in the event JSON object: ' + field);
      return false;
    }
  }

  // Check that the event names starting $ are supported events.
  if (event.event[0] === '$' && RESERVED_EVENT_NAMES.indexOf(event.event) === -1) {
    console.log('Event name, ' + event.event + ', shouldn\'t start with $');
    return false;
  }

  // Check if the event is $unset, the properties dictionary is not empty
  if (event.event === '$unset' && Object.keys(event.properties).length === 0) {
    console.log('Unset event\'s properties cannot be empty');
    return false;
  }

  // Check if the event time conforms to ISO 8601 with all date, time and 
  // timezone components.
  if (event.eventTime !== undefined && !verifyDateTime(event.eventTime)) {
    console.log('Event time must conform to ISO 8601 format: ' + event.eventTime);
    return false;
  }

  return true;
}
