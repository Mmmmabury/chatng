import ProxyAgent from "undici/types/proxy-agent";

export type IRole = "assistant" | "user" | "";

export interface IMessage {
  sessionId: string;
  id: string;
  content: string;
  role: IRole;
}

export interface IInitOptions {
  headers: {
    "Content-Type": "application/json";
    Authorization: string;
  };
  method: "POST";
  body: string;
  dispatcher?: ProxyAgent;
}

// 聊天会话
export interface ISession {
  id: string;
  title: string;
  userId: string;
  messageIds: string[];
}

export interface IUser {
  id: string;
  sessionIds: string[];
}
