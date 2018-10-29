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

git.getLastCommit((err, commit) => {

  const prodFormat = printf(info => JSON.stringify({
    service: pjson.name,
    logger: 'my_winston_logger',
    hostname: os.hostname(),
    level: info.level,
    msg: info.message,
    meta: {
        service: {
            commit: commit.shortHash,
            commitMessage: commit.subject,
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
  }));

  if (config.env === 'production') {
    logger.format = combine(
    timestamp(),
    // colorize(),
    prodFormat
    );
  }

  return commit})

const developmentFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);


export default logger;
