const crypto = require("crypto");
const Logger = require("../Logger");
const Tools = require("../utils/Tools");
const ValetudoNTPClientSyncedState = require("../entities/core/ntpClient/ValetudoNTPClientSyncedState");

const MAX_DELAY_SECONDS = 24 * 60 * 60;
const EVALUATION_INTERVAL = 5 * 1000;
// Matches the Scheduler, which waits this long so that the robot has probably connected
const STARTUP_DELAY = 60 * 1000;
// A start missed by more than this, e.g. while Valetudo was down, is dropped rather than run late
const MISSED_START_GRACE_PERIOD = 5 * 60 * 1000;

class DelayedStart {
    /**
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("./Scheduler")} options.scheduler
     */
    constructor(options) {
        this.config = options.config;
        this.scheduler = options.scheduler;

        this.startupDelayTimeout = setTimeout(() => {
            this.evaluate();

            this.evaluationInterval = setInterval(() => {
                this.evaluate();
            }, EVALUATION_INTERVAL);
        }, STARTUP_DELAY);
    }

    /**
     * @returns {DelayedStartDefinition|null}
     */
    getPending() {
        const stored = this.config.get("delayedStart");

        return typeof stored?.start_time === "number" ? stored : null;
    }

    /**
     * Replaces any pending delayed start
     *
     * @param {object} options
     * @param {number} options.delay in seconds
     * @param {object} options.action
     * @param {Array<object>} options.pre_actions
     * @returns {DelayedStartDefinition}
     */
    set(options) {
        if (!(options.delay > 0 && options.delay <= MAX_DELAY_SECONDS)) {
            throw new Error(`Delay must be between 1 and ${MAX_DELAY_SECONDS} seconds`);
        }

        /** @type {DelayedStartDefinition} */
        const pending = {
            id: crypto.randomUUID(),
            start_time: Date.now() + Math.round(options.delay * 1000),
            action: options.action,
            pre_actions: options.pre_actions
        };

        this.config.set("delayedStart", pending);

        return pending;
    }

    clear() {
        this.config.set("delayedStart", {});
    }

    /**
     * @private
     */
    evaluate() {
        const pending = this.getPending();

        if (pending === null || !this.isClockPlausible() || Date.now() < pending.start_time) {
            return;
        }

        this.clear();

        if (Date.now() - pending.start_time > MISSED_START_GRACE_PERIOD) {
            Logger.info("Discarding delayed start " + pending.id + " as its start time has passed");

            return;
        }

        Logger.info("Executing delayed start " + pending.id);

        this.scheduler.executeTimer(/** @type {any} */ (pending)).catch(e => {
            Logger.error("Error while executing delayed start " + pending.id, e);
        });
    }

    /**
     * Same rules as Scheduler.evaluateTimers, as start_time is compared against the wall clock
     *
     * @private
     * @returns {boolean}
     */
    isClockPlausible() {
        const hasBuildTimestamp = Tools.GET_BUILD_TIMESTAMP() > new Date(-1);
        const timeIsPlausible = Tools.GET_BUILD_TIMESTAMP() < new Date();

        if (this.config.get("embedded") === true) {
            return this.scheduler.ntpClient.state instanceof ValetudoNTPClientSyncedState || (hasBuildTimestamp && timeIsPlausible);
        }

        return hasBuildTimestamp ? timeIsPlausible : true;
    }

    /**
     * @returns {Promise<void>}
     */
    async shutdown() {
        clearTimeout(this.startupDelayTimeout);
        clearInterval(this.evaluationInterval);
    }
}

/**
 * @typedef {object} DelayedStartDefinition
 * @property {string} id
 * @property {number} start_time Unix timestamp in milliseconds, from the robot's clock
 * @property {object} action
 * @property {Array<object>} pre_actions
 */

DelayedStart.MAX_DELAY_SECONDS = MAX_DELAY_SECONDS;

module.exports = DelayedStart;
