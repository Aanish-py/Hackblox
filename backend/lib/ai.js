const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Analyze a dispute using GPT-4o and return structured recommendation
 * @param {object} params
 * @returns {Promise<object>} AI recommendation
 */
async function analyzeDispute({ gigId, disputeReason, submissionDescription, evidence = [] }) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
    const err = new Error("OpenAI API key not configured. Set OPENAI_API_KEY in backend/.env to enable AI dispute analysis.");
    err.code = "OPENAI_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  const evidenceText = evidence.map((e, i) => `[Evidence ${i + 1}] ${e}`).join("\n");

  const prompt = `You are an impartial dispute arbitrator for a decentralized freelance platform called GigChain.

GIG ID: ${gigId}

DISPUTE REASON (from raising party):
${disputeReason}

FREELANCER'S SUBMISSION DESCRIPTION:
${submissionDescription || "Not provided"}

ADDITIONAL EVIDENCE:
${evidenceText || "None submitted"}

Analyze this dispute impartially and return a JSON object with exactly these fields:
{
  "recommendation": "release_to_freelancer" or "refund_to_client",
  "confidence": 0.0 to 1.0,
  "reasoning": "Detailed explanation of your analysis",
  "suggested_resolution": "Specific actionable resolution text"
}

Base your decision on:
1. Whether the freelancer clearly delivered per the milestone description
2. Whether the client's dispute reason is substantiated
3. Whether the evidence supports one party over the other
4. Fairness and the spirit of the original agreement

Return only valid JSON, no markdown.`;

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = res.data.choices[0].message.content;
  return JSON.parse(content);
}

module.exports = { analyzeDispute };
