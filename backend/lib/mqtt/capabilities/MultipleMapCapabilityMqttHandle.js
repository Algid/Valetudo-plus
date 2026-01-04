const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class MultipleMapCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/MultipleMapCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Map"
        }));
        this.capability = options.capability;

        this.maps = [];
        this.mapsOptions = [];

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "map",
                friendlyName: "Map",
                datatype: DataType.STRING,
                setter: async (value) => {
                    const entry = this.findMapEntryByOptionStr(value);

                    if (!entry) {
                        throw new Error(`Map does not exist ${value}`);
                    }

                    await this.capability.switchMap(entry.id);
                    await this.loadMapOptions();
                },
                getter: async () => {
                    const activeMap = this.maps.find(entry => entry.active);

                    if (!activeMap) {
                        throw new Error("Failed to find active map");
                    }

                    return this.mapEntryToOptionStr(activeMap);
                },
                helpText: "This handle allows setting the current active map.",
                helpMayChange: {
                    "Payload": "Available maps may change as the robot and user perform different operations." +
                        "These changes will take a short period of time to reflect on Home Assistant."
                }
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: this.capability.getType(),
                            friendlyName: "Map",
                            componentType: ComponentType.SELECT,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                value_template: "{{ value }}",
                                command_topic: prop.getBaseTopic() + "/set",
                                options: this.mapsOptions,
                                icon: "mdi:map",
                                entity_category: EntityCategory.CONFIG,
                            }
                        })
                    );
                });
            })
        );
    }

    async refresh() {
        await this.loadMapOptions();

        // We must do this to ensure the options are updated in HASS
        await this.hassRefreshAutoconf();

        // Small delay to ensure autoconf has applied as sometimes HASS ignores value updates if sent too quickly
        await new Promise(resolve => setTimeout(resolve, 3000));

        await super.refresh();
    }

    async loadMapOptions() {
        try {
            const maps = await this.capability.getMaps();
            this.maps = maps;

            this.mapsOptions.splice(0, this.mapsOptions.length);
            this.mapsOptions.push(...maps.map(entry => this.mapEntryToOptionStr(entry)));
        } catch (err) {
            Logger.error("Failed to load maps: ", err);
        }
    }

    async hassRefreshAutoconf() {
        for (const child of this.children) {
            for (const hassComponent of child.hassComponents) {
                hassComponent.refreshAutoconf();
            }
        }
    }

    /**
     * @param {import("../../entities/core/ValetudoMapEntry")} entry
     * @returns {string}
     */
    mapEntryToOptionStr(entry) {
        return `${entry.name} [${entry.id}]`;
    }

    /**
     * @param {string} optionStr
     * @returns {import("../../entities/core/ValetudoMapEntry") | undefined}
     */
    findMapEntryByOptionStr(optionStr) {
        const result = /^(.+) \[(.+)\]$/.exec(optionStr);

        if (!result || result.length !== 3) {
            return undefined;
        }

        return this.maps.find(entry => entry.name === result[1] && entry.id === result[2]);
    }
}

MultipleMapCapabilityMqttHandle.OPTIONAL = true;

module.exports = MultipleMapCapabilityMqttHandle;
