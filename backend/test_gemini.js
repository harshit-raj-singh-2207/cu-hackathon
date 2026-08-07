import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
console.log("Testing API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "NONE");

async function testGemini() {
  const modelsToTest = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTest) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello! Reply in 1 short sentence.");
      console.log(`✅ Success with ${modelName}:`, result.response.text());
      return;
    } catch (err) {
      console.error(`❌ Failed with ${modelName}:`, err.message);
    }
  }
}

testGemini();


