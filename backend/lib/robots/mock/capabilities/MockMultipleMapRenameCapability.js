const Logger = require("../../../Logger");
const MultipleMapRenameCapability = require("../../../core/capabilities/MultipleMapRenameCapability");

/**
 * @extends MultipleMapRenameCapability<import("../MockValetudoRobot")>
 */
class MockMultipleMapRenameCapability extends MultipleMapRenameCapability {
    /**
     * @param {string} id
     * @param {string} name
     * @returns {Promise<void>}
     */
    async renameMap(id, name) {
        Logger.debug(`Renaming map ${id} to ${name}`);

        const mapList = await this.robot.capabilities["MultipleMapCapability"].getMaps();

        const foundMap = mapList.find(entry => entry.id === id);

        if (foundMap) {
            foundMap.name = name;
        } else {
            Logger.warn(`Failed to find map ${id}`);
        }
    }
}

module.exports = MockMultipleMapRenameCapability;
