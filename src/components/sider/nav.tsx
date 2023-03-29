import React, { MouseEventHandler, useEffect, useRef, useState } from "react";
import { Menu, Layout, ConfigProvider, Input, InputRef } from "antd";
import {
    DeleteOutlined,
    ExportOutlined,
    InfoCircleOutlined,
    MessageOutlined,
    QuestionOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { DBHandle } from "@/db/messageDB";
import { ISession, IUser } from "@/helper/types";
import { log } from "@/helper/logger";
import _ from "lodash";

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
    getItem<MenuItem>("清除所有对话", "1", <DeleteOutlined />),
    // getItem<MenuItem>("导出所有对话", "2", <ExportOutlined />),
    // getItem<MenuItem>("帮助", "3", <QuestionOutlined />),
    // getItem<MenuItem>("关于", "4", <InfoCircleOutlined />),
];

function getItem<T>(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    items?: MenuItem[]
): T {
    return {
        key,
        icon,
        items,
        label,
    } as T;
}

const ChatNav: React.FC<{
    clearSessions: Function;
    user: IUser | null;
    currentSession: ISession | null;
    addSession: Function;
    selectSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    editSession: (sessionId: string, title: string) => void;
}> = (props) => {
    const [collapsed, setCollapsed] = useState(false);
    const [sessions, setSessions] = useState<ISession[]>([]);
    const [sessionItems, setSessionItems] = useState<MenuItem[]>([]);
    const [isEdit, setIsEdit] = useState<string>("");
    const [isDelete, setIsDelete] = useState<string>("");
    const sessionTitleInput = useRef<HTMLInputElement>(null);
    const [selectionStart, setSelectionStart] = useState<number>(0);
    const [selectionEnd, setSelectionEnd] = useState<number>(0);
    const [changeText, setChangeText] = useState<string>("");

    const handleMenuClick = (e: MenuItem) => {
        switch (e!.key) {
            case "1":
                if (props.clearSessions) {
                    props.clearSessions();
                }
                break;
            case "2":
                // const db = new DBHandle();
                // db.clearDB();
                break;
        }
    };

    const handleSessionMenuClick = (e: MenuItem) => {
        if (e!.key === "chatAddSession") {
            props.addSession();
        } else {
            if (!isEdit && !isDelete) {
                props.selectSession(e!.key! as string);
            }
        }
    };

    const handleToggleDeleteView = (id: string) => {
        log.debug("handleToggleDeleteView", isEdit);
        if (isEdit || isDelete) {
            // 如果是编辑状态，这里是退出的图标
            if (id === isDelete || id === isEdit) {
                setIsEdit("");
                setIsDelete("");
                setChangeText("");
            }
        } else {
            setIsDelete(id);
        }
    };

    const handleToggleEditView = (id: string) => {
        log.debug("handleToggleEditView", isEdit, id);
        if (isDelete || isEdit) {
            if (isDelete && id === isDelete) {
                props.deleteSession(id);
                setIsDelete("");
            }
            if (isEdit && id === isEdit) {
                log.info("change title", sessionTitleInput.current!.value!);
                props.editSession(id, sessionTitleInput.current!.value!);
                setIsEdit("");
            }
        } else {
            setIsEdit(id);
            const session = _.find(sessions, { id });
            setChangeText(session!.title);
        }
    };

    const handleOnBlur = () => {
        setIsEdit("");
        setChangeText("");
    };

    useEffect(() => {
        log.info("sessionInput change");
        if (sessionTitleInput.current) {
            log.info("select change", changeText);
        }
    }, [sessionTitleInput.current]);

    useEffect(() => {
        const addLabel = (
            <div className="flex h-full items-center justify-center">
                <PlusOutlined style={{ fontSize: "19px" }} />
            </div>
        );
        var sessionItems: MenuItem[] = [getItem(addLabel, "chatAddSession")];
        sessionItems = sessionItems.concat(
            sessions.map<MenuItem>((session) => {
                const label = (
                    <div className="flex flex-1">
                        <span className="flex max-w-[calc(100%-2rem)] flex-1 truncate">
                            {isEdit === session.id ? (
                                <input
                                    className="w-full border-none bg-inherit text-white outline-none"
                                    disabled={isEdit ? false : true}
                                    onBlur={handleOnBlur}
                                    ref={
                                        isEdit === session.id
                                            ? sessionTitleInput
                                            : null
                                    }
                                    type="text"
                                ></input>
                            ) : (
                                <div>{session.title}</div>
                            )}
                        </span>
                        <button
                            className="w-6"
                            onMouseDown={(
                                e: React.MouseEvent<HTMLButtonElement>
                            ) => {
                                if (e.button == 0) {
                                    e.preventDefault();
                                    handleToggleEditView(session.id);
                                }
                            }}
                        >
                            {isEdit === session.id ||
                            isDelete === session.id ? (
                                <CheckOutlined />
                            ) : (
                                <EditOutlined />
                            )}
                        </button>
                        <button
                            className="w-6"
                            onMouseDown={(
                                e: React.MouseEvent<HTMLButtonElement>
                            ) => {
                                if (e.button == 0) {
                                    e.preventDefault();
                                    handleToggleDeleteView(session.id);
                                }
                            }}
                        >
                            {isEdit === session.id ||
                            isDelete === session.id ? (
                                <CloseOutlined />
                            ) : (
                                <DeleteOutlined />
                            )}
                        </button>
                    </div>
                );
                return getItem(label, session.id, <MessageOutlined />);
            })
        );
        setSessionItems(sessionItems);
    }, [sessions, isEdit, isDelete]);

    useEffect(() => {
        if (props.user) {
            const db = new DBHandle();
            db.getSessionsByUserId(props.user.id)
                .then((sessions) => {
                    setSessions(sessions);
                })
                .catch((err) => {
                    log.error("nav db error ", err);
                })
                .finally(() => {
                    db.closeDB();
                });
        }
    }, [props.user]);

    useEffect(() => {
        if (isEdit && sessionTitleInput.current) {
            log.info("focus", changeText, sessionTitleInput.current!.value);
            sessionTitleInput.current!.focus();
            sessionTitleInput.current!.value = changeText;
        }
    }, [sessionItems]);

    return (
        <Sider
            className="flex flex-col"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
        >
            <div className="flex-1 flex-col overflow-y-auto border-b border-white/20">
                <Menu
                    className="text-white"
                    theme="dark"
                    selectable={true}
                    selectedKeys={[props.currentSession?.id || ""]}
                    items={sessionItems}
                    onClick={handleSessionMenuClick}
                ></Menu>
            </div>
            <Menu
                mode="vertical"
                className="mt-3 mb-2 text-sm text-white"
                theme="dark"
                selectable={false}
                items={items}
                onClick={handleMenuClick}
            />
        </Sider>
    );
};

export default ChatNav;
