import React, { useEffect } from "react";
import { AIIcon } from "@/components/icons/icons";
import { useState } from "react";
import MarkdownIt from "markdown-it";
// @ts-ignore
import mdKatex from "markdown-it-katex";
import mdHighlight from "markdown-it-highlightjs";
import { CopyOutlined, CloudOutlined, CheckOutlined } from "@ant-design/icons";
import { IMessage } from "@/helper/types";

const md1 = {
    content: `
# 1
## 22
### 3434

>dfaef1231ddddddddddddddddddddfawef2  3412dddddddddddfawef2  34123dddddddddddfawef2  34123dddddddddddfawef2  34123dddddddddddfawef2  341233

\`dfaf\`
**daff**

\`\`\`ts
  let a = "dfaef";
  console.log(a);
\`\`\`

要在Next.js项目中添加Markdown样式表，您可以使用CSS文件或CSS模块。

1. 使用CSS文件：

- 创建一个CSS文件，例如markdownStyles.css。
- 在_app.js文件中导入CSS文件：

  \`\`\`ts
  import '../styles/markdownStyles.css'
  \`\`\`

$1^3$

$$ {7} \\over{2}$$
`,
    role: "assistant",
};

const md2 = {
    content: `请问`,
    role: "user",
};

function getStaticProps(message: string) {
    const md = MarkdownIt({ html: false }).use(mdKatex).use(mdHighlight);
    const fence = md.renderer.rules.fence!;
    md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args;
        const token = tokens[idx];
        const rawCode = fence(...args);

        // <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><path fill="currentColor" d="M28 10v18H10V10h18m0-2H10a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z" /><path fill="currentColor" d="M4 18H2V4a2 2 0 0 1 2-2h14v2H4Z" /></svg>
        return `<div class="relative">
    <div data-code=${encodeURIComponent(
        token.content
    )} class="copy-btn absolute top-0 right-0 z-3 flex justify-center items-center b-transparent w-8 h-8 p-2 bg-dark-300 op-90 transition-all group cursor-pointer">
            <div class="opacity-0 h-7 bg-black px-2.5 py-1 box-border text-xs c-white inline-flex justify-center items-center  rounded absolute z-1 transition duration-600 whitespace-nowrap -top-8" group-hover:opacity-100>

            </div>
    </div>
    ${rawCode}
    </div>`;
    };
    return md.render(message);
}

const ChatMsg: React.FC<{
    chatMessage: IMessage;
}> = (props) => {
    const { chatMessage } = props;
    const [message, setMessage] = useState<IMessage>(chatMessage);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    useEffect(() => {
        setMessage(chatMessage);
    }, [chatMessage]);

    const handleCopy = () => {
        // const permissionName = "clipboard-write" as PermissionName;
        // const permissionStatus = await navigator.permissions.query({
        //     name: permissionName,
        // });
        // if (permissionStatus.state === "granted") {
        //     navigator.clipboard.writeText(message.content);
        // } else {
        const textArea = document.createElement("textarea");
        textArea.value = message.content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        // }

        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    };

    return (
        <div
            className={`block w-full ${
                message.role === "assistant" ? "bg-gray-50" : "bg-white"
            } border-b border-black/10 text-gray-800`}
        >
            <div className="m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                <div className="relative flex w-[30px] flex-col items-end">
                    <div
                        className="relative flex h-[30px] w-[30px] items-center justify-center rounded-sm p-1 text-white"
                        style={{
                            backgroundColor:
                                message.role === "user"
                                    ? "rgb(51, 73, 93)"
                                    : "rgb(16, 163, 127)",
                        }}
                    >
                        {message.role === "user" ? (
                            <CloudOutlined />
                        ) : (
                            <AIIcon />
                        )}
                    </div>
                </div>
                <div className="flex max-w-[calc(100%-60px-3rem)] flex-1">
                    <div
                        className="message prose block max-w-full break-words"
                        dangerouslySetInnerHTML={{
                            __html: getStaticProps(message.content),
                            // __html: getStaticProps(md1.content),
                        }}
                    />
                </div>
                <div className="relative flex w-[30px] flex-col items-end">
                    <div className="relative flex h-[30px] w-[30px] items-center justify-center rounded-sm">
                        <button
                            className={`relative h-[30px] w-[30px] rounded-md pb-2  ${
                                isCopied ? "text-mytext" : "text-gray-400"
                            } hover:bg-gray-200 ${
                                isCopied ? "text-mytext" : "hover:text-gray-700"
                            }`}
                            onClick={handleCopy}
                        >
                            {isCopied ? <CheckOutlined /> : <CopyOutlined />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMsg;
