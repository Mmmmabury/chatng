import React, {
    useState,
    ChangeEvent,
    KeyboardEvent,
    useRef,
    useEffect,
} from "react";
import { Input, Button } from "antd";
const { TextArea } = Input;
import { SendIcon } from "@/components/icons/icons";
import { log } from "@/helper/logger";

const ChatInput: React.FC<{ sendMsg: Function; isMsgHandling: boolean }> = (
    props
) => {
    const [message, setMessage] = useState<string>("");
    const [compositionEnd, setCompositionEnd] = useState<boolean>(true);
    const [isMsgHanding, setIsMsgHandling] = useState<boolean>(
        props.isMsgHandling
    );

    useEffect(() => {
        setIsMsgHandling(props.isMsgHandling);
    }, [props.isMsgHandling]);

    const handleSendMessage = () => {
        if (isMsgHanding) {
            return;
        }
        if (message.trim()) {
            log.info("send message:", message);
            if (props.sendMsg) {
                props.sendMsg(message);
            }
            setMessage("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && compositionEnd) {
            e.preventDefault(); // 阻止默认的换行行为
            handleSendMessage();
        }
    };

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(event.target.value);
    };

    const handleCompositionStartCapture = (
        event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
        log.info("Composition start");
        setCompositionEnd(false);
    };

    const handleCompositionEndCapture = (
        event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
        log.info("Composition end");
        setCompositionEnd(true);
    };

    return (
        <form className="stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-3xl">
            <div className="relative flex h-full flex-1 md:flex-col">
                <div className="relative flex w-full flex-grow flex-col rounded-md border  border-black/10 bg-white py-2 shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-gray-700 dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] md:py-3 md:pl-4">
                    <TextArea
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        bordered={false}
                        value={message}
                        onKeyDown={handleKeyDown}
                        onChange={handleChange}
                        onCompositionStartCapture={
                            handleCompositionStartCapture
                        }
                        onCompositionEndCapture={handleCompositionEndCapture}
                        placeholder="你想聊啥？"
                        className="m-0 w-full resize-none border-0 bg-transparent p-0 pr-7 pl-2 focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:pl-0"
                    ></TextArea>
                </div>
                <Button
                    icon={<SendIcon />}
                    type="text"
                    className="absolute bottom-1.5 right-1 h-auto w-auto rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:disabled:hover:bg-transparent md:bottom-2.5 md:right-2"
                    onClick={handleSendMessage}
                ></Button>
            </div>
        </form>
    );
};

export default ChatInput;
