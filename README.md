![status alpha](https://img.shields.io/badge/development_status-alpha-red.svg)
[![npm version](https://badge.fury.io/js/%40mtti%2Fmicroservice-sequelize.svg)](https://badge.fury.io/js/%40mtti%2Fmicroservice-sequelize)

A plugin for [@mtti/microservice](https://github.com/mtti/node-microservice) which connects to a database with Sequelize when the microservice starts. The server to connect to is determined by a URL in the `DB_SERVER` environment variable.

## Example

```javascript
// main.js

const Microservice = require('@mtti/microservice');
const sequelizePlugin = require('@mtti/microservice-sequelize');
const models = require('./models');

const service = new Microservice('myservice');

/*
// Uncomment to set database URL manually, instead of DB_SERVER env variable.
service.configure({
    dbServer: 'postgres://user:pass@localhost:5432/myservice'
});
*/

service.use(sequelizePlugin(models));

// Models are available, keyed by name, under service.models

service.start()
    .catch((err) => {
        console.log(err);
        process.exit(1);
    })
```

```javascript
// models.js

const document = require('document.model');

module.exports = [
    document,
];

```

```javascript
// document.model.js

return (sequelize, DataTypes) => {
    const document = sequelize.define('document', {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        title: {
            type: DataTypes.TEXT,
        },
        body: {
            type: DataTypes.TEXT,
        },
    });

    /*
    document.associate = (models) => {
        model.hasOne(models.user);
    };
    */

    return document;
};
```
