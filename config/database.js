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

module.exports = {
    development: config,
    test: config,
    production: config,
};
