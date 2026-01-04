const Logger = require("../../../Logger");
const MultipleMapCapability = require("../../../core/capabilities/MultipleMapCapability");
const ValetudoMapEntry = require("../../../entities/core/ValetudoMapEntry");

/**
 * @extends MultipleMapCapability<import("../MockValetudoRobot")>
 */
class MockMultipleMapCapability extends MultipleMapCapability {
    /**
     *
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     *
     */
    constructor(options) {
        super(options);

        this.mapList = [
            new ValetudoMapEntry({id: "1", name: "Map 1", active: true}),
            new ValetudoMapEntry({id: "2", name: "Map 2", active: false}),
            new ValetudoMapEntry({id: "3", name: "Map 3", active: false}),
            new ValetudoMapEntry({id: "4", name: "Map 4", active: false}),
            new ValetudoMapEntry({id: "5", name: "Map 5", active: false})
        ];
    }

    /**
     * @returns {Promise<Array<ValetudoMapEntry>>}
     */
    async getMaps() {
        return this.mapList;
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async switchMap(id) {
        Logger.debug(`Switching to map ${id}`);

        const foundMap = this.mapList.find(entry => entry.id === id);

        if (foundMap) {
            for (const map of this.mapList) {
                map.active = false;
            }

            foundMap.active = true;
        } else {
            Logger.warn(`Failed to find map ${id}`);
        }
    }
}

module.exports = MockMultipleMapCapability;
