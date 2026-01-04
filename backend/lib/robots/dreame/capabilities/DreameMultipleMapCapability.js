const fs = require("fs");
const Logger = require("../../../Logger");
const MultipleMapCapability = require("../../../core/capabilities/MultipleMapCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");
const util = require("util");
const ValetudoMapEntry = require("../../../entities/core/ValetudoMapEntry");

const readFilePromise = util.promisify(fs.readFile);

/**
 * @extends MultipleMapCapability<import("../DreameValetudoRobot")>
 */
class DreameMultipleMapCapability extends MultipleMapCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mapDetails
     * @param {number} options.miot_properties.mapDetails.piid
     * @param {object} options.miot_properties.actionResult
     * @param {number} options.miot_properties.actionResult.piid
     *
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }

    /**
     * @returns {Promise<Array<ValetudoMapEntry>>}
     */
    async getMaps() {
        if (!this.robot.config.get("embedded")) {
            Logger.warn("Can't get maps as we're not embedded");
            return [];
        }

        const maps = [];

        try {
            // Contains maps IDs and active map
            const mapConfig = (await readFilePromise("/data/ri/config.json2")).toString();
            /** @type {{ curr_id: number; order: Array<number> }} */
            const parsedConfig = JSON.parse(mapConfig);

            // Contains map names
            const mapSetting = (await readFilePromise("/data/ri/setting.json2")).toString();
            /** @type {{ map_names: { [key: string]: string } }} */
            const parsedSetting = JSON.parse(mapSetting);

            const activeId = parsedConfig.curr_id;
            const nameMap = (parsedSetting.map_names ?? {});

            for (const id of parsedConfig.order ?? []) {
                maps.push(new ValetudoMapEntry({
                    id: `${id}`,
                    name: (nameMap[id] ?? "").length > 0 ? nameMap[id] : `Map (${id})`,
                    active: activeId === id
                }));
            }

            maps.sort((a, b) => a.name.localeCompare(b.name));
        } catch (err) {
            Logger.error("Failed to get maps: ", err);
        }

        return maps;
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async switchMap(id) {
        Logger.debug(`Switching to map ${id}`);

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            sm: {},
                            mapid: Number(id)
                        })
                    }
                ]
            },
            {timeout: 5000}
        );

        if (
            res && res.siid === this.miot_actions.map_edit.siid &&
            res.aiid === this.miot_actions.map_edit.aiid &&
            Array.isArray(res.out) && res.out.length === 1 &&
            res.out[0].piid === this.miot_properties.actionResult.piid
        ) {
            switch (res.out[0].value) {
                case 0:
                    // Small delay to allow change to apply
                    await new Promise(resolve => setTimeout(resolve, 500));

                    this.robot.pollMap();
                    return;
                default:
                    throw new RobotFirmwareError("Got error " + res.out[0].value + " while switching map.");
            }
        }
    }
}

module.exports = DreameMultipleMapCapability;
