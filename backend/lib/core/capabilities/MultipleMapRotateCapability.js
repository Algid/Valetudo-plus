const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Rotate maps
 * 
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MultipleMapRotateCapability extends Capability {
    /**
     * @param {string} id
     * @param {number} angle
     * @returns {Promise<void>}
     */
    async rotateMap(id, angle) {
        throw new NotImplementedError();
    }

    getType() {
        return MultipleMapRotateCapability.TYPE;
    }
}

MultipleMapRotateCapability.TYPE = "MultipleMapRotateCapability";

module.exports = MultipleMapRotateCapability;
