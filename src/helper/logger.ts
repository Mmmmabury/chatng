import pinoLogger from "pino";

const pLogger = pinoLogger({
    transport: {
        target: "pino-pretty",
    },
});

type LogLevel = "debug" | "info" | "warn" | "error";

const LOGLEVEL: { [key: string]: LogLevel } = {
    debug: "debug",
    info: "info",
    warn: "warn",
    error: "error",
};

// 也许可以换成 [pino/browser.md](https://github.com/pinojs/pino)
function logger() {
    const info = (...args: unknown[]) => {
        logging(LOGLEVEL.info, ...args);
    };
    const debug = (...args: unknown[]) => {
        logging(LOGLEVEL.debug, ...args);
    };
    const error = (...args: unknown[]) => {
        logging(LOGLEVEL.error, ...args);
    };
    // const stack = (...args: unknown[]) => {
    //   logging(LOGLEVEL.stack, ...args);
    // };
    const logging = (level: LogLevel, ...args: unknown[]) => {
        const err = new Error();
        const caller = err.stack?.split("\n")[3];
        var funcName = null;
        var line = null;
        var col = null;
        if (caller) {
            // const matches = /at (?<funcName>.+) \(/.exec(caller);
            const matches =
                /\((?<webpack>.*).\/(?<funcName>.*):(?<line>\d*):(?<col>\d+)\)/.exec(
                    caller
                );
            if (matches && matches.groups) {
                funcName = matches.groups.funcName;
                line = matches.groups.line;
                col = matches.groups.col;
            }
        }
        var logMsg = "";
        for (let msg of args) {
            var type = typeof msg;
            if (type === "object") {
                if (msg instanceof Error) {
                    logMsg +=
                        `${funcName}:${line}:${col}` +
                        (msg as Error).stack +
                        "\n";
                } else {
                    logMsg += " " + JSON.stringify(msg);
                }
            } else {
                logMsg += " " + msg;
            }
        }
        logMsg = logMsg.trim();

        if (process.env.NODE_ENV === "production") {
            // 在生产环境中运行
        } else {
            // 在开发环境中运行
            if (typeof window !== "undefined") {
                console.log(`[${level}]: ${logMsg} ${funcName}:${line}:${col}`);
            } else {
                pLogger[level](logMsg);
            }
        }
    };
    return { info, debug, error };
}

export const log = {
    info: logger().info,
    debug: logger().debug,
    error: logger().error,
};
