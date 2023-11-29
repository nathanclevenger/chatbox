import createChatBoxAPI from "@upstash/chatbox/api";

const ChatBoxAPI = createChatBoxAPI({
  webhooks: [process.env.SLACK_WEBHOOK_URL!],
  db: 'chatbox',
  collection: 'chats',
});

export default ChatBoxAPI;
