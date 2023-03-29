import { log } from "@/helper/logger";
import { IMessage } from "@/helper/types";
import React from "react";
import ChatMsg from "./chatMsg";

const MessageArea: React.FC<{
    chatMessages: IMessage[];
    currentChatAssistantMessage: string | null;
}> = (props) => {
    const { chatMessages, currentChatAssistantMessage } = props;
    const [currentAssistantMessage, setCurrentAssistantMessage] =
        React.useState(currentChatAssistantMessage);
    const [messages, setMessages] = React.useState<IMessage[]>(chatMessages);
    const [canScroll, setCanScroll] = React.useState<boolean>(true);
    const msgContainer = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setMessages(chatMessages);
    }, [chatMessages]);

    React.useEffect(() => {
        setCurrentAssistantMessage(currentChatAssistantMessage);
        if (msgContainer.current && canScroll) {
            msgContainer.current.scrollTo(0, msgContainer.current.scrollHeight);
        }
    }, [currentChatAssistantMessage]);

    React.useEffect(() => {
        if (msgContainer.current && canScroll) {
            msgContainer.current.scrollTo(0, msgContainer.current.scrollHeight);
        }
    }, [messages]);

    const handleScroll = () => {
        const element = msgContainer.current!;
        // 滚动条距离顶部的距离
        const scrollTop = element.scrollTop;
        // 可滚动区域的高度
        const scrollHeight = element.scrollHeight;
        // 可视区域的高度
        const clientHeight = element.clientHeight;
        log.debug(
            `scrollTop: ${scrollTop}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, scrollTop+clientHeight: ${
                scrollTop + clientHeight
            }`
        );
        // 判断是否滚到底部
        const isBottom =
            Math.abs(scrollHeight - (scrollTop + clientHeight)) <= 10;
        if (!isBottom) {
            setCanScroll(false);
        } else {
            setCanScroll(true);
        }
    };

    return (
        <div className="flex-1 overflow-hidden bg-white">
            <div className="relative block h-full dark:bg-gray-800">
                <div
                    ref={msgContainer}
                    onScroll={handleScroll}
                    className="chat-container h-full overflow-auto transition-all duration-500 ease-in-out"
                >
                    <div className="flex flex-col items-center text-sm dark:bg-gray-800">
                        {messages.map((msg) => (
                            <ChatMsg key={msg.id} chatMessage={msg}></ChatMsg>
                        ))}
                        {currentAssistantMessage && (
                            <ChatMsg
                                key={"-1"}
                                chatMessage={{
                                    sessionId: "",
                                    id: "",
                                    content: currentAssistantMessage,
                                    role: "assistant",
                                }}
                            />
                        )}
                        <div className="h-32 w-full flex-shrink-0 bg-white md:h-48"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageArea;
