import config from './config/config';
import app from './config/express';
/* eslint-disable no-unused-vars */
import db from './config/sequelize';
import logger from './config/winston';

const debug = require('debug')('amida-api-boilerplate:index');
/* eslint-enable no-unused-vars */

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

function startServer() {
  // module.parent check is required to support mocha watch
    if (!module.parent) {
    // listen on port config.port
        app.listen(config.port, () => {
            logger.info({
                service: 'messaging-service',
                message: `server started on port ${config.port} (${config.env})`,
            });
        });
    }
}

db.sequelize
  .sync()
  .then(startServer)
  .catch((err) => {
      if (err) debug('An error occured %j', err);
      else debug('Database synchronized');
  });

export default app;
