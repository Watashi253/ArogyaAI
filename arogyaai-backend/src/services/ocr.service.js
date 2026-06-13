import { callGemini, parseJsonResponse } from "../ai/gemini.js";

export async function extractLabValues(fileBuffer, mimeType) {
  const prompt = `
Analyze this medical report.

Extract all laboratory values.

Return ONLY valid JSON.

{
  "values": [
    {
      "parameter": "Hemoglobin",
      "value": 13.2,
      "unit": "g/dL",
      "referenceRange": "12-16",
      "isAbnormal": false
    }
  ],
  "testDate": "2024-01-15",
  "labName": "Apollo Diagnostics"
}

Return empty array if no lab values exist.
`;

  const response = await callGemini(prompt, {
    data: fileBuffer.toString("base64"),
    mimeType,
  });

  return parseJsonResponse(response);
}