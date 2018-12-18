import config from './config/config';
import app from './config/express';
/* eslint-disable no-unused-vars */
import db from './config/sequelize';
import logger from './config/winston';

/* eslint-enable no-unused-vars */

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

function startServer() {
  // module.parent check is required to support mocha watch
    if (!module.parent) {
        app.listen(config.port, () => {
            logger.info(`server started on port ${config.port} (${config.env})`, {
                port: config.port,
                node_env: config.env,
            });
        });
    }
}

startServer();

export default app;
