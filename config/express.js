import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import httpStatus from 'http-status';
import expressWinston from 'express-winston';
import expressValidation from 'express-validation';
import helmet from 'helmet';
import passport from 'passport';
import winstonInstance from './winston';
import routes from '../server/routes/index.route';
import config from './config';
import APIError from '../server/helpers/APIError';
import passportConfig from './passport';

const app = express();

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// eslint-disable-next-line import/newline-after-import
const swStats = require('swagger-stats');
app.use(swStats.getMiddleware({}));

// enable detailed API logging in dev env
if (config.env === 'development' || config.env === 'production') {
    expressWinston.requestWhitelist = ['url', 'method', 'httpVersion', 'originalUrl', 'query'];
    expressWinston.responseWhitelist = ['statusCode', 'responseTime'];
    app.use(expressWinston.logger({
        winstonInstance,
        meta: true, // optional: log meta data about request (defaults to true)
        msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
        colorStatus: true, // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
    }));
}

// set up Passport middleware
passportConfig(passport);
app.use(passport.initialize());

// mount all routes on /api path
app.use('/api', routes);

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        const error = new APIError(unifiedErrorMessage, 'UNKNOWN_ERROR', err.status, true);
        return next(error);
    }
    return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new APIError('API not found', 'UNKNOWN_API', httpStatus.NOT_FOUND, true);
    return next(err);
});

// Log errors.
if (config.env !== 'test') {
    app.use((err, req, res, next) => {
        winstonInstance.warn(err);
        return next(err);
    });
}

// error handler, send stacktrace only during development
app.use((err, req, res, next) => // eslint-disable-line no-unused-vars
    res.status(err.status || 500).json({
        status: 'ERROR',
        code: err.isPublic ? err.message.code : 'UNKNOWN_ERROR',
        message: err.isPublic ? err.message.message : httpStatus[err.status],
        stack: config.env === 'development' ? err.stack : {},
    })
);

export default app;
