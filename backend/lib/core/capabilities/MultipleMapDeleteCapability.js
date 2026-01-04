const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Delete maps
 * 
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MultipleMapDeleteCapability extends Capability {
    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteMap(id) {
        throw new NotImplementedError();
    }

    getType() {
        return MultipleMapDeleteCapability.TYPE;
    }
}

MultipleMapDeleteCapability.TYPE = "MultipleMapDeleteCapability";

module.exports = MultipleMapDeleteCapability;
