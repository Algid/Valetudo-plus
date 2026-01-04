const Logger = require("../../../Logger");
const MapSegmentCleanOrderCapability = require("../../../core/capabilities/MapSegmentCleanOrderCapability");

/**
 * @extends MapSegmentCleanOrderCapability<import("../MockValetudoRobot")>
 */
class MockMapSegmentCleanOrderCapability extends MapSegmentCleanOrderCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     */
    async orderSegments(segments) {
        Logger.info(`New segment order ${segments.map(segment => segment.id)}`);
    }
}

module.exports = MockMapSegmentCleanOrderCapability;
