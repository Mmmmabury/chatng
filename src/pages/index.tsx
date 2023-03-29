import { useState, useEffect, useRef, useReducer, use } from "react";
import { Layout, message } from "antd";
import ChatInput from "@/components/chat/input";
import ChatNav from "@/components/sider/nav";
import MessageArea from "@/components/chat/chatMsgArea";
import type { IMessage, IRole, ISession, IUser } from "@/helper/types";
import { generateSignature, generateUUID } from "@/helper/auth";
import { DBHandle } from "@/db/messageDB";
import { log } from "@/helper/logger";
import _, { create } from "lodash";
import { Session } from "inspector";
import { logicalPropertiesLinter } from "@ant-design/cssinjs";
import { ArgsProps } from "antd/es/message";
import ToolArea from "@/components/chat/toolArea";

const { Header, Content, Footer, Sider } = Layout;

export default function Home() {
    const [user, setUser] = useState<IUser | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    // const [currentSession, setCurrentSession] = useState<ISession | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [currentAssistantMessage, setCurrentAssistantMessage] = useState<
        string | null
    >(null);
    const [isNewMsgSend, setIsNewMsgSend] = useState<boolean>(false);
    const [isFetchRemoteData, setIsFetchRemoteData] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [notice, setNotice] = useState<ArgsProps>({
        type: undefined,
        content: "",
    });
    const db = useRef(new DBHandle());
    const currentSessionSaver = useRef<ISession | null>(null);
    const [currentReaderController, setCurrentReaderController] =
        useState<AbortController | null>(null);
    const [currentSession, setCurrentSession] = useState<ISession | null>(
        currentSessionSaver.current
    );

    const handleSendMsg = (msg: string) => {
        if (!currentSession) {
            log.error("currentSession is null");
            return;
        }
        setIsNewMsgSend(true);
        addMsg(msg, "user");
    };

    const requestWithLatestMessage = async () => {
        if (!isNewMsgSend) {
            return;
        }
        let assistantMessage = "";
        setCurrentAssistantMessage("");
        try {
            const requestMessageList = messages.map(({ content, role }) => ({
                content,
                role,
            }));
            const timestamp = Date.now();
            const controller = new AbortController();
            setCurrentReaderController(controller);
            const fetchUrl = "/api/v1/chat/completions";
            const response = await fetch(fetchUrl, {
                // const response = await fetch("/api/v1/chat/completions", {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    messages: requestMessageList,
                    time: timestamp,
                    sign: await generateSignature({
                        t: timestamp,
                        m:
                            requestMessageList?.[requestMessageList.length - 1]
                                ?.content || "",
                    }),
                }),
                signal: controller.signal,
            });
            setIsNewMsgSend(false);
            setIsFetchRemoteData(true);
            log.debug("response: " + response.status);
            if (!response.ok) {
                if (response.body) {
                    const json = JSON.stringify(response.body);
                    throw new Error(
                        "response status: " + response.status + json
                    );
                } else {
                    throw new Error("response status: " + response.status);
                }
            } else {
                const data = response.body;
                if (!data) {
                    throw new Error("No data");
                }
                const reader = data.getReader();
                const decoder = new TextDecoder("utf-8");
                let done = false;
                log.debug("stream read start ");
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    if (value) {
                        let char = decoder.decode(value);
                        if (char === "\n" && assistantMessage!.endsWith("\n")) {
                            continue;
                        }
                        if (char) {
                            assistantMessage = assistantMessage + char;
                            setCurrentAssistantMessage(assistantMessage);
                        }
                    }
                    done = readerDone;
                }
                log.debug("stream read end");
            }
        } catch (e) {
            console.error(e);
            setIsFetchRemoteData(false);
            return;
        }
        addMsg(assistantMessage, "assistant");
        setIsFetchRemoteData(false);
    };

    const addMsg = (content: string, role: IRole) => {
        if (content) {
            const timeId =
                Date.now().toString() +
                Math.floor(Math.random() * 10).toString();
            var msg: IMessage = {
                sessionId: currentSession!.id,
                id: timeId.toString(),
                content: content,
                role: role,
            };
            setMessages((msgs) => [...msgs, msg]);
            db.current.addMessage(msg);
            log.info("message add success");
            setCurrentAssistantMessage(null);
        }
    };

    const handleClearSessions = () => {
        db.current.clearAllSession().then(() => {
            setMessages([]);
            setCurrentSession(null);
        });
    };

    const handleCreateSession = async () => {
        if (user) {
            const session = await createSession(user.id);
            db.current.getMessages(session.id).then((messages) => {
                setCurrentSession(session);
                setMessages(messages);
                log.debug(
                    "create session: ",
                    session.id,
                    "load messages: ",
                    messages
                );
            });
        } else {
            log.error("user is null");
        }
    };

    const handleSelectSession = (sessionId: string) => {
        if (sessionId) {
            db.current
                .getSession(sessionId)
                .then((session) => {
                    db.current.getMessages(session.id).then((messages) => {
                        setCurrentSession(session);
                        setMessages(messages);
                        log.debug(
                            "select session: ",
                            sessionId,
                            "load messages: ",
                            messages
                        );
                    });
                })
                .catch((e) => {
                    log.error("selectSession error", e);
                });
        } else {
            log.error("sessionId is null");
        }
    };

    const deleteSession = (sessionId: string) => {
        var currentSession = currentSessionSaver.current;
        log.info(
            "delete sessionId: ",
            sessionId,
            "current",
            currentSessionSaver.current?.id
        );
        log.info("user", user);
        if (!user || !currentSession) {
            log.error("currentSession is null");
            return;
        }
        if (sessionId == currentSession.id) {
            if (user!.sessionIds.length == 1) {
                log.error("user has only one session");
                //如果只有一个 session，不能删除
                setNotice({
                    type: "error",
                    content: "只有一个会话，不能删除",
                });
            } else {
                //如果是当前的session，则删除后选择下一个session
                const sessionIndex = user.sessionIds.indexOf(sessionId);
                var nextSessionId = "";
                if (sessionIndex == user.sessionIds.length - 1) {
                    //如果是最后一个session，则选择第一个session
                    nextSessionId = user.sessionIds[0];
                } else {
                    nextSessionId = user.sessionIds[sessionIndex + 1];
                }
                db.current.deleteSession(sessionId).then((user) => {
                    setUser(user);
                    db.current.getSession(nextSessionId).then((session) => {
                        setCurrentSession(session);
                        db.current.getMessages(session.id).then((messages) => {
                            setMessages(messages);
                        });
                    });
                });
            }
        } else {
            db.current.deleteSession(sessionId).then((user) => {
                setUser(user);
            });
        }
        log.info("delete session success");
    };

    const handleEditSession = async (sessionId: string, title: string) => {
        var session = await db.current.getSession(sessionId);
        session.title = title;
        await db.current.updateSession(session);
        // 深拷贝触发刷新
        const use1 = _.cloneDeep(user);
        setUser(use1);
    };

    const handleStopRes = async () => {
        if (currentReaderController) {
            currentReaderController.abort();
        }
    };

    const createSession = async (userId: string) => {
        return await db.current.getUser().then(async (user) => {
            var title = "New";
            if (user && user.sessionIds.length > 0)
                title = `New ${user!.sessionIds.length}`;
            const sessionId = Date.now().toString();
            const session = {
                id: sessionId,
                userId: userId,
                title: title,
                messageIds: [],
            };
            await db.current.addSession(session);
            setCurrentSession(session);
            setUser(await db.current.getUser());
            log.debug("create sessionId: " + sessionId, "user", user);
            return session;
        });
    };

    const loadAllData = () => {
        if (isLoading) {
            log.debug("loadAllData, isLoading: " + isLoading);
            return;
        }
        log.debug("loadAllData");
        setIsLoading(true);
        const createUser = async () => {
            const userId = generateUUID();
            const user = {
                id: userId,
                sessionIds: [],
            };

            setUser(user);
            await db.current.addUser(user);
            log.debug("create userId: " + userId);
            return user;
        };

        db.current
            .getUser()
            .then((user) => {
                setUser(user);
                log.debug("user exsit: ", user);
                db.current
                    .getSessionsByUserId(user.id)
                    .then((sessions) => {
                        if (sessions.length == 0) {
                            createSession(user.id);
                            setIsLoading(false);
                        } else {
                            const session = sessions[0];
                            db.current
                                .getMessages(session.id)
                                .then((messages) => {
                                    setIsLoading(false);
                                    setMessages(messages);
                                    log.debug("load messages: ", messages);
                                })
                                .catch((e) => {
                                    setIsLoading(false);
                                });
                            setCurrentSession(session);
                            log.debug("currentSession: ", session);
                        }
                    })
                    .catch((err) => {
                        log.error(err.message);
                        setIsLoading(false);
                    });
            })
            .catch((err) => {
                if (err.message === "Entry not found") {
                    const user = createUser().then((user) => {
                        createSession(user.id);
                    });
                } else {
                    log.error(err.message);
                }
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (notice.content) {
            messageApi.open(notice);
        }
    }, [notice]);

    useEffect(() => {
        log.info("Component mounted", isLoading);
        const throttledLoadAllData = _.throttle(loadAllData, 1000);
        throttledLoadAllData();
        return () => {};
    }, []);

    useEffect(() => {
        if (messages?.[messages.length - 1]?.role === "user") {
            requestWithLatestMessage();
        }
    }, [messages]);

    useEffect(() => {
        currentSessionSaver.current = currentSession;
        if (currentSession) {
            log.info("currentSession: ", currentSession.id);
        } else {
            loadAllData();
            log.info("currentSession: null");
        }
    }, [currentSession]);

    return (
        <>
            {contextHolder}
            <Layout style={{ height: "100vh" }}>
                <ChatNav
                    currentSession={currentSession}
                    clearSessions={handleClearSessions}
                    addSession={handleCreateSession}
                    selectSession={handleSelectSession}
                    deleteSession={deleteSession}
                    editSession={handleEditSession}
                    user={user}
                ></ChatNav>
                <Layout className="site-layout">
                    <Content className="transition-width relative flex h-full w-full flex-1 flex-col items-stretch overflow-hidden">
                        <MessageArea
                            chatMessages={messages}
                            currentChatAssistantMessage={
                                currentAssistantMessage
                            }
                        />
                        <div className="md:bg-vert-light-gradient dark:md:bg-vert-dark-gradient absolute bottom-0 left-0 w-full border-t bg-white pt-2 dark:border-white/20 dark:bg-gray-800 md:border-t-0 md:border-transparent md:!bg-transparent md:dark:border-transparent">
                            <ToolArea
                                showRg={false}
                                showStop={isFetchRemoteData}
                                msg={errorMsg}
                                handleStop={handleStopRes}
                            />
                            <ChatInput
                                isMsgHandling={
                                    isFetchRemoteData || isNewMsgSend
                                }
                                sendMsg={handleSendMsg}
                            />
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
}
