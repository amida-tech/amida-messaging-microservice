require('babel-core/register');
const Joi = require('joi');
// require and configure dotenv, will load vars in .env in PROCESS.ENV
const dotenv = require('dotenv');

// configure dotenv, will load vars in .env in PROCESS.ENV
if (process.env.NODE_ENV === 'test') {
    console.log('using env.test'); // eslint-disable-line no-console
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

// define validation for all the env vars
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string()
        .allow(['development', 'production', 'test', 'provision'])
        .default('production'),
    LOG_LEVEL: Joi.string()
        .default('info'),
    MESSAGING_SERVICE_PORT: Joi.number()
        .default(4001),
    JWT_SECRET: Joi.string().required()
        .description('JWT Secret required to sign'),
    MESSAGING_SERVICE_JWT_MODE: Joi.string().allow(['rsa', 'hmac']).default('hmac')
        .description('Signing algorithm for JWT'),
    MESSAGING_SERVICE_JWT_PUBLIC_KEY_PATH: Joi.string()
        .description('Absolute or relative path to RSA public key'),
    MESSAGING_SERVICE_THREAD_SCOPES: Joi.array()
        .items(Joi.string()),
    MESSAGING_SERVICE_PG_DB: Joi.string().required()
        .description('Postgres database name'),
    MESSAGING_SERVICE_PG_PORT: Joi.number()
        .default(5432),
    MESSAGING_SERVICE_PG_HOST: Joi.string(),
    MESSAGING_SERVICE_PG_USER: Joi.string().required()
        .description('Postgres username'),
    MESSAGING_SERVICE_PG_PASSWORD: Joi.string().allow('')
        .description('Postgres password'),
    MESSAGING_SERVICE_PG_SSL_ENABLED: Joi.bool()
        .default(false)
        .description('Enable SSL connection to PostgreSQL'),
    MESSAGING_SERVICE_PG_CA_CERT: Joi.string().allow('')
        .description('SSL certificate CA. This string must be the certificate itself, not a filename.'),
    MESSAGING_SERVICE_AUTOMATED_TEST_JWT: Joi.string().allow('')
        .description('Test auth token'),
    MESSAGING_SERVICE_TEST_TOKEN_RSA: Joi.string().allow('')
        .description('Test auth token generated with RSA'),
    AUTH_MICROSERVICE_URL: Joi.string().allow('')
        .description('Auth microservice endpoint')
        .default('http://localhost:4000/api/v1'),
    NOTIFICATION_MICROSERVICE_URL: Joi.string().allow('')
        .description('Notification Microservice endpoint'),
    PUSH_NOTIFICATIONS_SERVICE_USER_USERNAME: Joi.string().allow('')
        .description('Microservice Access Key'),
    PUSH_NOTIFICATIONS_SERVICE_USER_PASSWORD: Joi.string().allow('')
        .description('Microservice Password'),
    PUSH_NOTIFICATIONS_ENABLED: Joi.bool()
        .default(false),
}).unknown()
    .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    logLevel: envVars.LOG_LEVEL,
    port: envVars.MESSAGING_SERVICE_PORT,
    jwtSecret: envVars.JWT_SECRET,
    jwtMode: envVars.MESSAGING_SERVICE_JWT_MODE,
    jwtPublicKeyPath: envVars.MESSAGING_SERVICE_JWT_PUBLIC_KEY_PATH,
    testTokenRSA: envVars.MESSAGING_SERVICE_TEST_TOKEN_RSA,
    testToken: envVars.MESSAGING_SERVICE_AUTOMATED_TEST_JWT,
    threadScopes: envVars.MESSAGING_SERVICE_THREAD_SCOPES,
    authMicroService: envVars.AUTH_MICROSERVICE_URL,
    notificationMicroservice: envVars.NOTIFICATION_MICROSERVICE_URL,
    microserviceAccessKey: envVars.PUSH_NOTIFICATIONS_SERVICE_USER_USERNAME,
    microservicePassword: envVars.PUSH_NOTIFICATIONS_SERVICE_USER_PASSWORD,
    pushNotificationsEnabled: envVars.PUSH_NOTIFICATIONS_ENABLED,
    postgres: {
        db: envVars.MESSAGING_SERVICE_PG_DB,
        port: envVars.MESSAGING_SERVICE_PG_PORT,
        host: envVars.MESSAGING_SERVICE_PG_HOST,
        user: envVars.MESSAGING_SERVICE_PG_USER,
        password: envVars.MESSAGING_SERVICE_PG_PASSWORD,
        sslEnabled: envVars.MESSAGING_SERVICE_PG_SSL_ENABLED,
        sslCaCert: envVars.MESSAGING_SERVICE_PG_CA_CERT,
    },
};
