import pino from 'pino';

// Create a logger with pino-pretty
const logger = pino({
    level:'trace',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true, // Enable colorization
            translateTime: 'SYS:standard', // Format timestamp
            ignore: 'pid,hostname,time', // Ignore these fields in the output
        },
    },
});
logger.info('This is an info message!');
logger.error('This is an error message!');
logger.warn('This is a warning message!');
logger.debug('This is a debug message!');
logger.trace('This is a trace message!');