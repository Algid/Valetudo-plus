const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * List and switch between maps
 * 
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MultipleMapCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoMapEntry")>>}
     */
    async getMaps() {
        throw new NotImplementedError();
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async switchMap(id) {
        throw new NotImplementedError();
    }

    getType() {
        return MultipleMapCapability.TYPE;
    }
}

MultipleMapCapability.TYPE = "MultipleMapCapability";

module.exports = MultipleMapCapability;
