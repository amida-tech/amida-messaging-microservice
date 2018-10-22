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

const gitCommit = {};
git.getLastCommit((err, commit) => commit).then((commit) => {
    console.log('Jonah', gitCommit);

    const prodFormat = printf(info => JSON.stringify({
        service: pjson.name,
        logger: 'my_winston_logger',
        hostname: os.hostname(),
        level: info.level,
        msg: info.message,
        meta: {
            service: {
                commit: '2bb08ad',
                version: 'v1.0.0',
            },

            logger: {
                time: info.timestamp,
                baz: 'bok',
            },

            event: {
                foo: 'bar',
            },
        },
    }));

    if (config.env === 'production') {
        logger.format = combine(
        timestamp(),
        // colorize(),
        prodFormat
    );
    }
});

const prodFormat = printf(info => JSON.stringify({
    service: pjson.name,
    logger: 'my_winston_logger',
    hostname: os.hostname(),
    level: info.level,
    msg: info.message,
    meta: {
        service: {
            commit: '2bb08ad',
            version: 'v1.0.0',
        },

        logger: {
            time: info.timestamp,
            baz: 'bok',
        },

        event: {
            foo: 'bar',
        },
    },
}));

const developmentFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

// if (config.env !== 'production') {
//     logger.format = combine(
//         timestamp(),
//         colorize(),
//         developmentFormat
//     );
// }

// if (config.env === 'production') {
//     logger.format = combine(
//         timestamp(),
//         // colorize(),
//         prodFormat
//     );
// }

export default logger;
