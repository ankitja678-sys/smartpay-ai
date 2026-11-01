
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.transactions) || body.transactions.length === 0) {
      return NextResponse.json(
        { error: "Please provide transaction data." },
        { status: 400 }
      );
    }

    const transactions = body.transactions.slice(0, 50);

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are SmartPay AI, a demo transaction risk assessment assistant.

Analyze the following sample transactions and estimate potential risk.

For every transaction return:
- id: original transaction ID
- riskScore: integer from 0 to 100
- riskLevel: "Low", "Medium", or "High"
- reasons: array of short explanations
- recommendation: one practical action

Rules:
- Only use information present in the supplied data.
- Do not assume a failed or pending payment is fraudulent.
- Missing information must not be treated as proof of fraud.
- Clearly distinguish unusual activity from confirmed fraud.
- These are demo estimates, not verified fraud detections.
- Return valid JSON only, with this structure:
{
  "assessments": [
    {
      "id": "transaction-id",
      "riskScore": 20,
      "riskLevel": "Low",
      "reasons": ["Reason"],
      "recommendation": "Suggested action"
    }
  ]
}

TRANSACTIONS:
${JSON.stringify(transactions)}
      `,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");

    if (!Array.isArray(result.assessments)) {
      throw new Error("Invalid risk analysis response.");
    }

    return NextResponse.json({
      assessments: result.assessments,
      disclaimer: "AI-generated demo risk estimates, not confirmed fraud detection.",
    });
  } catch (error) {
    console.error("Fraud analysis error:", error);

    return NextResponse.json(
      { error: "Unable to analyze transaction risks. Please try again." },
      { status: 500 }
    );
  }
}
