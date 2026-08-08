import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ProblemSchema = new mongoose.Schema({
  problem_id: String,
  title: String,
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'] },
  category: String,
  description: String,
  constraints: [String],
  function_signature: { javascript: String, python: String, cpp: String, java: String },
  driver_code_template: String,
  examples: [{ input: String, output: String, explanation: String }],
  starterCode: { javascript: String, python: String, cpp: String, java: String },
  testCases: [{ input: String, expectedOutput: String, expected_output: String, is_hidden: { type: Boolean, default: false } }],
  timeComplexity: String,
  spaceComplexity: String
}, { strict: false });

const Problem = mongoose.model('Problem', ProblemSchema);

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Ai-Career-copilot';

try {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected to MongoDB:', MONGO_URI.split('@').pop() || MONGO_URI);

  const raw = fs.readFileSync(path.join(__dirname, 'problems.json'), 'utf8');
  const problems = JSON.parse(raw);
  console.log(`📦 Loaded ${problems.length} problems from problems.json`);

  await Problem.deleteMany({});
  console.log('🗑️  Cleared existing problems collection');

  const result = await Problem.insertMany(problems, { ordered: false });
  console.log(`✅ Successfully seeded ${result.length} problems into MongoDB`);

} catch (err) {
  console.error('❌ Seed failed:', err.message);
} finally {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}
