const child_process = require("child_process");
const fs = require("fs");
const Logger = require("../../../Logger");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");
const util = require("util");

const DreameMultipleMapCapability = require("./DreameMultipleMapCapability");

const execPromise = util.promisify(child_process.exec);
const readFilePromise = util.promisify(fs.readFile);

/**
 * l10s-extended: map switching on the Gen2 (r2228o) generation is not implemented in the
 * firmware's runtime map_edit handler (the "sm" op is accepted but inert). The vendor stack only
 * applies a map change when ava boots and reads curr_id from the map config file.
 *
 * This capability therefore persists the desired map to the vendor config files (exactly what
 * the stock multi-floor flow / Map Loader tooling does) and restarts ava, which rebuilds SLAM
 * state for the selected map. valetudo itself survives and reconnects via dummycloud.
 *
 * @extends DreameMultipleMapCapability<import("../DreameL10SUltraValetudoRobot")>
 */
class DreameL10SUltraMultipleMapCapability extends DreameMultipleMapCapability {
    /**
     * @param {object} options
     * @param {string} [options.multMapConfigPath] vendor multi-map enablement file
     * @param {string} [options.avaRestartCommand] command that re-launches the vendor daemon
     */
    constructor(options) {
        super(options);

        this.multMapConfigPath = options.multMapConfigPath ?? "/data/config/ava/mult_map.json";
        this.avaRestartCommand = options.avaRestartCommand ?? "/etc/rc.d/ava.sh";
    }

    /**
     * @param {string} pid
     * @returns {Promise<boolean>}
     * @private
     */
    async avaRunning() {
        return new Promise((resolve) => {
            child_process.exec("pidof ava", {timeout: 3000}, (err, stdout) => {
                resolve(!err && !!(stdout && stdout.trim().length > 0));
            });
        });
    }

    /**
     * @param {number} ms
     * @returns {Promise<void>}
     * @private
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async switchMap(id) {
        Logger.info(`[l10s-extended] Switching to map ${id} via vendor file reload (ava restart)`);

        const maps = await this.getMaps();
        if (!maps.find(entry => entry.id === String(id))) {
            throw new RobotFirmwareError(`Map ${id} does not exist`);
        }

        // Ensure the vendor multi-map engine is enabled (idempotent)
        try {
            const raw = (await readFilePromise(this.multMapConfigPath)).toString();
            const parsed = JSON.parse(raw);

            if (parsed.EnableMultMap !== 1) {
                parsed.EnableMultMap = 1;
                fs.writeFileSync(this.multMapConfigPath, JSON.stringify(parsed));
                Logger.info("[l10s-extended] Enabled vendor multi-map engine (mult_map.json)");
            }
        } catch (e) {
            Logger.warn("[l10s-extended] Unable to check/enable mult_map.json, continuing", e);
        }

        // Kill ava with SIGKILL: its SIGTERM shutdown handler re-persists the in-memory map
        // config, which would clobber our change below. Boot uses the stock rc.d launcher, which
        // also handles cwd/conf/pidfile. Stale /tmp/ava.pid ("Same Ava is Running") must go.
        child_process.exec("killall -9 ava 2>/dev/null; true", () => { /* fire & forget */ });

        // Wait briefly until ava is gone
        for (let i = 0; i < 40; i++) {
            await this.sleep(200);

            if (!(await this.avaRunning())) {
                break;
            }
        }

        try {
            fs.unlinkSync("/tmp/ava.pid");
        } catch {
            // pidfile may already be gone
        }

        // Settle for in-flight filesystem writes
        await this.sleep(1200);

        // We want to be the last writer before ava comes back up.
        // The firmware keeps the active map first in "order" and mirrors it in "curr_id";
        // set both to avoid boot-time normalization ambiguity.
        const configRaw = (await readFilePromise(this.mapConfigPath)).toString();
        const config = JSON.parse(configRaw);

        if (!Array.isArray(config.order) || !config.order.includes(Number(id))) {
            throw new RobotFirmwareError(`Map ${id} is not part of the vendor map order`);
        }

        config.order = [Number(id), ...config.order.filter(entry => entry !== Number(id))];
        config.curr_id = Number(id);
        fs.writeFileSync(this.mapConfigPath, JSON.stringify(config));

        await execPromise(this.avaRestartCommand, {timeout: 20000});

        // Give ava time to come up and re-init SLAM before reporting success
        await this.sleep(8000);

        this.robot.pollMap();
    }
}

module.exports = DreameL10SUltraMultipleMapCapability;
