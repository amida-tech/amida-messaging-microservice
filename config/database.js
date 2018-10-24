const Sequelize = require('sequelize');
const logger = require('./winston');
const postgres = require('./config.js').postgres;

const config = {
    username: postgres.user,
    password: postgres.password,
    database: postgres.db,
    host: postgres.host,
    port: postgres.port,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
    logging: true,
};

if (postgres.sslEnabled) {
    config.ssl = postgres.sslEnabled;
    if (postgres.sslCaCert) {
        config.dialectOptions = {
            ssl: {
                ca: postgres.sslCaCert,
                rejectUnauthorized: true,
            },
        };
    }
}

// TODO ARH: This sequelize instance, using the config defined in this file,
// exists only to check if this config results an a properly encrypted connection to Postgres.
// The proper way to do it is to consolidate sequelize.js and database.js (this file) such that
// they use the same sequelize instance. This is documented in ORANGE-897.
const sequelize = new Sequelize(config);

if (postgres.sslEnabled) {
    // eslint-disable-next-line no-use-before-define
    ensureConnectionIsEncrypted(sequelize);
}

module.exports = {
    development: config,
    test: config,
    production: config,
};

// TODO ARH: This is defined both in sequelize.js and here because sequelize.js uses import/export,
// which requires bable, which does not work in this file. This needs to be deduplicated.
// This is documented in ORANGE-897.
// eslint-disable-next-line no-shadow
function ensureConnectionIsEncrypted(sequelize) {
    sequelize.query('select 1 as "dummy string"', {
        type: sequelize.QueryTypes.SELECT,
    })
    .then((result) => {
        logger.info('Sequelize is not throwing SSL-related errors, so we assume SSL is configured correctly.');
    })
    .catch((err) => {
        if (err.message === 'self signed certificate in certificate chain') {
            logger.error(`Sequelize is throwing error "${err.message}", which it does seemingly any time the certificate is invalid. Ensure your MESSAGING_SERVICE_PG_CA_CERT is set correctly.`);
        } else {
            logger.error(`Error attempting to verify the sequelize connection is SSL encrypted: ${err.message}`);
        }
        process.exit(1);
  });
}
