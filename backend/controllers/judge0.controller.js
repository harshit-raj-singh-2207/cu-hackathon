import { runCodeOnJudge0 } from '../services/judge0.service.js';

export const executeCode = async (req, res) => {
  try {
    const { sourceCode, languageId, stdin } = req.body;

    if (!sourceCode || !languageId) {
      return res.status(400).json({ error: 'sourceCode and languageId are required fields' });
    }

    const result = await runCodeOnJudge0(sourceCode, languageId, stdin);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};