var Promise = require('bluebird');
var MongoDB = Promise.promisifyAll(require('mongodb'));
var MongoClient = Promise.promisifyAll(MongoDB.MongoClient);
var config = require('./config');
var connection;

var MongoDbConnector = function MongoDbConnector(collectionName, log) {

  if (!log) { // create fallback logger
    log = {
      /* eslint-disable no-console */
      debug: console.log,
      info: console.log,
      warn: console.log,
      error: console.error
      /* eslint-enable */
    };
  }

  if (!collectionName) {
    log.error('collectionName parameter is missing from MongoDbConnector constructor');
    throw Error('collectionName parameter is missing');
  }

  if (typeof Proxy === 'undefined') {
    log.error('Proxy support is missing from your node binary. Please run with --harmony-proxies argument');
    throw Error('Proxy support is missing');
  }

  function connectMongoDb() {
    return MongoClient.connectAsync(config.mongoDb.uri)
      .then(function connectionEstablished(conn) {
        log.info({URI: config.mongoDb.uri}, 'Connected to MongoDB');
        connection = conn;  // caching the connection
        return conn;
      })
      .catch(function errorInConnection(error) {
        log.error({error: error}, 'Error in MongoDB connection');
      });
  }

  function getCollection() {
    var conn;
    return Promise.resolve()
      .then(function checkConnection() {
        if (connection) {
          log.debug('Connection exists');
          return Promise.resolve(connection);
        } else {
          log.debug('No connection present, connecting...');
          return connectMongoDb();
        }
      })
      .then(function checkCollection(connection) {
        conn = connection;
        return connection.listCollections({ name: collectionName }).toArrayAsync();
      })
      .then(function fetchCollection(collectionList) {
        if (collectionList.length === 1) {
          return conn.collection(collectionName);
        } else {
          log.error({ collection: collectionName }, 'Collection doesnt exist');
        }
      });
  }

  function executeMethod(collection, methodName, args) {
    switch (methodName) {
      case 'find':
        return collection[methodName].apply(collection, args).toArrayAsync();
      default:
        if (typeof collection[methodName + 'Async'] === 'function') {
          // Async method provided by Bluebird's promisifyAll
          return collection[methodName + 'Async'].apply(collection, args);
        } else if (typeof collection[methodName] === 'function') {
          // Sync methods
          return collection[methodName].apply(collection, args);
        } else {
          log.error('Undefined method called:', methodName, collection);
          return Promise.reject('Undefined method called');
        }
    }
  }

  var proxy = Proxy.create({
    get: function get(receiver, methodName) {
      return function retFunction() {
        var args = arguments;
        return getCollection()
          .then(function runMethod(collection) {
            return executeMethod(collection, methodName, args);
          })
          .catch(function errorInMongoDbConnector(error) {
            log.error({error: error}, 'Error in MongoDbConnector');
            return Promise.reject('Error in MongoDbConnector');
          });
      };
    }
  });
  return proxy;
};

module.exports = MongoDbConnector;
