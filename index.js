/*
Copyright 2018 Matti Hiltunen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const Sequelize = require('sequelize');

function plugin(schemas) {
  return {
    configure: (config) => {
      if (config.dbServer) {
        return;
      }
      if (process.env.DB_SERVER) {
        config.dbServer = process.env.DB_SERVER;
      } else {
        throw new Error('Either config.dbServer or DB_SERVER environment variable is required');
      }
    },

    init: (service) => {
      const sequelize = new Sequelize(
        service.config.dbServer,
        { logging: message => service.logger.debug(message) }
      );

      if (schemas) {
        const models = schemas.map(schema => schema(sequelize, Sequelize.DataTypes));

        service.models = {};
        models.forEach((model) => {
          service.models[model.name] = model;
        });

        models.forEach((model) => {
          if (model.associate) {
            model.associate(service.models);
          }
        });
      }

      return sequelize.authenticate()
        .then(() => {
          service.logger.info('Sequelize authenticated');
          return sequelize.sync();
        })
        .then(() => {
          service.logger.info('Sequelize synced');
        });
    }
  }
}

module.exports = plugin;
