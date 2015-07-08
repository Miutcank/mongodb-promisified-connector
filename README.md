# mongodb-promisified-connector
Node.js MongoDB connector promisified with bluebird.

## Features

- Promisified with bluebird
- Lightweight, offers all functionality of the native MongoDB driver
- Efficient, initiates a single connection at the first time you try to access a collection
- Fault-tolerant, tries to reconnect if disconnected
- Custom logging

## Usage

```node
var myCollection = require('mongodb-promisified-connector')('myCollectionName');
myCollection.find({})
  .then(function(resultArray) {
    // you will get the documents array
  });
```

## ENV vars

`MONGO_URL` MongoDB connection string
