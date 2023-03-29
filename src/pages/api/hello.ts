// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { log } from "@/helper/logger";
import { randomInt } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { Readable } from "stream";

const clients = new Set<NextApiResponse>();

const router = createRouter<NextApiRequest, NextApiResponse>();

router
    .all(async (req, res, next) => {
        console.log(`hello api ${req.method} req:`, req.body);
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // flush the headers to establish SSE with client
        next();
    })
    .get(async (req, res) => {})
    .post(async (req, res) => {
        var count = 0;
        const stream = new Readable({
            read() {
                try {
                    const interval = setInterval(() => {
                        if (res.writableEnded) {
                            // 检查连接是否仍然存在
                            clearInterval(interval);
                            this.destroy();
                            return;
                        }
                        if (count === 1000) {
                            this.push(null);
                            clearInterval(interval);
                            return;
                        }
                        const char = randomInt(9).toString();
                        this.push(char);
                        count += 1;
                    }, 300);
                } catch (err) {
                    // this.emit("error", err);
                }
            },
        });
        if (res.socket) {
            log.info("sock !!!");
        }
        res.socket!.on("error", (err) => {
            console.error(`Stream error: ${err.stack}`);
            res.end();
        });
        stream.on("error", (err) => {
            console.error(`Stream error: ${err.stack}`);
        });
        res.status(200);
        stream.pipe(res);
    });

export default router.handler({
    onError: (err, req, res) => {
        console.error((err as Error).stack);
        res.status(500).end("Something broke!");
    },
    onNoMatch: (req, res) => {
        res.status(404).end("Page is not found");
    },
});
