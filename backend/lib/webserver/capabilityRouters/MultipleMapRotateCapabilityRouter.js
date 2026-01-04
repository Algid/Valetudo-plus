const CapabilityRouter = require("./CapabilityRouter");

class MultipleMapRotateCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "rotate_map" && req.body.id !== undefined && req.body.angle !== undefined) {
                try {
                    await this.capability.rotateMap(req.body.id, req.body.angle);
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

module.exports = MultipleMapRotateCapabilityRouter;
