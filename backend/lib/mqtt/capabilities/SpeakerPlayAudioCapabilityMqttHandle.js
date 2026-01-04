const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

const NO_AUDIO_ID = "-";

class SpeakerPlayAudioCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/SpeakerPlayAudioCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Play Audio"
        }));
        this.capability = options.capability;

        this.audioList = [];
        this.audioOptions = [];
        this.activeAudio = NO_AUDIO_ID;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "play",
                friendlyName: "Play Audio",
                datatype: DataType.STRING,
                setter: async (value) => {
                    if (value === NO_AUDIO_ID) {
                        return;
                    }

                    // There is code built in to the MqttController to de-duplicate state updates which
                    // we want to subvert here and this solves the issue. It's a little messy but works
                    // fine and saves making further changes for this one off scenario.
                    this.activeAudio = value;
                    try {
                        await this.refresh();

                        await options.capability.playAudio(value);
                    } finally {
                        this.activeAudio = NO_AUDIO_ID;
                    }
                },
                getter: async () => {
                    return this.activeAudio;
                },
                helpText: "This handle allows triggering playback of audio.",
                helpMayChange: {
                    "Payload": "Available audio files will only be updated upon a restart of Valetudo."
                }
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: this.capability.getType(),
                            friendlyName: "Play Audio",
                            componentType: ComponentType.SELECT,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                value_template: "{{ value }}",
                                command_topic: prop.getBaseTopic() + "/set",
                                options: this.audioOptions,
                                icon: "mdi:volume-high",
                            }
                        })
                    );
                });
            })
        );
    }

    async configure() {
        await this.loadAudioOptions();

        await super.configure();
    }

    async loadAudioOptions() {
        try {
            const audioList = await this.capability.getAudioList();
            this.audioList = audioList;

            this.audioOptions.splice(0, this.audioOptions.length);

            this.audioOptions.push(NO_AUDIO_ID);
            this.audioOptions.push(...audioList.map(entry => entry.id));
        } catch (err) {
            Logger.error("Failed to load audio list: ", err);
        }
    }
}

SpeakerPlayAudioCapabilityMqttHandle.OPTIONAL = true;

module.exports = SpeakerPlayAudioCapabilityMqttHandle;
