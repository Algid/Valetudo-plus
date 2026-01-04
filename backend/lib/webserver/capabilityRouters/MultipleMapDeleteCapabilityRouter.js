const CapabilityRouter = require("./CapabilityRouter");

class MultipleMapDeleteCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "delete_map" && req.body.id !== undefined) {
                try {
                    await this.capability.deleteMap(req.body.id);
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

module.exports = MultipleMapDeleteCapabilityRouter;
