const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI2 ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/Ai-Career-copilot";

  try {
    const mongoose = (await import("mongoose")).default;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn("⚠️ Running server with in-memory dataset & fallback execution engine.");
  }
};

export default connectDB;