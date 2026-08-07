let ChatHistory;

try {
  const mongoose = (await import("mongoose")).default;

  const MessageSchema = new mongoose.Schema(
    {
      sender: { type: String, enum: ["user", "ai"], required: true },
      actionType: { type: String, default: "CHAT" },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    },
    { _id: false }
  );

  const ChatHistorySchema = new mongoose.Schema(
    {
      userId: { type: String, default: "anonymous-user", index: true },
      problemId: { type: String, required: true, index: true },
      messages: [MessageSchema]
    },
    { timestamps: true }
  );

  ChatHistory = mongoose.models.ChatHistory || mongoose.model("ChatHistory", ChatHistorySchema);
} catch {
  ChatHistory = {
    find: async () => [],
    create: async (data) => data
  };
}

export default ChatHistory;
