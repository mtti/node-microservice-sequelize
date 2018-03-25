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

const _ = require('lodash');
const createError = require('http-errors');
const { ResourceServer } = require('@mtti/nats-rest');

class SequelizeResource {
  /**
   * Return a @mtti/microservice plugin which creates and starts a SequelizeResource for every
   * Sequelize model in the project with exportResource set to true.
   * @param {*} actions
   */
  static plugin() {
    return {
      init: (service) => {
        _.toPairs(service.models)
          .filter(pair => pair[1].exportResource === true)
          .map(pair => new SequelizeResource(
            service.natsClient,
            pair[1],
            { logger: service.logger }
          ))
          .forEach((resource) => {
            resource.start();
          });
      }
    }
  }

  constructor(natsClient, model, options = {}) {
    this._natsClient = natsClient;
    this._model = model;
    this._name = options.name || model.name;
    this._logger = options.logger;

    this._jsonSchemas = this._model.jsonSchemas || [];
    this._schemaRef = this._model.schemaRef;
    this._actions = [];

    if (this._model.actions) {
      Array.prototype.push.apply(this._actions, this._model.actions);
    }
  }

  start() {
    const adapter = {
      load: this._load.bind(this),
      toJSON: this._toJSON.bind(this),
      upsert: this._upsert.bind(this),
      delete: this._delete.bind(this),
    };

    const serverOptions = {
      adapter,
      jsonSchemas: this._jsonSchemas,
      schemaRef: this._schemaRef,
      actions: this._actions,
      logger: this._logger,
    };
    this._server = new ResourceServer(this._natsClient, this._name, serverOptions);

    this._model.hook('afterSave', (instance, options) => {
      this._server.emit(instance.toJSON());
    });

    this._server.start();
  }

  _load(id) {
    return this._model.findById(id)
      .then((instance) => {
        if (!instance) {
          throw createError(404);
        }
        return instance;
      });
  }

  _toJSON(instance) {
    return instance.toJSON();
  }

  _upsert(id, body) {
    const bodyCopy = _.cloneDeep(body);
    bodyCopy.id = id;
    return this._model.upsert(bodyCopy)
      .then(() => this._model.findById(id));
  }

  _delete(id) {
    return this._model.destroy({ where: { id }});
  }
}

module.exports = SequelizeResource;
