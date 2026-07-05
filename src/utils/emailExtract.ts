import { google } from "googleapis";

dotenv.config();

const CLIENT_ID =process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN =process.env.REFRESH_TOKEN;

// OAuth2 client setup
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

// Recursive function to get email body
function getBody(payload) {
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }
  if (payload.parts && payload.parts.length) {
    for (const part of payload.parts) {
      const result = getBody(part);
      if (result) return result;
    }
  }
  return "";
}

export const emailExtract = async (email: string, maxResults = 20) => {
  // Step 1: List messages for the email
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: email ? `from:${email} OR to:${email}` : "",
    maxResults,
  });

  const messages = listRes.data.messages || [];

  // Step 2: Fetch full message for each ID
  const fullMessages = [];
  for (const msg of messages) {
    const msgRes = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const payload = msgRes.data.payload;

    // Extract headers
    const headers = payload.headers || [];
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const from = headers.find((h) => h.name === "From")?.value || "";
    const to = headers.find((h) => h.name === "To")?.value || "";

    // Extract full body
    const body = getBody(payload) || msgRes.data.snippet || "";

    fullMessages.push({
      id: msg.id,
      threadId: msgRes.data.threadId,
      internalDate: msgRes.data.internalDate,
      subject,
      from,
      to,
      body,
    });
  }
  return fullMessages;
};
