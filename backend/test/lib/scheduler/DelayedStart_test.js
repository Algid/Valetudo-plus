const assert = require("node:assert");
const { describe, it, beforeEach, afterEach, mock } = require("node:test");

const DelayedStart = require("../../../lib/scheduler/DelayedStart");

const FULL_CLEANUP = {type: "full_cleanup", params: {}};
const STARTUP_DELAY = 60000;
const REAL_NOW = Date.now();

function createConfig(initial = {}, embedded = false) {
    const store = {delayedStart: initial, embedded: embedded};

    return {
        get: (key) => {
            return store[key];
        },
        set: (key, value) => {
            store[key] = value;
        }
    };
}

function createScheduler() {
    return {
        ntpClient: {state: undefined},
        executed: [],
        executeTimer: async function(definition) {
            this.executed.push(definition);
        }
    };
}

describe("DelayedStart", () => {
    let instances;

    function create(config, scheduler) {
        const instance = new DelayedStart({config: config, scheduler: scheduler});
        instances.push(instance);

        return instance;
    }

    beforeEach(() => {
        instances = [];
        mock.timers.enable({apis: ["setTimeout", "setInterval", "Date"], now: REAL_NOW});
    });

    afterEach(async () => {
        for (const instance of instances) {
            await instance.shutdown();
        }
        mock.timers.reset();
    });

    it("runs the action once after the delay and clears itself", () => {
        const scheduler = createScheduler();
        const delayedStart = create(createConfig(), scheduler);

        delayedStart.set({delay: 120, action: FULL_CLEANUP, pre_actions: []});

        mock.timers.tick(115000);
        assert.strictEqual(scheduler.executed.length, 0);

        mock.timers.tick(5000);
        assert.strictEqual(scheduler.executed.length, 1);
        assert.deepStrictEqual(scheduler.executed[0].action, FULL_CLEANUP);
        assert.strictEqual(delayedStart.getPending(), null);

        mock.timers.tick(60000);
        assert.strictEqual(scheduler.executed.length, 1);
    });

    it("waits for the startup delay before running a due start", () => {
        const scheduler = createScheduler();
        const delayedStart = create(createConfig(), scheduler);

        delayedStart.set({delay: 1, action: FULL_CLEANUP, pre_actions: []});

        mock.timers.tick(STARTUP_DELAY - 1);
        assert.strictEqual(scheduler.executed.length, 0);

        mock.timers.tick(1);
        assert.strictEqual(scheduler.executed.length, 1);
    });

    it("doesn't run after being cleared", () => {
        const scheduler = createScheduler();
        const delayedStart = create(createConfig(), scheduler);

        delayedStart.set({delay: 120, action: FULL_CLEANUP, pre_actions: []});
        delayedStart.clear();
        mock.timers.tick(180000);

        assert.strictEqual(scheduler.executed.length, 0);
        assert.strictEqual(delayedStart.getPending(), null);
    });

    it("replaces a pending delayed start", () => {
        const scheduler = createScheduler();
        const delayedStart = create(createConfig(), scheduler);

        delayedStart.set({delay: 120, action: FULL_CLEANUP, pre_actions: []});
        delayedStart.set({delay: 240, action: FULL_CLEANUP, pre_actions: []});

        mock.timers.tick(120000);
        assert.strictEqual(scheduler.executed.length, 0);

        mock.timers.tick(120000);
        assert.strictEqual(scheduler.executed.length, 1);
    });

    it("rejects delays outside of 1 second to 24 hours", () => {
        const delayedStart = create(createConfig(), createScheduler());

        assert.throws(() => {
            delayedStart.set({delay: 0, action: FULL_CLEANUP, pre_actions: []});
        });
        assert.throws(() => {
            delayedStart.set({delay: 24 * 60 * 60 + 1, action: FULL_CLEANUP, pre_actions: []});
        });
    });

    it("runs a persisted start missed by up to 5 minutes and drops one missed by more", () => {
        const scheduler = createScheduler();
        const late = create(
            createConfig({id: "a", start_time: REAL_NOW - 60000, action: FULL_CLEANUP, pre_actions: []}),
            scheduler
        );
        const stale = create(
            createConfig({id: "b", start_time: REAL_NOW - 5 * 60000, action: FULL_CLEANUP, pre_actions: []}),
            scheduler
        );

        mock.timers.tick(STARTUP_DELAY);

        assert.strictEqual(scheduler.executed.length, 1);
        assert.strictEqual(scheduler.executed[0].id, "a");
        assert.strictEqual(late.getPending(), null);
        assert.strictEqual(stale.getPending(), null);
    });

    it("doesn't run on an embedded robot until the clock is plausible", () => {
        mock.timers.setTime(1000000);

        const scheduler = createScheduler();
        const delayedStart = create(
            createConfig({id: "a", start_time: 0, action: FULL_CLEANUP, pre_actions: []}, true),
            scheduler
        );

        mock.timers.tick(STARTUP_DELAY + 30000);

        assert.strictEqual(scheduler.executed.length, 0);
        assert.notStrictEqual(delayedStart.getPending(), null);
    });
});
