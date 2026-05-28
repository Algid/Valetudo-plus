const fs = require("fs");
const Logger = require("../Logger");
const {spawn} = require("child_process");

const DEFAULT_RETRY_DELAY_MS = 15000;

class ProcessWatcher {
    /**
     * @param {object} options
     * @param {string} options.name
     * @param {string} options.binary
     * @param {string[]} [options.args]
     * @param {object} [options.spawnOptions]
     * @param {number} [options.retryDelay]
     */
    constructor(options) {
        this.name = options.name;
        this.binary = options.binary;
        this.args = options.args ?? [];
        this.spawnOptions = options.spawnOptions ?? {};
        this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY_MS;

        this.process = null;
        this.stopped = true;
        this.retryTimeout = null;
    }

    get binaryExists() {
        return fs.existsSync(this.binary);
    }

    start() {
        if (!this.stopped) {
            return;
        }

        this.stopped = false;
        this.spawnProcess();
    }

    stop() {
        this.stopped = true;

        if (this.retryTimeout !== null) {
            Logger.info(`ProcessWatcher: Cancelling pending restart of ${this.name}`);
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }

        if (this.process !== null) {
            Logger.info(`ProcessWatcher: Killing ${this.name}`);

            try {
                this.process.kill("SIGTERM");
            } catch (e) {
                Logger.warn(`ProcessWatcher: Failed to kill ${this.name}:`, e);
            }
        }
    }

    get isActive() {
        return !this.stopped;
    }

    spawnProcess() {
        if (this.process !== null) {
            return;
        }

        Logger.info(`ProcessWatcher: Starting ${this.name}`);
        this.process = spawn(this.binary, this.args, this.spawnOptions);

        this.process.on("error", (err) => {
            Logger.warn(`ProcessWatcher: ${this.name} error:`, err);
            this.process = null;
            this.scheduleRetry();
        });

        this.process.on("exit", (code, signal) => {
            Logger.info(`ProcessWatcher: ${this.name} exited (code=${code}, signal=${signal})`);
            this.process = null;
            this.scheduleRetry();
        });
    }

    scheduleRetry() {
        if (this.stopped || this.retryTimeout !== null) {
            return;
        }

        Logger.info(`ProcessWatcher: Scheduling ${this.name} restart in ${this.retryDelay}ms`);
        this.retryTimeout = setTimeout(() => {
            this.retryTimeout = null;

            if (!this.stopped) {
                this.spawnProcess();
            }
        }, this.retryDelay);
    }
}

module.exports = ProcessWatcher;
