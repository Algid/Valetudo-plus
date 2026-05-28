const env = require("./res/env");
const path = require("path");
const ProcessWatcher = require("./utils/ProcessWatcher");
const StatusStateAttribute = require("./entities/state/attributes/StatusStateAttribute");

class VideoMonitorManager {
    /**
     * @param {object} options
     * @param {import("./Configuration")} options.config
     * @param {import("./core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        const streamerProxyConfig = this.config.get("webserver")?.streamerProxy ?? {};

        if (streamerProxyConfig.manageProcesses !== true) {
            return;
        }

        const streamerBase = path.join(process.env[env.DataPath], "streamer");

        this.videoMonitorWatcher = new ProcessWatcher({
            name: "video_monitor",
            binary: path.join(streamerBase, "video_monitor"),
            spawnOptions: {
                env: {LD_PRELOAD: path.join(streamerBase, "vacuumstreamer.so")},
                stdio: "ignore"
            }
        });

        this.go2rtcWatcher = new ProcessWatcher({
            name: "go2rtc",
            binary: path.join(streamerBase, "go2rtc"),
            args: ["-c", path.join(streamerBase, "go2rtc.yaml")],
            spawnOptions: {stdio: "ignore"}
        });

        if (!this.videoMonitorWatcher.binaryExists || !this.go2rtcWatcher.binaryExists) {
            return;
        }

        if (streamerProxyConfig.stopWhenIdle === true) {
            this.robot.onStateAttributesUpdated(() => {
                this.handleStateUpdate();
            });
        } else {
            this.startWatchers();
        }
    }

    handleStateUpdate() {
        const statusAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(StatusStateAttribute);

        if (!statusAttribute) {
            return;
        }

        if (statusAttribute.isActiveState && !this.videoMonitorWatcher.isActive) {
            this.startWatchers();
        } else if (!statusAttribute.isActiveState && this.videoMonitorWatcher.isActive) {
            this.stopWatchers();
        }
    }

    startWatchers() {
        this.videoMonitorWatcher.start();
        this.go2rtcWatcher.start();
    }

    stopWatchers() {
        this.videoMonitorWatcher.stop();
        this.go2rtcWatcher.stop();
    }

    async shutdown() {
        if (this.videoMonitorWatcher) {
            this.stopWatchers();
        }
    }
}

module.exports = VideoMonitorManager;
