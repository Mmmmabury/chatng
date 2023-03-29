import { log } from "@/helper/logger";
import { IMessage, ISession, IUser } from "@/helper/types";
import { Level } from "level";
import _ from "lodash";

export class DBHandle {
    private sessionDB: Level;
    private messageDB: Level;
    private userDB: Level;

    constructor() {
        if (typeof window !== "undefined") {
            this.sessionDB = new Level("session", { valueEncoding: "json" });
            this.messageDB = new Level("message", { valueEncoding: "json" });
            this.userDB = new Level("user", { valueEncoding: "json" });
        } else {
            this.sessionDB = new Level("./.db/session", {
                valueEncoding: "json",
            });
            this.messageDB = new Level("./.db/message", {
                valueEncoding: "json",
            });
            this.userDB = new Level("./.db/user", { valueEncoding: "json" });
        }
    }
    /** --------------- user --------------- */
    public async addUser(user: IUser) {
        log.debug("addUser");
        await this.userDB.put("user", JSON.stringify(user));
    }

    public async getUser(): Promise<IUser> {
        const user = await this.userDB.get("user");
        return JSON.parse(user);
    }

    /** --------------- message --------------- */
    public async addMessage(message: IMessage) {
        const session = await this.getSession(message.sessionId);
        session.messageIds.push(message.id);
        await this.sessionDB.put(session.id, JSON.stringify(session));
        await this.messageDB.put(message.id, JSON.stringify(message));
    }
    public async getMessages(sessionId: string): Promise<IMessage[]> {
        const session = await this.getSession(sessionId);
        const messages: IMessage[] = [];

        for (const messageId of session.messageIds) {
            const messageData = await this.messageDB.get(messageId);
            const message = JSON.parse(messageData) as IMessage;
            messages.push(message);
        }

        return messages;
    }
    //** --------------- session --------------- */
    public async addSession(session: ISession) {
        var user = await this.getUser();
        user.sessionIds.unshift(session.id);
        await this.addUser(user);
        await this.sessionDB.put(session.id, JSON.stringify(session));
    }

    public async getSessionsByUserId(userId: string): Promise<ISession[]> {
        const user = await this.getUser();
        const sessions: ISession[] = [];
        if (user.sessionIds.length > 0) {
            for (const sessionId of user.sessionIds) {
                const session = await this.getSession(sessionId);
                sessions.push(session);
            }
        }
        return sessions;
    }

    public async getSession(sessionId: string): Promise<ISession> {
        const sessionData = await this.sessionDB.get(sessionId);
        const session = JSON.parse(sessionData) as ISession;
        return session;
    }

    public async updateSession(session: ISession) {
        await this.sessionDB.put(session.id, JSON.stringify(session));
    }

    public async deleteSession(sessionId: string): Promise<IUser> {
        const user = await this.getUser();
        _.pull(user.sessionIds, sessionId);
        await this.userDB.put("user", JSON.stringify(user));
        await this.sessionDB.del(sessionId);
        return user;
    }

    public async clearAllSession(): Promise<void> {
        await this.sessionDB.clear();
        var user = await this.getUser();
        user.sessionIds = [];
        await this.userDB.put("user", JSON.stringify(user));
    }
    /** --------------- other --------------- */
    public async clearDB() {
        await this.sessionDB.clear();
        await this.userDB.clear();
        await this.messageDB.clear();
    }

    public async closeDB() {
        await this.sessionDB.close();
        await this.userDB.close();
        await this.messageDB.close();
    }
}
