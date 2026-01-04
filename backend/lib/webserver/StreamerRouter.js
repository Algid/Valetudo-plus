const express = require("express");
const httpProxyMiddleware = require("http-proxy-middleware");
const Logger = require("../Logger");

class StreamerRouter {
    /**
     *
     * @param {object} options
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.webserverConfig = this.config.get("webserver");

        this.initRoutes();
    }

    initRoutes() {
        this.router.use("/", httpProxyMiddleware.createProxyMiddleware({
            target: this.webserverConfig.streamerProxy.url,
            pathRewrite: {
                "^/streamer": ""
            },
            ws: true,
            proxyTimeout: this.webserverConfig.streamerProxy.timeoutMs,
            timeout: this.webserverConfig.streamerProxy.timeoutMs,
            on: {
                error: err => {
                    Logger.error("Failed to proxy request: ", err);
                },
            },
        }));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = StreamerRouter;
