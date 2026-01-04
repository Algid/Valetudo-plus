/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const Logger = require("../../../Logger");

/**
 * @extends CombinedVirtualRestrictionsCapability<import("../MockValetudoRobot")>
 */
class MockCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     *
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        Logger.info("Received restrictions", virtualRestrictions);
    }
}

module.exports = MockCombinedVirtualRestrictionsCapability;
