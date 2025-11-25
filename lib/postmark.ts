import * as postmark from "postmark";

const serverToken = process.env.POSTMARK_SERVER_TOKEN;

if (!serverToken) {
    console.warn("⚠️ POSTMARK_SERVER_TOKEN is missing. Emails will not send.");
}

export const postmarkClient = new postmark.ServerClient(serverToken || "fake-token");