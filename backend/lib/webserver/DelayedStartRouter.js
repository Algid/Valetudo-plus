const DelayedStart = require("../scheduler/DelayedStart");
const express = require("express");
const TimerRouter = require("./TimerRouter");

class DelayedStartRouter {
    /**
     *
     * @param {object} options
     * @param {import("../scheduler/DelayedStart")} options.delayedStart
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.delayedStart = options.delayedStart;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json(this.mapPendingToResponse(this.delayedStart.getPending()));
        });

        this.router.put("/", this.validator, (req, res) => {
            if (
                typeof req.body.delay === "number" &&
                req.body.action && typeof req.body.action.type === "string"
            ) {
                const action = TimerRouter.MAP_ACTION_FROM_BODY(req.body);
                const preActions = TimerRouter.MAP_PRE_ACTIONS_FROM_BODY(req.body);

                if (!action || !(req.body.delay > 0 && req.body.delay <= DelayedStart.MAX_DELAY_SECONDS)) {
                    res.sendStatus(400);
                } else {
                    const pending = this.delayedStart.set({
                        delay: req.body.delay,
                        action: action,
                        pre_actions: preActions
                    });

                    res.json(this.mapPendingToResponse(pending));
                }
            } else {
                res.sendStatus(400);
            }
        });

        this.router.delete("/", (req, res) => {
            this.delayedStart.clear();

            res.sendStatus(200);
        });
    }

    getRouter() {
        return this.router;
    }

    /**
     * The remaining time comes from the robot's clock, so clients can count down without trusting their own
     *
     * @private
     * @param {import("../scheduler/DelayedStart").DelayedStartDefinition|null} pending
     */
    mapPendingToResponse(pending) {
        if (pending === null) {
            return {pending: null};
        }

        return {
            pending: {
                remaining: Math.max(0, Math.round((pending.start_time - Date.now()) / 1000)),
                action: pending.action,
                pre_actions: pending.pre_actions
            }
        };
    }
}

module.exports = DelayedStartRouter;
