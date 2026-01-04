const Logger = require("../../../Logger");
const MultipleMapDeleteCapability = require("../../../core/capabilities/MultipleMapDeleteCapability");

/**
 * @extends MultipleMapDeleteCapability<import("../MockValetudoRobot")>
 */
class MockMultipleMapDeleteCapability extends MultipleMapDeleteCapability {
    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteMap(id) {
        Logger.debug(`Deleting map ${id}`);

        const mapList = await this.robot.capabilities["MultipleMapCapability"].getMaps();

        const mapIndex = mapList.findIndex(entry => entry.id === id);

        if (mapIndex !== -1) {
            mapList.splice(mapIndex, 1);
        } else {
            Logger.warn(`Failed to find map ${id}`);
        }
    }
}

module.exports = MockMultipleMapDeleteCapability;
