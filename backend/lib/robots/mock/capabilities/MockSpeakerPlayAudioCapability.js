const Logger = require("../../../Logger");
const SpeakerPlayAudioCapability = require("../../../core/capabilities/SpeakerPlayAudioCapability");
const ValetudoAudioEntry = require("../../../entities/core/ValetudoAudioEntry");

/**
 * @extends SpeakerPlayAudioCapability<import("../MockValetudoRobot")>
 */
class MockSpeakerPlayAudioCapability extends SpeakerPlayAudioCapability {
    /**
     *
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     *
     */
    constructor(options) {
        super(options);

        this.audioList = [
            new ValetudoAudioEntry({id: "example_1", name: "Example 1"}),
            new ValetudoAudioEntry({id: "example_2", name: "Example 2"}),
            new ValetudoAudioEntry({id: "example_3", name: "Example 3"})
        ];
    }

    /**
     * @returns {Promise<Array<ValetudoAudioEntry>>}
     */
    async getAudioList() {
        return this.audioList;
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async playAudio(id) {
        Logger.info(`Playing audio ${id}`);
    }
}

module.exports = MockSpeakerPlayAudioCapability;
