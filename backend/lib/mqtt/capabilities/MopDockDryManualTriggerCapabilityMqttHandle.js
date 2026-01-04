const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class MopDockDryManualTriggerCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/MopDockDryManualTriggerCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Mop Dock Dry Manual Trigger"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "trigger",
            friendlyName: "Mop Dock Dry Manual Trigger",
            datatype: DataType.ENUM,
            format: [Commands.BASIC_CONTROL.START, Commands.BASIC_CONTROL.STOP].join(","),
            setter: async (value) => {
                if (value === Commands.BASIC_CONTROL.START) {
                    await this.capability.startDrying();
                } else {
                    await this.capability.stopDrying();
                }
            }
        }).also((prop) => {
            this.controller.withHass((hass) => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: this.capability.getType() + "_start",
                        friendlyName: "Trigger Mop Dock Dry",
                        componentType: ComponentType.BUTTON,
                        autoconf: {
                            command_topic: `${prop.getBaseTopic()}/set`,
                            payload_press: Commands.BASIC_CONTROL.START,
                            icon: "mdi:fan"
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
                        friendlyName: "Stop Mop Dock Dry",
                        componentType: ComponentType.BUTTON,
                        autoconf: {
                            command_topic: `${prop.getBaseTopic()}/set`,
                            payload_press: Commands.BASIC_CONTROL.STOP,
                            icon: "mdi:fan-off"
                        }
                    })
                );
            });
        }));
    }
}

MopDockDryManualTriggerCapabilityMqttHandle.OPTIONAL = false;

module.exports = MopDockDryManualTriggerCapabilityMqttHandle;
