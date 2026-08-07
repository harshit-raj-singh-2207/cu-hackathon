let Submission;

try {
  const mongoose = (await import("mongoose")).default;

  const SubmissionSchema = new mongoose.Schema(
    {
      userId: { type: String, default: "anonymous-user", index: true },
      problemId: { type: String, required: true, index: true },
      problemTitle: { type: String },
      code: { type: String, required: true },
      language: { type: String, required: true },
      status: {
        type: String,
        enum: ["ACCEPTED", "WRONG_ANSWER", "RUNTIME_ERROR", "COMPILE_ERROR", "PENDING"],
        required: true
      },
      executionTime: { type: String, default: "N/A" },
      memory: { type: String, default: "N/A" },
      passedTestCases: { type: Number, default: 0 },
      totalTestCases: { type: Number, default: 0 },
      output: { type: String, default: "" }
    },
    { timestamps: true }
  );

  Submission = mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);
} catch {
  Submission = {
    find: async () => [],
    create: async (data) => data
  };
}

export default Submission;
