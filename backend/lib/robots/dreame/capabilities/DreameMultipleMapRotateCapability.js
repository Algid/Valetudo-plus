const Logger = require("../../../Logger");
const MultipleMapRotateCapability = require("../../../core/capabilities/MultipleMapRotateCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");

/**
 * @extends MultipleMapRotateCapability<import("../DreameValetudoRobot")>
 */
class DreameMultipleMapRotateCapability extends MultipleMapRotateCapability {
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
     * @param {string} id
     * @param {number} angle
     * @returns {Promise<void>}
     */
    async rotateMap(id, angle) {
        if (angle > 359 || angle < 0) {
            angle = 0;
        }

        Logger.debug(`Rotating map ${id} to ${angle} deg`);

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            smra: {
                                [id]: { ra: angle }
                            },
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
                    this.robot.pollMap();
                    return;
                default:
                    throw new RobotFirmwareError("Got error " + res.out[0].value + " while rotating map.");
            }
        }
    }
}

module.exports = DreameMultipleMapRotateCapability;
