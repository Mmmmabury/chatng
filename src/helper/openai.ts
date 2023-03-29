import {
    createParser,
    ParsedEvent,
    ReconnectInterval,
} from "eventsource-parser";
import type { IMessage } from "./types";
import process from "process";
import { NextApiResponse } from "next";
import { Readable } from "stream";
import { log } from "./logger";

export const generatePayload = (
    apiKey: string,
    messages: IMessage[]
): RequestInit => ({
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: JSON.stringify({
        model: "gpt-3.5-turbo",
        // model: "gpt-4",
        messages,
        temperature: 0.6,
        stream: true,
    }),
});

/**

解析 OpenAI 的服务器端事件流并返回可读流。
@param rawResponse 从 OpenAI 返回的原始响应。
@param query OpenAI 请求的查询。
@returns 可读流，包含从 OpenAI 返回的响应消息。
          OpenAI 响应数据
          response = {
            id: 'chatcmpl-6pULPSegWhFgi0XQ1DtgA3zTa1WR6',
            object: 'chat.completion.chunk',
            created: 1677729391,
            model: 'gpt-3.5-turbo-0301',
            choices: [
            { delta: { content: '你' }, index: 0, finish_reason: null }
            ],
          }
*/
export const parseOpenAIStream = (
    rawResponse: Response,
    query: string = ""
) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    var responseMessage = "";

    const stream = new Readable({
        read() {},
    });
    const startRead = async () => {
        const streamParser = (event: ParsedEvent | ReconnectInterval) => {
            if (event.type === "event") {
                const data = event.data;
                if (data === "[DONE]") {
                    process.stdout.write("------------\n");
                    process.stdout.write(
                        "--Query：" + query.replace("\n", "") + "\n"
                    );
                    process.stdout.write(
                        "--AI：" + responseMessage.replace("\n", "") + "\n"
                    );
                    stream.push(null);
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    const text = json.choices[0].delta?.content || "";
                    log.debug("openai response data: ", text);
                    responseMessage = responseMessage + text;
                    const queue = encoder.encode(text);
                    const id = Date.now();
                    stream.push(text);
                } catch (e) {}
            }
        };
        const parser = createParser(streamParser);
        for await (const chunk of rawResponse.body as any) {
            parser.feed(decoder.decode(chunk));
        }
    };
    return { stream, startRead };
};
