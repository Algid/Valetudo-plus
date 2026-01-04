const Logger = require("../../../Logger");
const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");

/**
 * @extends MapSegmentRenameCapability<import("../MockValetudoRobot")>
 */
class MockMapSegmentRenameCapability extends MapSegmentRenameCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {string} name
     * @returns {Promise<void>}
     */
    async renameSegment(segment, name) {
        Logger.info(`Would rename segment ${segment.id} to ${name}`);
    }
}

module.exports = MockMapSegmentRenameCapability;
