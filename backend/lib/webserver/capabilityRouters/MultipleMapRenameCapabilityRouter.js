const CapabilityRouter = require("./CapabilityRouter");

class MultipleMapRenameCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "rename_map" && req.body.id !== undefined && req.body.name !== undefined) {
                try {
                    await this.capability.renameMap(req.body.id, req.body.name);
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = MultipleMapRenameCapabilityRouter;
