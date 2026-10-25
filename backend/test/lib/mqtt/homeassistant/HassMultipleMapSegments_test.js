const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { describe, it, beforeEach, afterEach } = require("node:test");

const HassMultipleMapSegments = require("../../../../lib/mqtt/homeassistant/HassMultipleMapSegments");
const MultipleMapCapability = require("../../../../lib/core/capabilities/MultipleMapCapability");

const MAPS = [{id: "1", name: "Downstairs"}, {id: "2", name: "Upstairs"}];

function createRobot(maps, enabled = true) {
    return {
        hasCapability: () => {
            return enabled;
        },
        capabilities: {
            [MultipleMapCapability.TYPE]: {
                getMaps: async () => {
                    return maps;
                }
            }
        }
    };
}

describe("HassMultipleMapSegments", () => {
    let dir;
    let filePath;

    function create(robot) {
        return new HassMultipleMapSegments({robot: robot, filePath: filePath});
    }

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "hass-multiple-map-segments-"));
        filePath = path.join(dir, "segments.json");
    });

    afterEach(() => {
        fs.rmSync(dir, {recursive: true, force: true});
    });

    it("publishes the same segments for every map once each has been seen", async () => {
        const helper = create(createRobot(MAPS));

        await helper.getSegments({"1": "Kitchen", "2": "Hall"}, "1");
        const afterSecondMap = await helper.getSegments({"1": "Bedroom"}, "2");
        const afterSwitchingBack = await helper.getSegments({"1": "Kitchen", "2": "Hall"}, "1");

        const expected = {
            "1_1": "Kitchen (Downstairs)",
            "1_2": "Hall (Downstairs)",
            "2_1": "Bedroom (Upstairs)"
        };
        assert.deepStrictEqual(afterSecondMap, expected);
        assert.deepStrictEqual(afterSwitchingBack, expected);
    });

    it("loads the stored segments after a restart", async () => {
        const helper = create(createRobot(MAPS));
        await helper.getSegments({"1": "Kitchen"}, "1");
        await helper.getSegments({"1": "Bedroom"}, "2");

        const restarted = create(createRobot(MAPS));

        assert.deepStrictEqual(Object.keys(await restarted.getSegments({"1": "Kitchen"}, "1")), ["1_1", "2_1"]);
    });

    it("only writes the file when a map's segments change", async () => {
        const helper = create(createRobot(MAPS));
        let writes = 0;
        const persist = helper.persist.bind(helper);
        helper.persist = () => {
            writes++;
            persist();
        };

        await helper.getSegments({"1": "Kitchen"}, "1");
        await helper.getSegments({"1": "Kitchen"}, "1");
        assert.strictEqual(writes, 1);

        await helper.getSegments({"1": "Kitchen", "2": "Hall"}, "1");
        assert.strictEqual(writes, 2);
    });

    it("forgets deleted maps on the next listing, but not when listing maps fails", async () => {
        const maps = [...MAPS, {id: "3", name: "Garage"}];
        const helper = create(createRobot(maps));

        await helper.getSegments({"1": "Kitchen"}, "1");
        await helper.getSegments({"1": "Bedroom"}, "2");
        await helper.getSegments({"1": "Workbench"}, "3");

        maps.splice(0, maps.length);
        assert.deepStrictEqual(Object.keys(await helper.getSegments({"1": "Kitchen"}, "1")), ["1_1", "2_1", "3_1"]);

        maps.push(...MAPS);
        assert.deepStrictEqual(Object.keys(await helper.getSegments({"1": "Bedroom"}, "2")), ["1_1", "2_1"]);
    });

    it("keeps the active map even when it isn't listed yet", async () => {
        const helper = create(createRobot(MAPS));

        await helper.getSegments({"1": "Kitchen"}, "1");

        assert.deepStrictEqual(
            await helper.getSegments({"1": "Office"}, "7"),
            {"1_1": "Kitchen (Downstairs)", "7_1": "Office (Map [7])"}
        );
    });

    it("adds the map ID to the label of maps sharing a name", async () => {
        const helper = create(createRobot([{id: "15", name: "Upstairs"}, {id: "96", name: "Upstairs"}]));

        await helper.getSegments({"1": "Bedroom"}, "15");

        assert.deepStrictEqual(
            await helper.getSegments({"1": "Bedroom"}, "96"),
            {"15_1": "Bedroom (Upstairs [15])", "96_1": "Bedroom (Upstairs [96])"}
        );
    });

    it("leaves no temporary file behind after saving", async () => {
        const helper = create(createRobot(MAPS));

        await helper.getSegments({"1": "Kitchen"}, "1");

        assert.deepStrictEqual(fs.readdirSync(dir), ["segments.json"]);
    });

    it("publishes plain segments while only one map exists", async () => {
        const helper = create(createRobot([MAPS[0]]));

        assert.deepStrictEqual(await helper.getSegments({"1": "Kitchen"}, "1"), {"1": "Kitchen"});
    });

    it("keeps the stored map names when listing maps fails", async () => {
        const maps = [...MAPS];
        const helper = create(createRobot(maps));

        await helper.getSegments({"1": "Kitchen"}, "1");
        maps.splice(0, maps.length);

        assert.deepStrictEqual(
            await helper.getSegments({"1": "Bedroom"}, "2"),
            {"1_1": "Kitchen (Downstairs)", "2_1": "Bedroom (Upstairs)"}
        );
    });

    it("only lists maps after a map switch or a segment change", async () => {
        const robot = createRobot(MAPS);
        let listings = 0;
        const getMaps = robot.capabilities[MultipleMapCapability.TYPE].getMaps;
        robot.capabilities[MultipleMapCapability.TYPE].getMaps = async () => {
            listings++;

            return getMaps();
        };
        const helper = create(robot);

        await helper.getSegments({"1": "Kitchen"}, "1");
        await helper.getSegments({"1": "Kitchen"}, "1");
        assert.strictEqual(listings, 1);

        await helper.getSegments({"1": "Kitchen", "2": "Hall"}, "1");
        await helper.getSegments({"1": "Bedroom"}, "2");
        assert.strictEqual(listings, 3);
    });

    it("doesn't lose a map when calls overlap", async () => {
        const helper = create(createRobot(MAPS));

        await Promise.all([
            helper.getSegments({"1": "Kitchen"}, "1"),
            helper.getSegments({"1": "Bedroom"}, "2")
        ]);

        assert.deepStrictEqual(Object.keys(await helper.getSegments({"1": "Kitchen"}, "1")), ["1_1", "2_1"]);
    });

    it("keeps publishing the stored segments while the map ID is unknown", async () => {
        const helper = create(createRobot(MAPS));

        await helper.getSegments({"1": "Kitchen"}, "1");
        await helper.getSegments({"1": "Bedroom"}, "2");

        assert.deepStrictEqual(
            await helper.getSegments({"9": "Pending"}, undefined),
            {"1_1": "Kitchen (Downstairs)", "2_1": "Bedroom (Upstairs)"}
        );
    });

    it("doesn't list or forget maps while the map ID is unknown", async () => {
        const maps = [MAPS[0]];
        const robot = createRobot(maps);
        let listings = 0;
        robot.capabilities[MultipleMapCapability.TYPE].getMaps = async () => {
            listings++;

            return maps;
        };
        const helper = create(robot);

        await helper.getSegments({"1": "Kitchen"}, "1");
        await helper.getSegments({"1": "Office"}, "7");
        await helper.getSegments({}, undefined);

        assert.strictEqual(listings, 2);
        assert.deepStrictEqual(
            await helper.getSegments({"1": "Office"}, "7"),
            {"1_1": "Kitchen (Downstairs)", "7_1": "Office (Map [7])"}
        );
    });

    it("falls back to the current map's plain segments before any map ID is known", async () => {
        const helper = create(createRobot(MAPS));

        assert.deepStrictEqual(await helper.getSegments({"1": "Kitchen"}, undefined), {"1": "Kitchen"});
    });

    it("uses the plain map name unless another map shares it", () => {
        assert.deepStrictEqual(
            HassMultipleMapSegments.MAP_DISPLAY_NAMES([{id: "1", name: "Main"}, {id: "15", name: "Upstairs"}, {id: "96", name: "Upstairs"}]),
            {"1": "Main", "15": "Upstairs [15]", "96": "Upstairs [96]"}
        );
    });

    it("resolves prefixed IDs for the active map, drops other maps, passes plain IDs through and removes duplicates", () => {
        assert.deepStrictEqual(
            HassMultipleMapSegments.RESOLVE_SEGMENT_IDS(createRobot(MAPS), ["1_3", "2_4", "5", 6, "3"], "1"),
            ["3", "5", "6"]
        );
    });

    it("leaves segments and IDs unchanged on robots without multiple maps", async () => {
        const helper = create(createRobot(MAPS, false));

        assert.deepStrictEqual(await helper.getSegments({"1": "Kitchen"}, "1"), {"1": "Kitchen"});
        assert.deepStrictEqual(HassMultipleMapSegments.RESOLVE_SEGMENT_IDS(createRobot(MAPS, false), ["1_3"], "1"), ["1_3"]);
        assert.strictEqual(fs.existsSync(filePath), false);
    });
});
