const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Play audio on demand
 * 
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class SpeakerPlayAudioCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoAudioEntry")>>}
     */
    async getAudioList() {
        throw new NotImplementedError();
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async playAudio(id) {
        throw new NotImplementedError();
    }

    getType() {
        return SpeakerPlayAudioCapability.TYPE;
    }
}

SpeakerPlayAudioCapability.TYPE = "SpeakerPlayAudioCapability";

module.exports = SpeakerPlayAudioCapability;
