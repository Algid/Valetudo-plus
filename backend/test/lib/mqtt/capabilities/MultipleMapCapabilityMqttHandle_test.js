const assert = require("node:assert");
const { describe, it } = require("node:test");

const MultipleMapCapabilityMqttHandle = require("../../../../lib/mqtt/capabilities/MultipleMapCapabilityMqttHandle");

async function createHandle(maps) {
    const handle = Object.create(MultipleMapCapabilityMqttHandle.prototype);
    handle.capability = {
        getMaps: async () => {
            return maps;
        }
    };
    handle.mapsOptions = [];
    await handle.loadMapOptions();

    return handle;
}

describe("MultipleMapCapabilityMqttHandle", () => {
    const maps = [
        {id: "1", name: "Main"},
        {id: "15", name: "Upstairs"},
        {id: "96", name: "Upstairs"}
    ];

    it("uses the plain name unless another map shares it", async () => {
        assert.deepStrictEqual((await createHandle(maps)).mapsOptions, ["Main", "Upstairs [15]", "Upstairs [96]"]);
    });

    it("finds maps by their option", async () => {
        const handle = await createHandle(maps);

        assert.strictEqual(handle.findMapEntryByOptionStr("Main").id, "1");
        assert.strictEqual(handle.findMapEntryByOptionStr("Upstairs [96]").id, "96");
        assert.strictEqual(handle.findMapEntryByOptionStr("Upstairs"), undefined);
    });

    it("still accepts the old \"<name> [<id>]\" options", async () => {
        const handle = await createHandle(maps);

        assert.strictEqual(handle.findMapEntryByOptionStr("Main [1]").id, "1");
        assert.strictEqual(handle.findMapEntryByOptionStr("Old name [1]").id, "1");
        assert.strictEqual(handle.findMapEntryByOptionStr("Main [7]"), undefined);
    });
});
