import axios from "axios";

async function testAllEndpoints() {
  console.log("🔍 Testing Backend Endpoints...");

  try {
    // 1. Test GET /api/problems
    const resProblems = await axios.get("http://localhost:5000/api/problems");
    console.log("1. GET /api/problems:", resProblems.status, "Count:", resProblems.data?.problems?.length);
  } catch (err) {
    console.error("❌ GET /api/problems failed:", err.message);
  }

  try {
    // 2. Test POST /api/ai/copilot
    const resAi = await axios.post("http://localhost:5000/api/ai/copilot", {
      actionType: "HINT",
      code: "function twoSum(nums, target) { for(let i=0; i<nums.length; i++) { for(let j=i+1; j<nums.length; j++) { if(nums[i]+nums[j]===target) return [i,j]; } } }",
      problemTitle: "Two Sum"
    });
    console.log("2. POST /api/ai/copilot:", resAi.status, "\nReply:\n", resAi.data?.reply);
  } catch (err) {
    console.error("❌ POST /api/ai/copilot failed:", err.message);
  }

  try {
    // 3. Test POST /api/run-code
    const resRun = await axios.post("http://localhost:5000/api/run-code", {
      problemId: 1,
      code: "function twoSum() { return [0, 1]; }",
      language: "javascript"
    });
    console.log("3. POST /api/run-code:", resRun.status, "Status:", resRun.data?.status);
  } catch (err) {
    console.error("❌ POST /api/run-code failed:", err.message);
  }
}

testAllEndpoints();
