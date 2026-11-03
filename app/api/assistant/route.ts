
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";



const apiKey = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const MAX_ATTEMPTS = 3;

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return undefined;
}

function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);

  if ([408, 429, 500, 502, 503, 504].includes(status ?? 0)) {
    return true;
  }

  // Temporary network errors
  if (error instanceof TypeError) {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error
  ) {
    const cause = error.cause;

    if (
      typeof cause === "object" &&
      cause !== null &&
      "code" in cause &&
      typeof cause.code === "string" &&
      [
        "UND_ERR_CONNECT_TIMEOUT",
        "ECONNRESET",
        "ETIMEDOUT",
        "ECONNREFUSED",
      ].includes(cause.code)
    ) {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return NextResponse.json(
          { error: "Invalid request body." },
          { status: 400 }
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request." },
        { status: 400 }
      );
    }

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

    const prompt = `
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
`;

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
        });

        const answer = response.text?.trim();

        if (!answer) {
          return NextResponse.json(
            {
              error:
                "AI could not generate a response. Please try again.",
            },
            { status: 502 }
          );
        }

        return NextResponse.json({ reply: answer });
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini request attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
          error
        );

        if (
          attempt === MAX_ATTEMPTS ||
          !isRetryableError(error)
        ) {
          break;
        }

        // Wait 1 second, then 2 seconds before retrying.
        await wait(1000 * attempt);
      }
    }

    const status = getErrorStatus(lastError);

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "AI service is receiving too many requests. Please try again shortly.",
        },
        { status: 429 }
      );
    }

    if (
      status === 503 ||
      status === 502 ||
      status === 504 ||
      isRetryableError(lastError)
    ) {
      return NextResponse.json(
        {
          error:
            "AI service is temporarily unavailable. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "AI request failed. Please try again later.",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("SmartPay AI route error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
