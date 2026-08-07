import axios from 'axios';

export const runCodeOnJudge0 = async (source_code, language_id, stdin = '') => {
  try {
    // Step 1: Submit code to Judge0
    const submissionResponse = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code,
        language_id: Number(language_id),
        stdin,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      }
    );

    const data = submissionResponse.data;

    // Standardized Output return
    return {
      status: data.status?.description || 'Executed',
      stdout: data.stdout || null,
      stderr: data.stderr || null,
      compile_output: data.compile_output || null,
      time: data.time,
      memory: data.memory
    };

  } catch (error) {
    console.error('Judge0 Service Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to execute code on Judge0');
  }
};