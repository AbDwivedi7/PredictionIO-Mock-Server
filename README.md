# PredictionIO Mock Server

Simple PredictionIO mock severs for testing client SDKs, written using Node.js.

## PredictionIO 0.8.3 and above

Two mock servers will be running. Both only accept POST requests with data in
JSON format.

**Engine server**
  - URL: `http://localhost:8000/queries.json`
  - Response: `200` status code on success and `400` otherwise.

**Event server**
  - URL: `http://localhost:7070/events.json?accessKey=123`
  - Access key: `123` (as in the above URL's query string)
  - Data is a JSON object with the following fields:
    + `event`: Only reversed event names: `$set`, `$unset` and `$delete` 
      are accepted. Other event names must not start with `$`.
    + `entityType`
    + `entityId`
    + `targetEntityType`: Optional
    + `targetEntityId`: Optional
    + `properties`: Optional
    + `eventTime`: Must be in ISO 8601 format (e.g.
      `2004-12-13T21:39:45.618Z`, or `2014-09-09T16:17:42.937-08:00`)
  - Response: `201` status code on success and `400` otherwise.

## Requirements

- Node.js (0.10.32)
- npm (1.4.28)

## Installation

Very simple installation!

```
$ npm install
$ node app.js
```

To run the mock server on Travis CI, simply add the following to `.travis.yml` 
file.

```yaml
before_script:
- git clone git://github.com/minhtule/PredictionIO-Mock-Server.git
- cd PredictionIO-Mock-Server
- npm install
- node app.js &
- sleep 3  # Give mock server some time to bind to sockets, etc
- cd ..
```
