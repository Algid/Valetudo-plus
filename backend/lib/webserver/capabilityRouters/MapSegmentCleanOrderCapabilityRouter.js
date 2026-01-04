const CapabilityRouter = require("./CapabilityRouter");
const { ValetudoMapSegment } = require("../../entities/core");

class MapSegmentCleanOrderCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "order_segments" && req.body.segment_ids !== undefined) {
                try {
                    await this.capability.orderSegments(
                        req.body.segment_ids.map(segment_id => new ValetudoMapSegment({id: segment_id}))
                    );

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

module.exports = MapSegmentCleanOrderCapabilityRouter;
