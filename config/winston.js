import os from 'os';
import git from 'git-last-commit';
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

git.getLastCommit((err, commit) => {
    const prodFormat = printf(info => JSON.stringify({
        service: pjson.name,
        logger: 'application_logger',
        hostname: os.hostname(),
        level: info.level,
        msg: info.message,
        meta: {
            service: {
                commit: commit.shortHash,
                version: pjson.version,
            },
            logger: {
                time: info.timestamp,
                baz: 'bok',
            },
            event: {
                foo: 'bar',
            },
        },
        err: {
            err: info.err,
            stack: info.stack
        }
    }));

    if (config.env === 'production') {
        logger.format = combine(
        timestamp(),
        // colorize(),
        prodFormat
        );
    } else {
        logger.format = combine(
        timestamp(),
        colorize(),
        developmentFormat
        );
    }

    return commit;
});


module.exports = logger;
