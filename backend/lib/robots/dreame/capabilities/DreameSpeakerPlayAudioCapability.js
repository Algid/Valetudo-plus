const child_process = require("child_process");
const env = require("../../../res/env");
const fs = require("fs");
const lodash = require("lodash");
const Logger = require("../../../Logger");
const path = require("path");
const SpeakerPlayAudioCapability = require("../../../core/capabilities/SpeakerPlayAudioCapability");
const util = require("util");
const ValetudoAudioEntry = require("../../../entities/core/ValetudoAudioEntry");

const statPromise = util.promisify(fs.stat);
const readdirPromise = util.promisify(fs.readdir);
const execPromise = util.promisify(child_process.exec);

/**
 * @extends SpeakerPlayAudioCapability<import("../DreameValetudoRobot")>
 */
class DreameSpeakerPlayAudioCapability extends SpeakerPlayAudioCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        if (!fs.existsSync(this.audioDirPath)) {
            fs.mkdirSync(this.audioDirPath);
        }
    }

    /**
     * @returns {Promise<Array<ValetudoAudioEntry>>}
     */
    async getAudioList() {
        if (!this.robot.config.get("embedded")) {
            Logger.warn("Can't get audio list as we're not embedded");
            return [];
        }

        const audioList = [];

        try {
            const audioFiles = await readdirPromise(this.audioDirPath);

            const allFilesList = audioFiles
                .filter(fileName => fileName.endsWith(".ogg"))
                .map(fileName => path.basename(fileName, ".ogg"))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            // Do some creative file ordering
            const numberFilesList = allFilesList.filter(name => /[0-9]/.test(name.substring(0, 1)));
            const otherFilesList = allFilesList.filter(name => /[^0-9]/.test(name.substring(0, 1)));
            const combinedFilesList = [...otherFilesList, ...numberFilesList];

            for (const name of combinedFilesList) {
                audioList.push(new ValetudoAudioEntry({
                    id: name,
                    name: lodash.startCase(name)
                }));
            }
        } catch (err) {
            Logger.error("Failed to get audio list: ", err);
        }

        return audioList;
    }

    /**
     * @param {string} id
     * @returns {Promise<void>}
     */
    async playAudio(id) {
        if (!this.robot.config.get("embedded")) {
            Logger.warn("Can't play audio as we're not embedded");
            return;
        }

        Logger.debug(`Playing audio ${id}`);

        const fileName = `${id}.ogg`;
        if (fileName !== path.basename(fileName)) {
            throw new Error("Failed to play audio as the name was invalid");
        }

        try {
            const audioPath = path.join(this.audioDirPath, fileName);

            if (!(await statPromise(audioPath))) {
                throw new Error("Failed to play audio as the file doesn't exist");
            }

            // Run audio playback async
            execPromise(`oggdec ${audioPath} -s 0 -b 8 -o - | aplay -r 16000`).then(() => {
                Logger.debug(`Completed playback of audio ${id}`);
            }).catch((err) => {
                Logger.warn(`Failed to complete playback of audio ${id}: `, err);
            });
        } catch (err) {
            Logger.error("Failed to play audio: ", err);
            throw new Error("Failed to play audio");
        }
    }

    get audioDirPath() {
        return path.join(process.env[env.DataPath], "audio");
    }
}

module.exports = DreameSpeakerPlayAudioCapability;
