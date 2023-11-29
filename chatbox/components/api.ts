import { MongoClient } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";

const client = new MongoClient(process.env.MONGODB_URI as string);

type ChatApiOptions = {
  db?: string;
  collection?: string;
  webhooks: string[];
};

export default (options: ChatApiOptions) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method;
    const api = req.query.chatbox[0];
    const chatId = req.query.chatbox[1];
    const host = `http://${req.headers.host}`;

    try {
      if (!chatId) throw new Error("Missing chatId");
      const db = client.db(options.db);
      const collection = db.collection(options.collection ?? 'chats');

      switch (api) {
        case "chat":
          switch (method) {
            case "GET":
              const chatData = await collection.find({ chatId }).toArray();
              return res.status(200).json({ chatData });

            case "POST":
              const chatText = req.body.text;
              const response = await collection.insertOne({ chatId, text: chatText });
              return res.status(200).json({ response });

            default:
              throw new Error("Method not allowed");
          }

        case "slack-email":
          if (method !== "POST") throw new Error("Method not allowed");

          const slackEmail = req.body.email;
          if (!slackEmail) throw new Error("Missing email");

          const notifyEmailText = `A user left their email address ${slackEmail} with chat id: ${host}/chat/${chatId}`;

          const requestsEmail = options.webhooks.map(webhook => fetch(webhook, {
            method: "POST",
            body: JSON.stringify({ text: notifyEmailText }),
            headers: {
              "Content-Type": "application/json",
            },
          }));

          await Promise.all(requestsEmail);
          return res.status(200).json({ response: "ok" });

        case "slack":
          if (method !== "POST") throw new Error("Method not allowed");

          let notifyText = `New chat with id: ${host}/chat/${chatId}`;
          if (req.body) {
            notifyText = `Old chat with id: ${host}/chat/${chatId} has a new message!`;
          }

          const requestsNotify = options.webhooks.map(webhook => fetch(webhook, {
            method: "POST",
            body: JSON.stringify({ text: notifyText }),
            headers: {
              "Content-Type": "application/json",
            },
          }));

          await Promise.all(requestsNotify);
          return res.status(200).json({ response: "ok" });

        default:
          throw new Error("Method not allowed");
      }
    } catch (err) {
      console.log(err);
      const message = err instanceof TypeError ? err.message : err;
      return res.status(500).json({ message });
    }
  };
};
