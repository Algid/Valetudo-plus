const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MapSegmentCleanOrderCapability extends Capability {
    /**
     * @param {Array<import("../../entities/core/ValetudoMapSegment")>} segments
     */
    async orderSegments(segments) {
        throw new NotImplementedError();
    }

    getType() {
        return MapSegmentCleanOrderCapability.TYPE;
    }
}

MapSegmentCleanOrderCapability.TYPE = "MapSegmentCleanOrderCapability";

module.exports = MapSegmentCleanOrderCapability;
