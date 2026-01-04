const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Rename maps
 * 
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MultipleMapRenameCapability extends Capability {
    /**
     * @param {string} id
     * @param {string} name
     * @returns {Promise<void>}
     */
    async renameMap(id, name) {
        throw new NotImplementedError();
    }

    getType() {
        return MultipleMapRenameCapability.TYPE;
    }
}

MultipleMapRenameCapability.TYPE = "MultipleMapRenameCapability";

module.exports = MultipleMapRenameCapability;
