let Problem;

try {
  const mongoose = (await import("mongoose")).default;

  const ProblemSchema = new mongoose.Schema(
    {
      questionId: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      slug: { type: String, required: true },
      difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
      description: { type: String },
      topicTags: [String],
      codeSnippets: [
        {
          lang: String,
          langSlug: String,
          code: String
        }
      ],
      sampleTestCases: [
        {
          input: String,
          output: String
        }
      ]
    },
    { timestamps: true }
  );

  // Search indexes
  ProblemSchema.index({ title: "text", slug: "text", topicTags: "text" });

  Problem = mongoose.models.Problem || mongoose.model("Problem", ProblemSchema);
} catch {
  // In-Memory Model Fallback
  Problem = {
    find: async () => [],
    findOne: async () => null,
    findById: async () => null,
    create: async (data) => data,
    deleteMany: async () => {},
    insertMany: async (data) => data,
    countDocuments: async () => 0
  };
}

export default Problem;
