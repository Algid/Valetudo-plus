const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class MopDockCleanManualTriggerCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/MopDockCleanManualTriggerCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Mop Dock Clean Manual Trigger"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "trigger",
            friendlyName: "Mop Dock Clean Manual Trigger",
            datatype: DataType.ENUM,
            format: [Commands.BASIC_CONTROL.START, Commands.BASIC_CONTROL.STOP].join(","),
            setter: async (value) => {
                if (value === Commands.BASIC_CONTROL.START) {
                    await this.capability.startCleaning();
                } else {
                    await this.capability.stopCleaning();
                }
            }
        }).also((prop) => {
            this.controller.withHass((hass) => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: this.capability.getType() + "_start",
                        friendlyName: "Trigger Mop Dock Clean",
                        componentType: ComponentType.BUTTON,
                        autoconf: {
                            command_topic: `${prop.getBaseTopic()}/set`,
                            payload_press: Commands.BASIC_CONTROL.START,
                            icon: "mdi:water-pump"
                        }
                    })
                );
            });

            this.controller.withHass((hass) => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: this.capability.getType() + "_stop",
                        friendlyName: "Stop Mop Dock Clean",
                        componentType: ComponentType.BUTTON,
                        autoconf: {
                            command_topic: `${prop.getBaseTopic()}/set`,
                            payload_press: Commands.BASIC_CONTROL.STOP,
                            icon: "mdi:water-pump-off"
                        }
                    })
                );
            });
        }));
    }
}

MopDockCleanManualTriggerCapabilityMqttHandle.OPTIONAL = false;

module.exports = MopDockCleanManualTriggerCapabilityMqttHandle;
