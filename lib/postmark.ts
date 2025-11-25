import { ServerClient } from 'postmark';

const serverToken = process.env.POSTMARK_SERVER_TOKEN;

if (!serverToken) {
    throw new Error("Missing POSTMARK_SERVER_TOKEN env variable");
}

export const postmarkClient = new ServerClient(serverToken);