import _ from 'lodash';
import os from 'os';
import config from './config';
import pjson from '../package.json';


const { createLogger, transports, format } = require('winston');

const { printf, timestamp, combine, colorize } = format; // eslint-disable-line no-unused-vars

const logger = createLogger({
    level: config.logLevel,
    transports: [
        new transports.Console(),
    ],
});

const developmentFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

const productionFormat = printf((info) => {
    function parseInfo(infoObj) {
        return _.omit(infoObj, [
            'err',
            'hostname',
            'level',
            'logger',
            'message',
            'meta',
            'service',
            'stack',
            'timestamp',
        ]);
    }

    return JSON.stringify({
        service: pjson.name,
        logger: 'application_logger',
        hostname: os.hostname(),
        level: info.level,
        msg: info.message,
        meta: {
            service: {
                version: pjson.version,
            },
            logger: {
                time: info.timestamp,
            },
            event: parseInfo(info),
        },
        err: {
            err: info.err,
            stack: info.stack,
        },
    });
});

if (config.env === 'production') {
    logger.format = combine(
        timestamp(),
        productionFormat
    );
} else {
    logger.format = combine(
        timestamp(),
        colorize(),
        developmentFormat
    );
}

module.exports = logger;
