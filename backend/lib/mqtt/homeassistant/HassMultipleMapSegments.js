const env = require("../../res/env");
const fs = require("fs");
const Logger = require("../../Logger");
const MultipleMapCapability = require("../../core/capabilities/MultipleMapCapability");
const os = require("os");
const path = require("path");
const {isDeepStrictEqual} = require("util");

const PREFIXED_ID_REGEX = /^([^_]+)_(.+)$/;

/**
 * Home Assistant raises a "segments changed" repair whenever the published segments change, and segment IDs are per map.
 * Publishing every known map's segments, prefixed with their map ID, keeps them stable when switching maps.
 */
class HassMultipleMapSegments {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} [options.filePath]
     */
    constructor(options) {
        this.robot = options.robot;
        this.filePath = options.filePath ?? path.join(process.env[env.DataPath] ?? os.tmpdir(), "multiple_map_segments.json");

        /** @type {StoredMapSegments|undefined} */
        this.stored = undefined;
        /** @type {string|undefined} */
        this.lastMapId = undefined;
    }

    /**
     * Also stores the current map's segments under its ID.
     * Returns the current segments unchanged while only one map is known, or on robots without multiple maps.
     *
     * @param {object} currentSegments segment names by segment ID
     * @param {string|undefined} mapId missing while a map change is pending
     * @returns {Promise<object>}
     */
    async getSegments(currentSegments, mapId) {
        if (!this.robot.hasCapability(MultipleMapCapability.TYPE)) {
            return currentSegments;
        }

        const stored = this.getStored();

        // Listing maps reads from flash, so it only happens after a map switch or when the segments changed
        if (mapId !== undefined) {
            const segmentsChanged = !isDeepStrictEqual(stored[mapId]?.segments, currentSegments);

            if (segmentsChanged || mapId !== this.lastMapId) {
                this.lastMapId = mapId;
                await this.update(currentSegments, mapId, segmentsChanged);
            }
        }

        if (Object.keys(stored).length <= 1) {
            return currentSegments;
        }

        const mapNames = HassMultipleMapSegments.MAP_DISPLAY_NAMES(Object.entries(stored).map(([storedMapId, storedMap]) => {
            return {id: storedMapId, name: storedMap.name ?? `Map [${storedMapId}]`};
        }));

        /** @type {Object<string, string>} */
        const result = {};
        for (const [storedMapId, storedMap] of Object.entries(stored)) {
            for (const [segmentId, segmentName] of Object.entries(storedMap.segments ?? {})) {
                result[`${storedMapId}_${segmentId}`] = `${segmentName} (${mapNames[storedMapId]})`;
            }
        }

        return result;
    }

    /**
     * @private
     * @param {object} currentSegments
     * @param {string} mapId
     * @param {boolean} segmentsChanged
     */
    async update(currentSegments, mapId, segmentsChanged) {
        const maps = await this.robot.capabilities[MultipleMapCapability.TYPE].getMaps();

        // Everything below is synchronous, so that overlapping calls can't overwrite each other's changes
        const stored = this.getStored();
        let changed = false;

        if (segmentsChanged) {
            stored[mapId] = {...stored[mapId], segments: /** @type {Object<string, string>} */ (currentSegments)};
            changed = true;
        }

        // getMaps() returns an empty list when it fails, which must not wipe the stored maps
        if (maps.length > 0) {
            for (const entry of maps) {
                if (stored[entry.id]?.name !== entry.name) {
                    stored[entry.id] = {...stored[entry.id], name: entry.name};
                    changed = true;
                }
            }

            // The active map may not be listed yet while it's still being created
            for (const storedMapId of Object.keys(stored)) {
                if (storedMapId !== mapId && !maps.some(entry => entry.id === storedMapId)) {
                    delete stored[storedMapId];
                    changed = true;
                }
            }
        }

        if (changed) {
            this.persist();
        }
    }

    /**
     * @private
     * @returns {StoredMapSegments}
     */
    getStored() {
        if (this.stored === undefined) {
            try {
                this.stored = JSON.parse(fs.readFileSync(this.filePath, {encoding: "utf-8"}));
            } catch (e) {
                if (e.code !== "ENOENT") {
                    Logger.warn("Error while loading stored map segments", e);
                }

                this.stored = {};
            }
        }

        return this.stored;
    }

    /**
     * @private
     */
    persist() {
        const tempPath = this.filePath + ".tmp";

        try {
            fs.writeFileSync(tempPath, JSON.stringify(this.stored));
            fs.renameSync(tempPath, this.filePath);
        } catch (e) {
            try {
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            } catch (cleanupError) {
                Logger.warn("Failed to delete tmp file", cleanupError);
            }

            Logger.error("Error while persisting stored map segments", e);
        }
    }

    /**
     * The ID is only appended to tell apart maps sharing a name, as Home Assistant needs every name to be unique
     *
     * @param {Array<{id: string, name: string}>} maps
     * @returns {Object<string, string>} display names by map ID
     */
    static MAP_DISPLAY_NAMES(maps) {
        const nameCounts = {};
        for (const entry of maps) {
            nameCounts[entry.name] = (nameCounts[entry.name] ?? 0) + 1;
        }

        return Object.fromEntries(maps.map(entry => {
            return [entry.id, nameCounts[entry.name] > 1 ? `${entry.name} [${entry.id}]` : entry.name];
        }));
    }

    /**
     * Maps prefixed IDs back to segment IDs of the active map, dropping those of other maps.
     * Unprefixed IDs, and all IDs on robots without multiple maps, pass through unchanged.
     *
     * @param {import("../../core/ValetudoRobot")} robot
     * @param {Array<string>} segmentIds
     * @param {string|undefined} activeMapId
     * @returns {Array<string>}
     */
    static RESOLVE_SEGMENT_IDS(robot, segmentIds, activeMapId) {
        if (!robot.hasCapability(MultipleMapCapability.TYPE)) {
            return segmentIds;
        }

        const result = new Set();

        for (const id of segmentIds) {
            const match = PREFIXED_ID_REGEX.exec(`${id}`);

            if (match === null) {
                result.add(`${id}`);
            } else if (match[1] === activeMapId) {
                result.add(match[2]);
            } else {
                Logger.warn(`Skipping segment ${id} as it isn't on the active map`);
            }
        }

        return [...result];
    }
}

/**
 * @typedef {object} StoredMap
 * @property {string} [name] missing until the map shows up in getMaps()
 * @property {Object<string, string>} [segments] segment names by segment ID, missing until the map has been active
 */

/**
 * @typedef {Object<string, StoredMap>} StoredMapSegments by map ID
 */

module.exports = HassMultipleMapSegments;
