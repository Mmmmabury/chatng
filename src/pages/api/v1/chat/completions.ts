// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "@/helper/auth";
import { generatePayload, parseOpenAIStream } from "@/helper/openai";
import { fetch, ProxyAgent } from "undici";
import { IInitOptions } from "@/helper/types";
import { createRouter } from "next-connect";
import { log } from "@/helper/logger";

const apiKey = process.env.OPENAI_API_KEY;
// const apiKey = "";
const httpsProxy = process.env.HTTPS_PROXY;
var baseUrl = (process.env.OPENAI_API_BASE_URL || "https://api.openai.com")
    .trim()
    .replace(/\/$/, "");

const router = createRouter<NextApiRequest, NextApiResponse>();

/**
 * 1. 错误处理
 * 2. 发送 OpenAI API 请求
 * 3. 流式返回数据
 */
router.post(async (req, res) => {
    const { sign, time, messages } = req.body;

    var errorMsg = "";
    if (!messages) {
        errorMsg = "no messages";
        log.debug("no messages:" + messages);
    }
    if (!apiKey) {
        errorMsg = "no api key";
        log.debug("no api key:");
    }
    // 验证签名
    if (
        process.env.PROD &&
        !(await verifySignature(
            { t: time, m: messages?.[messages.length - 1]?.content || "" },
            sign
        ))
    ) {
        errorMsg = "Invalid signature";
        log.debug("Invalid signature");
    }

    if (errorMsg.length > 0) {
        res.status(400).send({ content: errorMsg });
        return;
    }

    const initOptions = generatePayload(apiKey!, messages) as IInitOptions;
    if (httpsProxy) {
        initOptions["dispatcher"] = new ProxyAgent(httpsProxy);
    }

    log.debug("openai initOptions: ", initOptions);
    // @ts-ignore
    const response = (await fetch(
        `${baseUrl}/v1/chat/completions`,
        initOptions
    )) as Response;
    // 如果 response 不是一个 SSE 流，则直接返回 response
    if (response.status !== 200) {
        const json = await response.json();
        log.error("openai response status: ", response.status, json);
        res.status(response.status).send(response);
    } else {
        const stream = parseOpenAIStream(
            response,
            messages?.[messages.length - 1]?.content
        );
        res.status(200);
        stream.stream.pipe(res);
        stream.startRead();
    }
});

export default router.handler({
    onError: (err, req, res) => {
        log.error(err);
        res.status(500).end("Something broke!");
    },
    onNoMatch: (req, res) => {
        log.error("Page is not found");
        res.status(404).end("Page is not found");
    },
});
