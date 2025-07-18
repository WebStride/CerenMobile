import { pino } from "pino";
import dayjs from "dayjs";
const logger = pino({
    transport: {
        target: 'pino-pretty'
    },
    timestamp: () => `,"time":"${dayjs().format()}"`,
});
export const info = (message, parameter) => logger.info({ message, parameter });
export const error = (message, error) => logger.error({ message, error });
export const debug = (message) => logger.debug(message);
