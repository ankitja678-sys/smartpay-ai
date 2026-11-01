
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
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message is too long. Maximum 4000 characters." },
        { status: 400 }
      );
    }

    const transactions = Array.isArray(body.transactions)
      ? body.transactions.slice(0, 50)
      : [];

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are SmartPay AI, a helpful payment analytics assistant.

Help users understand their payment dashboard, transactions,
pending payments, failed payments, risks and business insights.

Important rules:
- Use simple, clear English.
- Give practical and concise answers.
- Treat the supplied transaction data as demo data.
- Never claim that a real payment was processed.
- If the data does not support an answer, say so.
- Never request passwords, API keys or card details.

DEMO TRANSACTION DATA:
${JSON.stringify(transactions)}

USER QUESTION:
${message}
      `,
    });

    const answer = response.text?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "AI could not generate a response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: answer });
  } catch (error) {
    console.error("SmartPay AI error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
