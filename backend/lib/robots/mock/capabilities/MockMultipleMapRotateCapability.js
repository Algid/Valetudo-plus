const Logger = require("../../../Logger");
const MultipleMapRotateCapability = require("../../../core/capabilities/MultipleMapRotateCapability");

/**
 * @extends MultipleMapRotateCapability<import("../MockValetudoRobot")>
 */
class MockMultipleMapRotateCapability extends MultipleMapRotateCapability {
    /**
     * @param {string} id
     * @param {number} angle
     * @returns {Promise<void>}
     */
    async rotateMap(id, angle) {
        if (angle > 359 || angle < 0) {
            angle = 0;
        }

        Logger.info(`Rotating map ${id} to ${angle}`);
    }
}

module.exports = MockMultipleMapRotateCapability;
