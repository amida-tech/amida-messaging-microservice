import Sequelize from 'sequelize';
import _ from 'lodash';
import config from './config';
import logger from './winston';

let dbLogging;
if (config.env === 'test') {
    dbLogging = false;
} else {
    dbLogging = msg => logger.debug(msg);
}

const db = {};

// connect to postgres db
const sequelizeOptions = {
    dialect: 'postgres',
    port: config.postgres.port,
    host: config.postgres.host,
    logging: dbLogging,
};
if (config.postgres.sslEnabled) {
    sequelizeOptions.ssl = config.postgres.sslEnabled;
    if (config.postgres.sslCaCert) {
        sequelizeOptions.dialectOptions = {
            ssl: {
                ca: config.postgres.sslCaCert,
                rejectUnauthorized: true,
            },
        };
    }
}

const sequelize = new Sequelize(
    config.postgres.db,
    config.postgres.user,
    config.postgres.password,
    sequelizeOptions
);

if (config.postgres.sslEnabled) {
    // eslint-disable-next-line no-use-before-define
    ensureConnectionIsEncrypted(sequelize);
}

const Message = sequelize.import('../server/models/message.model');
const User = sequelize.import('../server/models/user.model');
const Thread = sequelize.import('../server/models/thread.model');
const UserMessage = sequelize.import('../server/models/userMessage.model');
const UserThread = sequelize.import('../server/models/userThread.model');

// Threads
Thread.hasMany(Message);
Thread.hasOne(Message, { as: 'LastMessage' });
Thread.belongsToMany(User, { through: 'UserThread' });

// Messages
Message.belongsTo(Thread);
Message.belongsTo(User, { as: 'Sender' });
Message.belongsToMany(User, { through: 'UserMessage' });

// Users
User.belongsToMany(Thread, { through: 'UserThread' });
User.belongsToMany(Message, { through: 'UserMessage' });

User.hasMany(UserThread);


db.Message = Message;
db.Thread = Thread;
db.User = User;
db.UserMessage = UserMessage;
db.UserThread = UserThread;


// assign the sequelize variables to the db object and returning the db.
module.exports = _.extend({
    sequelize,
    Sequelize,
    // eslint-disable-next-line no-use-before-define
    ensureConnectionIsEncrypted,
}, db);

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
