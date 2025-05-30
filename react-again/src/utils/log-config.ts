import { info,debug,error,warn} from '@tauri-apps/plugin-log';

const shouldLogToFile:boolean = true;
const formatObjects:boolean = false;

export const memConsoleLog = console.log
export const memConsoleInfo = console.info
export const memConsoleWarn = console.warn
export const memConsoleError = console.error

export function modifyLogs() {
    function formatArgs(args:unknown[]) {
        return args.map(arg => {
            if ((typeof arg === 'string') || !(formatObjects)) {
                return arg
            }
            return JSON.stringify(arg,null,2)
        }).join(' ');
    }
    if (shouldLogToFile) {
        console.log = (...args) => {
            debug(formatArgs(args));
        };
        console.info = (...args) => {
            info(formatArgs(args));
        };
        console.warn = (...args) => {
            warn(formatArgs(args));
        };
        console.error = (...args) => {
            error(formatArgs(args));
        };
    }
}